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
    existing_user = crud.user.get_by_username(db, username=user_in.username)
    if existing_user is None:
        existing_user = crud.user.get_by_email(db, email=user_in.email)

    if existing_user:
        return crud.user.update(db, db_obj=existing_user, obj_in=user_in)

    return crud.user.create(db, obj_in=user_in)

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
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user