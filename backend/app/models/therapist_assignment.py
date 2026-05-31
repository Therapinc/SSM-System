from sqlalchemy import Column, ForeignKey, Integer, Table

from app.db.base_class import Base


therapist_student_assignments = Table(
    "therapist_student_assignments",
    Base.metadata,
    Column(
        "therapist_id",
        Integer,
        ForeignKey("therapists.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "student_id",
        Integer,
        ForeignKey("students.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)