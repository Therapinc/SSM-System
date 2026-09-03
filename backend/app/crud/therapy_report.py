from typing import List
import json
from sqlalchemy.orm import Session
from app.models.therapy_report import TherapyReport
from app.schemas.therapy_report import TherapyReportCreate


def create(db: Session, *, obj_in: TherapyReportCreate) -> TherapyReport:
    # Ensure goals_achieved is properly serialized as JSON
    goals_data = obj_in.goals_achieved
    if goals_data and isinstance(goals_data, dict):
        goals_data = goals_data  # Already a dict, SQLAlchemy will serialize
    
    db_obj = TherapyReport(
        student_id=obj_in.student_id,
        teacher_id=obj_in.teacher_id,
        report_date=obj_in.report_date,
        therapy_type=obj_in.therapy_type,
        present_complaints=obj_in.present_complaints,
        current_observation=obj_in.current_observation,
        assessment_done=obj_in.assessment_done,
        provisional_diagnosis=obj_in.provisional_diagnosis,
        progress_notes=obj_in.progress_notes,
        goals_achieved=goals_data,
        progress_level=obj_in.progress_level,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_by_student(db: Session, student_id: int, *, limit: int = 0, offset: int = 0) -> List[TherapyReport]:
    query = db.query(TherapyReport).filter(TherapyReport.student_id == student_id).order_by(TherapyReport.report_date.desc(), TherapyReport.id.desc())
    if offset:
        query = query.offset(offset)
    if limit:
        query = query.limit(limit)
    return query.all()


def count_by_student(db: Session, student_id: int) -> int:
    return db.query(TherapyReport).filter(TherapyReport.student_id == student_id).count()
