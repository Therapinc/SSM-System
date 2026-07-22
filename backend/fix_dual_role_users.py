# -*- coding: utf-8 -*-
"""
fix_dual_role_users.py
======================
One-time fix for the deployed Neon DB.

Problem:
    Some people are registered as BOTH a teacher and a therapist in the
    teachers/therapists profile tables, but only have ONE user account (one role).
    The old code had a UNIQUE constraint on users.email which prevented a second row.

What this script does:
    1. Connects to your Neon DB via DATABASE_URL.
    2. Finds every person whose email appears in BOTH teachers and therapists tables.
    3. For each such person, checks if they have BOTH a 'teacher' AND a 'therapist'
       user row in the users table.
    4. Creates the MISSING role account (copying the hashed_password from the
       existing account) with a short role-suffixed username (e.g. john_th / john_tr).
    5. Also reports people who have a profile but NO user account at all.

Usage:
    1. Set your Neon DATABASE_URL as an env var:
           $env:DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
       OR paste it directly into the DATABASE_URL variable below.
    2. Run:  python fix_dual_role_users.py --dry-run    (preview only)
    3. Run:  python fix_dual_role_users.py              (apply changes)

Requirements:
    pip install psycopg2-binary
"""

import os
import sys
import argparse

# ---------------------------------------------------------------------------
# CONFIG — paste your Neon DATABASE_URL here, or set the env var
# ---------------------------------------------------------------------------
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    ""   # <-- paste your Neon connection string here if not using env var
         # e.g. "postgresql://user:pass@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
)
# ---------------------------------------------------------------------------

ROLE_SUFFIX = {
    "teacher": "tr",
    "therapist": "th",
}


def get_conn():
    try:
        import psycopg2
    except ImportError:
        print("ERROR: psycopg2 not installed. Run:  pip install psycopg2-binary")
        sys.exit(1)

    url = DATABASE_URL.strip().strip("\"'")
    if not url:
        print("ERROR: DATABASE_URL is not set.")
        print("  Option 1: Set the DATABASE_URL environment variable")
        print("  Option 2: Paste it directly in this script (see CONFIG section)")
        sys.exit(1)

    # Neon URLs sometimes start with postgres:// — psycopg2 needs postgresql://
    url = url.replace("postgres://", "postgresql://", 1)
    return psycopg2.connect(url)


def find_or_build_username(cur, base: str, role: str) -> str:
    """Return a unique username for this role, using a suffix if the base is taken."""
    abbr = ROLE_SUFFIX.get(role, role[:2])
    candidate = base

    cur.execute("SELECT id, role FROM users WHERE LOWER(username) = LOWER(%s)", (candidate,))
    row = cur.fetchone()
    if not row or row[1].lower() == role:
        return candidate  # available, or already belongs to this role

    # Base username taken by a different role — try base_abbr (e.g. john_tr)
    candidate = f"{base}_{abbr}"
    cur.execute("SELECT id, role FROM users WHERE LOWER(username) = LOWER(%s)", (candidate,))
    row = cur.fetchone()
    if not row or row[1].lower() == role:
        return candidate

    # Still taken — append incrementing counter
    counter = 2
    while True:
        candidate = f"{base}_{abbr}{counter}"
        cur.execute("SELECT id, role FROM users WHERE LOWER(username) = LOWER(%s)", (candidate,))
        row = cur.fetchone()
        if not row:
            return candidate
        counter += 1


