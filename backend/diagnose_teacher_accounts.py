"""
Diagnostic script to check teacher accounts and identify login/profile issues.
"""
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def diagnose_teachers():
    db_url = settings.get_database_url()
    
    # Mask password for printing
    masked_url = db_url
    if "@" in db_url:
        prefix, suffix = db_url.split("@", 1)
        if ":" in prefix:
            proto_user, _ = prefix.rsplit(":", 1)
            masked_url = f"{proto_user}:***@{suffix}"
            
    print(f"Connecting to database: {masked_url}")
    engine = create_engine(db_url)
    
    try:
        with engine.connect() as conn:
            # 1. Total teacher profiles
            res = conn.execute(text("SELECT COUNT(*) FROM teachers;"))
            total_profiles = res.fetchone()[0]
            print(f"\n[INFO] Total Teacher Profiles (teachers table): {total_profiles}")
            
            # 2. Total user accounts with role = 'teacher'
            res = conn.execute(text("SELECT COUNT(*) FROM users WHERE role = 'teacher';"))
            total_users = res.fetchone()[0]
            print(f"[INFO] Total Teacher User Accounts (users table): {total_users}")
            
            # 3. Check for teacher profiles with no user account
            print("\n[CHECK] Checking for teacher profiles without login accounts...")
            res = conn.execute(text("""
                SELECT t.id, t.name, t.email 
                FROM teachers t
                LEFT JOIN users u ON LOWER(t.email) = LOWER(u.email)
                WHERE u.id IS NULL OR u.role != 'teacher';
            """))
            missing_accounts = res.fetchall()
            if missing_accounts:
                print(f"  [ALERT] Found {len(missing_accounts)} teacher profile(s) with NO login account:")
                for tid, name, email in missing_accounts:
                    print(f"    - ID {tid}: {name} (Email: {email})")
            else:
                print("  [OK] All teacher profiles have a corresponding user account.")
                
            # 4. Check for email casing differences between tables
            print("\n[CHECK] Checking for email casing differences between tables...")
            res = conn.execute(text("""
                SELECT t.name, t.email, u.username, u.email
                FROM teachers t
                JOIN users u ON LOWER(t.email) = LOWER(u.email)
                WHERE t.email != u.email;
            """))
            case_differences = res.fetchall()
            if case_differences:
                print(f"  [WARNING] Found {len(case_differences)} email casing mismatch(es) (could break profile lookup):")
                for name, t_email, u_username, u_email in case_differences:
                    print(f"    - Teacher {name}: Profile Email='{t_email}' vs User Account Email='{u_email}'")
            else:
                print("  [OK] Email casing matches perfectly between tables.")
                
            # 5. Check for users with role = 'teacher' but no profile in teachers table
            print("\n[CHECK] Checking for login accounts with 'teacher' role but no profile...")
            res = conn.execute(text("""
                SELECT u.id, u.username, u.email 
                FROM users u
                LEFT JOIN teachers t ON LOWER(u.email) = LOWER(t.email)
                WHERE u.role = 'teacher' AND t.id IS NULL;
            """))
            orphaned_users = res.fetchall()
            if orphaned_users:
                print(f"  [WARNING] Found {len(orphaned_users)} orphaned login account(s) (no teacher profile exists):")
                for uid, username, email in orphaned_users:
                    print(f"    - User ID {uid}: Username='{username}', Email='{email}'")
            else:
                print("  [OK] No orphaned teacher login accounts found.")
                
            # 6. List current teacher users
            print("\n[LIST] Active teacher logins:")
            res = conn.execute(text("""
                SELECT u.username, u.email, u.is_active, t.name
                FROM users u
                LEFT JOIN teachers t ON LOWER(u.email) = LOWER(t.email)
                WHERE u.role = 'teacher';
            """))
            for username, email, is_active, name in res.fetchall():
                status = "Active" if is_active else "Inactive"
                profile_name = name if name else "NO PROFILE LINKED"
                print(f"    - Username: '{username}' | Profile Name: {profile_name} | Email: {email} | Status: {status}")
                
    except Exception as e:
        print(f"\n[ERROR] Error during diagnosis: {str(e)}", file=sys.stderr)

if __name__ == "__main__":
    diagnose_teachers()
