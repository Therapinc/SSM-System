"""
Diagnostic script to check therapist accounts.
"""
import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def diagnose_therapists():
    db_url = settings.get_database_url()
    print(f"Connecting to database: {db_url}")
    engine = create_engine(db_url)
    
    try:
        with engine.connect() as conn:
            # 1. Total therapist profiles
            res = conn.execute(text("SELECT COUNT(*) FROM therapists;"))
            total_profiles = res.fetchone()[0]
            print(f"\n[INFO] Total Therapist Profiles (therapists table): {total_profiles}")
            
            # 2. Total user accounts with role = 'therapist'
            res = conn.execute(text("SELECT COUNT(*) FROM users WHERE role = 'therapist';"))
            total_users = res.fetchone()[0]
            print(f"[INFO] Total Therapist User Accounts (users table): {total_users}")
            
            # 3. List current therapist users
            print("\n[LIST] Therapist logins:")
            res = conn.execute(text("""
                SELECT u.username, u.email, u.is_active, t.name, t.specialization
                FROM users u
                LEFT JOIN therapists t ON LOWER(u.email) = LOWER(t.email)
                WHERE u.role = 'therapist';
            """))
            for username, email, is_active, name, specialization in res.fetchall():
                status = "Active" if is_active else "Inactive"
                profile_name = name if name else "NO PROFILE LINKED"
                print(f"    - Username: '{username}' | Profile Name: {profile_name} | Email: {email} | Specialization: {specialization} | Status: {status}")
                
    except Exception as e:
        print(f"\n[ERROR] Error during diagnosis: {str(e)}", file=sys.stderr)

if __name__ == "__main__":
    diagnose_therapists()
