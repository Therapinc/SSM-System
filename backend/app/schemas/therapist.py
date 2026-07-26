from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import date

class TherapistBase(BaseModel):
    # Only name and aadhar_number are required for creation per updated UX.
    name: str
    aadhar_number: str
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    mobile_number: Optional[str] = None
    religion: Optional[str] = None
    caste: Optional[str] = None
    rci_number: Optional[str] = None
    rci_renewal_date: Optional[date] = None
    qualifications_details: Optional[str] = None
    category: Optional[str] = None
    email: Optional[str] = None
    specialization: Optional[str] = None
    photo_url: Optional[str] = None
    photo_public_id: Optional[str] = None

class TherapistCreate(TherapistBase):
    pass

class TherapistUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    mobile_number: Optional[str] = None
    aadhar_number: Optional[str] = None
    religion: Optional[str] = None
    caste: Optional[str] = None
    rci_number: Optional[str] = None
    rci_renewal_date: Optional[date] = None
    qualifications_details: Optional[str] = None
    category: Optional[str] = None
    email: Optional[str] = None
    specialization: Optional[str] = None
    photo_url: Optional[str] = None
    photo_public_id: Optional[str] = None

class Therapist(TherapistBase):
    id: int

    class Config:
        from_attributes = True


class TherapistStudentAssignmentsUpdate(BaseModel):
    student_ids: List[int] = Field(default_factory=list)
