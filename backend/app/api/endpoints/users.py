from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.models.user import UserRole

router = APIRouter()


def _can_manage_user_accounts(current_user: models.User) -> bool:
    return bool(
        current_user.is_superuser
        or str(current_user.role).lower() in {UserRole.ADMIN.value, "hm", "headmaster"}
    )


def _create_or_update_user(db: Session, user_in: schemas.UserCreate):
    """
    Create or update a user account for the given role.

    Each role (teacher, therapist) gets its OWN separate User row so both
    logins work independently.  We look for an existing account that matches
    BOTH the role AND the email — only update that one.  If the email already
    exists under a different role, we create a brand-new account with a
    short role-suffixed username (e.g. "john_th" for therapist) so there is no clash.
    """
    from app.models.user import User as UserModel
    from sqlalchemy import func, or_

    # Use .value to get plain string from enum (e.g. "therapist" not "UserRole.therapist")
    raw_role = user_in.role
    requested_role = (raw_role.value if hasattr(raw_role, 'value') else str(raw_role)).lower().strip()

    # Short abbreviations to keep usernames compact
    ROLE_SUFFIX = {
        "teacher": "tr",
        "therapist": "th",
        "admin": "ad",
        "hm": "hm",
        "headmaster": "hm",
    }
    role_abbr = ROLE_SUFFIX.get(requested_role, requested_role[:2])

    # 1. Check if there is already an account with this EXACT username
    existing_by_username = crud.user.get_by_username(db, username=user_in.username)
    if existing_by_username:
        existing_role = str(existing_by_username.role).lower().strip()
        if existing_role == requested_role:
            # Same username, same role — just update (e.g. re-sync password)
            return crud.user.update(db, db_obj=existing_by_username, obj_in=user_in)
        # Same username, different role — fall through to create a role-suffixed account

    # 2. Look for an existing same-role account for this email
    same_role_user = db.query(UserModel).filter(
        func.lower(UserModel.email) == user_in.email.lower(),
        or_(UserModel.role == requested_role, UserModel.role == user_in.role)
    ).first()

    if same_role_user:
        # Already have a same-role account — update it
        return crud.user.update(db, db_obj=same_role_user, obj_in=user_in)

    # 3. No same-role account exists yet.  Build a unique username.
    #    Default: email prefix.  If that username is taken (by a different role),
    #    suffix with the short role abbreviation (e.g. john_th, john_tr).
    base_username = user_in.username  # already set to email_prefix by caller
    candidate_username = base_username

    taken = crud.user.get_by_username(db, username=candidate_username)
    if taken and str(taken.role).lower().strip() != requested_role:
        # Username is taken by a different role — use short role-suffixed variant
        candidate_username = f"{base_username}_{role_abbr}"

    # If the suffixed username is also taken, append a counter to be safe
    counter = 2
    while True:
        conflict = crud.user.get_by_username(db, username=candidate_username)
        if not conflict:
            break
        if str(conflict.role).lower().strip() == requested_role:
            # Same role — just update this account
            return crud.user.update(db, db_obj=conflict, obj_in=user_in)
        candidate_username = f"{base_username}_{role_abbr}{counter}"
        counter += 1

    # Create a new user with the resolved username
    new_user_in = schemas.UserCreate(
        username=candidate_username,
        email=user_in.email,
        password=user_in.password,
        role=user_in.role,
        is_active=user_in.is_active,
        is_superuser=user_in.is_superuser,
    )
    return crud.user.create(db, obj_in=new_user_in)

@router.post("/", response_model=schemas.User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new user (teacher or therapist).
    """
    if not _can_manage_user_accounts(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create new user accounts",
        )
    
    # Ensure is_superuser is False
    user_in.is_superuser = False
    
    return _create_or_update_user(db, user_in)

@router.post("/teachers", response_model=schemas.User)
def create_teacher_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new teacher user.
    """
    if not _can_manage_user_accounts(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create new teacher accounts",
        )
    
    # Ensure role is teacher
    user_in.role = UserRole.TEACHER
    user_in.is_superuser = False
    
    return _create_or_update_user(db, user_in)

@router.get("/me", response_model=schemas.User)
def read_user_me(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    if current_user and str(current_user.role).lower() == "therapist":
        from app.models.therapist import Therapist
        from sqlalchemy import func
        therapist = db.query(Therapist).filter(func.lower(Therapist.email) == current_user.email.lower()).first()
        if therapist:
            current_user.specialization = therapist.specialization
    return current_user