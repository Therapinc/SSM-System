from typing import List

from sqlalchemy import delete
from sqlalchemy.orm import Session, load_only

from app.crud.therapist import get_therapist
from app.models.student import Student
from app.models.therapist_assignment import therapist_student_assignments
from app.utils.student_serializers import STUDENT_LIST_LOAD_COLUMNS


def get_assigned_students(db: Session, therapist_id: int) -> List[Student]:
    return (
        db.query(Student)
        .options(load_only(*STUDENT_LIST_LOAD_COLUMNS))
        .join(
            therapist_student_assignments,
            Student.id == therapist_student_assignments.c.student_id,
        )
        .filter(therapist_student_assignments.c.therapist_id == therapist_id)
        .order_by(Student.name.asc())
        .all()
    )


def get_assigned_student_ids(db: Session, therapist_id: int) -> List[int]:
    rows = (
        db.query(therapist_student_assignments.c.student_id)
        .filter(therapist_student_assignments.c.therapist_id == therapist_id)
        .all()
    )
    return [row[0] for row in rows]


def set_assigned_students(db: Session, therapist_id: int, student_ids: List[int]) -> List[Student]:
    therapist = get_therapist(db, therapist_id)
    if therapist is None:
        raise ValueError("Therapist not found")

    normalized_ids = list(dict.fromkeys(student_ids or []))

    if normalized_ids:
        existing_ids = {
            row[0]
            for row in db.query(Student.id).filter(Student.id.in_(normalized_ids)).all()
        }
        missing_ids = [student_id for student_id in normalized_ids if student_id not in existing_ids]
        if missing_ids:
            raise ValueError(f"Invalid student ids: {missing_ids}")

    db.execute(
        delete(therapist_student_assignments).where(
            therapist_student_assignments.c.therapist_id == therapist_id,
        )
    )

    if normalized_ids:
        db.execute(
            therapist_student_assignments.insert(),
            [
                {"therapist_id": therapist_id, "student_id": student_id}
                for student_id in normalized_ids
            ],
        )

    db.commit()
    return get_assigned_students(db, therapist_id)