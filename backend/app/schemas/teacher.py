from datetime import date
from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Dict, Any, Literal

# Base Teacher Schema
class ClassAssignment(BaseModel):
    class_name: Optional[str] = Field(None, alias='class')
    year: Optional[str] = None
    division: Optional[Literal['A', 'B', 'C', 'D']] = None

    # validation for requiring division if class is assigned is handled
    # in the TeacherCreate and TeacherUpdate models to avoid raising
    # during response serialization for existing records.

    class Config:
        populate_by_name = True


class TeacherBase(BaseModel):
    # require name and aadhar_number for creation per updated UX
    name: str
    aadhar_number: str
    email: Optional[str] = None
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
    class_assignments: Optional[List[ClassAssignment]] = None
    photo_url: Optional[str] = None
    photo_public_id: Optional[str] = None

# Create Teacher Schema (used for input when creating)
class TeacherCreate(TeacherBase):
    @model_validator(mode='before')
    @classmethod
    def validate_assignments(cls, data):
        assignments = data.get('class_assignments') or []
        for a in assignments:
            # allow both alias 'class' and field name 'class_name'
            class_present = bool(a.get('class') or a.get('class_name'))
            division_present = bool(a.get('division'))
            if class_present and not division_present:
                raise ValueError('Each class assignment must include a division when a class is specified')
        return data

# Update Teacher Schema (allows partial updates)
class TeacherUpdate(BaseModel):
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
    class_assignments: Optional[List[ClassAssignment]] = None
    photo_url: Optional[str] = None
    photo_public_id: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def validate_assignments(cls, data):
        if 'class_assignments' in data:
            assignments = data.get('class_assignments') or []
            for a in assignments:
                class_present = bool(a.get('class') or a.get('class_name'))
                division_present = bool(a.get('division'))
                if class_present and not division_present:
                    raise ValueError('Each class assignment must include a division when a class is specified')
        return data

# Teacher Schema (used for responses)
class Teacher(TeacherBase):
    id: int

    class Config:
        from_attributes = True  # Allows model to read data from ORM objects 