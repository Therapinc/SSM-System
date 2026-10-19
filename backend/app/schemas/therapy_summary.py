from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, Dict, List, Any


class TherapySummaryBase(BaseModel):
    student_id: int
    therapy_type: str
    from_date: date
    to_date: date
    summaries: Dict[str, str]
    reports_hash: str
    schema_version: int = 1
    truncated: bool = False
    truncation_type: Optional[str] = None
    skipped_report_dates: Optional[List[date]] = None


class TherapySummaryCreate(TherapySummaryBase):
    pass


class TherapySummaryResponse(BaseModel):
    student_id: str
    therapy_type: str
    summaries: Dict[str, str]
    used_reports: int
    truncated: bool
    truncation_type: Optional[str] = None
    skipped_report_dates: Optional[List[str]] = None
    model: str
    date_range: Dict[str, str]


class TherapySummaryRequest(BaseModel):
    student_id: str  # Can accept "STU2025001" or numeric representation
    therapy_type: str
    preset_range: str  # "last_30_days", "current_month", "prev_month", "current_trimester"


class ConsolidatedAiSummaryRequest(BaseModel):
    student_id: str
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    period_title: Optional[str] = "Term Evaluation"
    therapy_reports: Optional[Any] = None
    monthly_iep_data: Optional[Any] = None
    iep_goals: Optional[Any] = None
    facp_summary: Optional[Any] = None


class ConsolidatedAiSummaryResponse(BaseModel):
    student_id: str
    period_title: str
    executive_summary: str
    interdisciplinary_synergy: str
    disciplines: Dict[str, Any]
    term_recommendations: List[str]
    model: str

