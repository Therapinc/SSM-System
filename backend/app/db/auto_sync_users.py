import sys
import os

# Add the project root to sys.path so app imports work
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.db.session import SessionLocal
from app.models.teacher import Teacher
from app.models.therapist import Therapist
from app.models.user import User as UserModel, UserRole
from app import crud, schemas
from sqlalchemy import func, or_
from app.api.endpoints.users import _create_or_update_user
from sqlalchemy.orm import Session

def sync_users_from_profiles(db: Session, dry_run: bool = False):
    print("=" * 60)
    print(f"{'[DRY RUN] ' if dry_run else ''}Auto-Sync Users from Profiles")
    print("=" * 60)

    changes_made = 0

    # 1. Teachers
    teachers = db.query(Teacher).filter(Teacher.email.isnot(None), Teacher.email != "").all()
    for teacher in teachers:
        # Check if there is an existing teacher user for this email
        existing_user = db.query(UserModel).filter(
            func.lower(UserModel.email) == teacher.email.strip().lower(),
            or_(UserModel.role == "teacher", UserModel.role == UserRole.TEACHER)
        ).first()

        if not existing_user:
            username_base = teacher.email.strip().split('@')[0]
            
            # Use Aadhaar for password, fallback to 1234
            effective_aadhaar = teacher.aadhar_number or "1234"
            last_four = effective_aadhaar[-4:] if len(effective_aadhaar) >= 4 else "1234"
            default_password = f"Teacher{last_four}"

            user_in = schemas.UserCreate(
                username=username_base,
                email=teacher.email.strip(),
                password=default_password,
                role=UserRole.TEACHER,
                is_active=True,
                is_superuser=False,
            )
            
            print(f"    [CREATE] Teacher account for '{teacher.name}' <{teacher.email}>")
            if not dry_run:
                try:
                    _create_or_update_user(db, user_in)
                    changes_made += 1
                except Exception as e:
                    print(f"      -> ERROR: {e}")

    # 2. Therapists
    therapists = db.query(Therapist).filter(Therapist.email.isnot(None), Therapist.email != "").all()
    for therapist in therapists:
        # Check if there is an existing therapist user for this email
        existing_user = db.query(UserModel).filter(
            func.lower(UserModel.email) == therapist.email.strip().lower(),
            or_(UserModel.role == "therapist", UserModel.role == UserRole.THERAPIST)
        ).first()

        if not existing_user:
            username_base = therapist.email.strip().split('@')[0]
            
            # Use Aadhaar for password, fallback to 1234
            effective_aadhaar = therapist.aadhar_number or "1234"
            last_four = effective_aadhaar[-4:] if len(effective_aadhaar) >= 4 else "1234"
            default_password = f"Therapist{last_four}"

            user_in = schemas.UserCreate(
                username=username_base,
                email=therapist.email.strip(),
                password=default_password,
                role=UserRole.THERAPIST,
                is_active=True,
                is_superuser=False,
            )
            
            print(f"    [CREATE] Therapist account for '{therapist.name}' <{therapist.email}>")
            if not dry_run:
                try:
                    _create_or_update_user(db, user_in)
                    changes_made += 1
                except Exception as e:
                    print(f"      -> ERROR: {e}")

    print(f"\n{'-' * 60}")
    if changes_made == 0:
        print("[OK] No changes needed -- all user accounts are already in sync!")
    else:
        print(f"[DONE] {changes_made} missing accounts created.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        sync_users_from_profiles(db, dry_run=False)
    finally:
        db.close()
