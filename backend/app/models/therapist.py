from sqlalchemy import Column, Integer, String, Date, JSON
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.models.therapist_assignment import therapist_student_assignments

class Therapist(Base):
    __tablename__ = "therapists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    mobile_number = Column(String, nullable=True)
    aadhar_number = Column(String, unique=True, nullable=False)
    religion = Column(String, nullable=True)
    caste = Column(String, nullable=True)
    rci_number = Column(String, unique=True, nullable=True)
    rci_renewal_date = Column(Date, nullable=True)
    qualifications_details = Column(String, nullable=True)
    category = Column(String, nullable=True)
    email = Column(String, nullable=True)
    specialization = Column(String, nullable=True)  # e.g., Speech Therapy, Occupational Therapy, etc.
    assigned_students = relationship(
        "Student",
        secondary=therapist_student_assignments,
        lazy="selectin",
    )
