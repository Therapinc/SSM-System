"""Lightweight student serialization for list endpoints."""
from typing import Any, Dict

from app.models.student import Student

# ORM columns loaded for list queries (excludes photo, documents, case_record, long text).
STUDENT_LIST_LOAD_COLUMNS = (
    Student.id,
    Student.student_id,
    Student.name,
    Student.age,
    Student.class_name,
    Student.division,
    Student.roll_no,
    Student.admission_number,
    Student.gender,
    Student.academic_year,
    Student.disability_type,
    Student.phone_number,
    Student.email,
    Student.created_at,
    Student.updated_at,
)


def serialize_student_list_item(student: Student) -> Dict[str, Any]:
    """Build a small JSON dict for student list cards (no photo/documents payload)."""
    return {
        "id": student.id,
        "student_id": student.student_id,
        "name": student.name,
        "age": student.age,
        "class_name": student.class_name,
        "division": student.division,
        "roll_no": student.roll_no,
        "admission_number": student.admission_number,
        "gender": student.gender,
        "academic_year": student.academic_year,
        "disability_type": student.disability_type,
        "phone_number": student.phone_number,
        "email": student.email,
        "created_at": student.created_at,
        "updated_at": student.updated_at,
        "photo_url": None,
    }