def fix_dual_roles(dry_run: bool = False):
    conn = get_conn()
    cur = conn.cursor()

    print("=" * 60)
    print(f"{'[DRY RUN] ' if dry_run else ''}Fix Dual-Role Users — Neon DB")
    print("=" * 60)

    changes_made = 0

    # ------------------------------------------------------------------
    # 1. People present in BOTH teachers AND therapists tables
    # ------------------------------------------------------------------
    cur.execute("""
        SELECT DISTINCT LOWER(t.email), t.name
        FROM therapists t
        JOIN teachers tr ON LOWER(tr.email) = LOWER(t.email)
        WHERE t.email IS NOT NULL AND TRIM(t.email) != ''
        ORDER BY t.name
    """)
    dual_role_people = cur.fetchall()

    if not dual_role_people:
        print("\n[OK] No people found in both teachers AND therapists tables.")
    else:
        print(f"\nFound {len(dual_role_people)} person(s) with dual roles (teacher + therapist):\n")
        for email, name in dual_role_people:
            c = _ensure_both_role_accounts(cur, email, name, dry_run)
            changes_made += c

    # ------------------------------------------------------------------
    # 2. Therapist profiles with NO 'therapist' user account
    # ------------------------------------------------------------------
    cur.execute("""
        SELECT DISTINCT LOWER(t.email), t.name
        FROM therapists t
        WHERE t.email IS NOT NULL AND TRIM(t.email) != ''
          AND NOT EXISTS (
              SELECT 1 FROM users u
              WHERE LOWER(u.email) = LOWER(t.email)
                AND LOWER(u.role) = 'therapist'
          )
        ORDER BY t.name
    """)
    orphan_therapists = cur.fetchall()

    if orphan_therapists:
        print(f"\n[WARN] {len(orphan_therapists)} therapist profile(s) with NO 'therapist' login:")
        for email, name in orphan_therapists:
            c = _create_account_from_profile(cur, email, name, "therapist", dry_run)
            changes_made += c
    else:
        print("\n[OK] All therapist profiles already have a 'therapist' login account.")

    # ------------------------------------------------------------------
    # 3. Teacher profiles with NO 'teacher' user account
    # ------------------------------------------------------------------
    cur.execute("""
        SELECT DISTINCT LOWER(t.email), t.name
        FROM teachers t
        WHERE t.email IS NOT NULL AND TRIM(t.email) != ''
          AND NOT EXISTS (
              SELECT 1 FROM users u
              WHERE LOWER(u.email) = LOWER(t.email)
                AND LOWER(u.role) = 'teacher'
          )
        ORDER BY t.name
    """)
    orphan_teachers = cur.fetchall()

    if orphan_teachers:
        print(f"\n[WARN] {len(orphan_teachers)} teacher profile(s) with NO 'teacher' login:")
        for email, name in orphan_teachers:
            c = _create_account_from_profile(cur, email, name, "teacher", dry_run)
            changes_made += c
    else:
        print("\n[OK] All teacher profiles already have a 'teacher' login account.")

    # ------------------------------------------------------------------
    # Finish
    # ------------------------------------------------------------------
    print(f"\n{'-' * 60}")
    if changes_made == 0:
        print("[OK] No changes needed -- all user accounts are already correct!")
    elif dry_run:
        print(f"[DRY RUN] {changes_made} account(s) would be created.")
        print("Re-run WITHOUT --dry-run to apply the changes.")
    else:
        conn.commit()
        print(f"[DONE] {changes_made} account(s) created and committed to Neon DB.")

    cur.close()
    conn.close()


def _ensure_both_role_accounts(cur, email: str, name: str, dry_run: bool) -> int:
    """
    For a dual-role person, make sure they have both a 'teacher' AND 'therapist' row.
    Returns the number of accounts created.
    """
    print(f"\n  Person: {name} <{email}>")

    cur.execute("""
        SELECT id, username, hashed_password, role, is_active
        FROM users
        WHERE LOWER(email) = %s
        ORDER BY id
    """, (email,))
    existing_users = cur.fetchall()
    existing_roles = {row[3].lower(): row for row in existing_users}

    base_username = email.split("@")[0]
    created = 0

    for target_role in ("teacher", "therapist"):
        if target_role in existing_roles:
            u = existing_roles[target_role]
            print(f"    [OK] '{target_role}' account exists: username='{u[1]}'")
        else:
            # Pick source account to copy password from
            source = existing_users[0] if existing_users else None
            hashed_pw = source[2] if source else None
            is_active = source[4] if source else True

            username = find_or_build_username(cur, base_username, target_role)
            print(f"    [CREATE] '{target_role}' account: username='{username}'"
                  + (" (password copied)" if hashed_pw else " [WARN: no password - set manually!]"))

            if not dry_run:
                cur.execute("""
                    INSERT INTO users (username, email, hashed_password, role, is_active, is_superuser)
                    VALUES (%s, %s, %s, %s, %s, FALSE)
                """, (username, email, hashed_pw, target_role, is_active))
            created += 1

    return created


def _create_account_from_profile(cur, email: str, name: str, role: str, dry_run: bool) -> int:
    """
    Create a missing user account for a profile that has no login yet.
    Returns 1 if an account was (or would be) created.
    """
    # Check for any existing user with this email (any role) to copy the password
    cur.execute("""
        SELECT id, username, hashed_password, is_active
        FROM users WHERE LOWER(email) = %s LIMIT 1
    """, (email,))
    existing = cur.fetchone()

    base_username = email.split("@")[0]
    username = find_or_build_username(cur, base_username, role)
    hashed_pw = existing[2] if existing else None
    is_active = existing[3] if existing else True

    pw_note = "(password copied from other account)" if existing and hashed_pw else "[WARN: NO PASSWORD - admin must set it via app]"
    print(f"    [CREATE] {name} <{email}>: creating '{role}' account '{username}' {pw_note}")

    if not dry_run:
        cur.execute("""
            INSERT INTO users (username, email, hashed_password, role, is_active, is_superuser)
            VALUES (%s, %s, %s, %s, %s, FALSE)
        """, (username, email, hashed_pw, role, is_active))

    return 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Fix dual-role user accounts in the deployed Neon DB",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Preview what would be changed (safe, no writes)
  python fix_dual_role_users.py --dry-run

  # Apply the changes
  python fix_dual_role_users.py

  # With DATABASE_URL set inline (PowerShell)
  $env:DATABASE_URL="postgresql://..." ; python fix_dual_role_users.py
        """,
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without writing to the database",
    )
    args = parser.parse_args()
    fix_dual_roles(dry_run=args.dry_run)
