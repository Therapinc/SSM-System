from sqlalchemy import or_, func
from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
from app.models.teacher import Teacher
from app.schemas.teacher import TeacherCreate, TeacherUpdate
from app.crud.base import CRUDBase

class CRUDTeacher(CRUDBase[Teacher, TeacherCreate, TeacherUpdate]):
    def get_by_aadhar(self, db: Session, *, aadhar_number: str) -> Optional[Teacher]:
        return db.query(Teacher).filter(Teacher.aadhar_number == aadhar_number).first()
        
    def get_by_rci(self, db: Session, *, rci_number: str) -> Optional[Teacher]:
        return db.query(Teacher).filter(Teacher.rci_number == rci_number).first()
    
    def get_by_email(self, db: Session, *, email: str) -> Optional[Teacher]:
        if not email:
            return None
        return db.query(Teacher).filter(func.lower(Teacher.email) == email.strip().lower()).first()

    def list_paginated(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
    ) -> Tuple[List[Teacher], int]:
        query = db.query(Teacher)
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Teacher.name.ilike(term),
                    Teacher.mobile_number.ilike(term),
                    Teacher.qualifications_details.ilike(term),
                    Teacher.email.ilike(term),
                )
            )
        total = query.count()
        items = (
            query.order_by(Teacher.name.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return items, total


teacher = CRUDTeacher(Teacher) 