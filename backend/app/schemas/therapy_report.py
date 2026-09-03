from pydantic import BaseModel, field_validator
from datetime import date, datetime
from typing import Optional, Dict, Any
import json


class GoalItem(BaseModel):
    """Individual goal with checkbox and notes"""
    checked: bool = False
    notes: str = ""
    response: str = ""


class TherapyReportBase(BaseModel):
    report_date: date
    therapy_type: Optional[str] = None
    
    # New Clinical Fields
    present_complaints: Optional[str] = None
    current_observation: Optional[str] = None
    assessment_done: Optional[str] = None
    provisional_diagnosis: Optional[str] = None
    
    progress_notes: Optional[str] = None
    goals_achieved: Optional[Dict[str, Any]] = None
    progress_level: Optional[str] = None

    @field_validator(
        'therapy_type',
        'present_complaints',
        'current_observation',
        'assessment_done',
        'provisional_diagnosis',
        'progress_notes',
        'progress_level',
        mode='before',
    )
    @classmethod
    def normalize_optional_text(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            normalized = v.strip()
            return normalized or None
        return v

    @field_validator('goals_achieved', mode='before')
    @classmethod
    def parse_goals_achieved(cls, v):
        """Parse goals_achieved if it's a JSON string"""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return v
        return v


class TherapyReportCreate(TherapyReportBase):
    student_id: int
    teacher_id: Optional[int] = None


class TherapyReport(TherapyReportBase):
    id: int
    student_id: int
    teacher_id: Optional[int] = None
    therapist_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @field_validator('goals_achieved', mode='before')
    @classmethod
    def parse_goals_achieved(cls, v):
        """Parse goals_achieved if it's a JSON string"""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return v
        return v

    class Config:
        from_attributes = True
        orm_mode = True  # Keep for backwards compatibility


class PaginatedTherapyReports(BaseModel):
    """Paginated response wrapper for therapy reports."""
    items: list[TherapyReport]
    total: int
    page: int
    page_size: int