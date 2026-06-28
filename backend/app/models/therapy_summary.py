from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from app.db.base_class import Base


class TherapySummary(Base):
    __tablename__ = "therapy_summaries"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    therapy_type = Column(String, nullable=False, index=True)
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    summaries = Column(JSON, nullable=False)  # Stores {"sub_area_key": "summary_text"}
    reports_hash = Column(String, nullable=False, index=True)
    schema_version = Column(Integer, nullable=False, default=1)
    truncated = Column(Boolean, default=False, nullable=False)
    truncation_type = Column(String, nullable=True)  # "text_trimmed", "reports_skipped", or None
    skipped_report_dates = Column(JSON, nullable=True)  # List of string dates
    used_reports = Column(Integer, nullable=True, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
