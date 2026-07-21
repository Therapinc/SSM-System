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
        # 1. Try exact username match first (always unique)
        user = self.get_by_username(db, username=username)
        if user:
            if verify_password(password, user.hashed_password):
                return user
            return None  # Username matched but wrong password

        # 2. Try by email — now non-unique, so try ALL accounts with this email
        #    and return the one whose password matches (teacher vs therapist)
        if not username:
            return None
        all_by_email = db.query(User).filter(
            func.lower(User.email) == username.strip().lower()
        ).all()
        for u in all_by_email:
            if verify_password(password, u.hashed_password):
                return u

        return None

user = CRUDUser(User) 