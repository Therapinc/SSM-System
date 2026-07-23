from typing import Any, Dict, Optional, Union
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        if not email:
            return None
        return db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()
    
    def get_by_username(self, db: Session, *, username: str) -> Optional[User]:
        if not username:
            return None
        return db.query(User).filter(func.lower(User.username) == username.strip().lower()).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        db_obj = User(
            email=obj_in.email,
            username=obj_in.username,
            hashed_password=get_password_hash(obj_in.password),
            is_superuser=obj_in.is_superuser,
            is_active=obj_in.is_active,
            role=obj_in.role,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        if update_data.get("password"):
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        return super().update(db, db_obj=db_obj, obj_in=update_data)

    def authenticate(self, db: Session, *, username: str, password: str) -> Optional[User]:
        from app.api.endpoints.auth import _find_user_by_identifier
        user, _ = _find_user_by_identifier(db, username)
        
        if user and verify_password(password, user.hashed_password):
            return user

        # 1. Try exact username match first (always unique)
        user_by_username = self.get_by_username(db, username=username)
        if user_by_username and verify_password(password, user_by_username.hashed_password):
            return user_by_username

        # 2. Try by email — try ALL accounts with this email
        if username:
            clean_username = username.strip().lower()
            all_by_email = db.query(User).filter(
                func.lower(User.email) == clean_username
            ).all()
            for u in all_by_email:
                if verify_password(password, u.hashed_password):
                    return u

            # 3. Try ALL accounts where username CONTAINS the input (e.g., handles suffixes or wrong First/Last name guesses)
            # This ensures if _find_user_by_identifier picked the wrong "Ancy", we still find the right one!
            all_like = db.query(User).filter(
                func.lower(User.username).like(f"%{clean_username}%")
            ).all()
            for u in all_like:
                if verify_password(password, u.hashed_password):
                    return u

        return None

user = CRUDUser(User) 