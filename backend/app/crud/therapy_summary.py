from typing import Optional, List
from datetime import date
from sqlalchemy.orm import Session
from app.models.therapy_summary import TherapySummary
from app.schemas.therapy_summary import TherapySummaryCreate


def get_cached_summary(
    db: Session,
    *,
    student_id: int,
    therapy_type: str,
    from_date: date,
    to_date: date,
    reports_hash: str,
    schema_version: int
) -> Optional[TherapySummary]:
    """Retrieve a cached summary that exactly matches the criteria and hash/version."""
    return (
        db.query(TherapySummary)
        .filter(
            TherapySummary.student_id == student_id,
            TherapySummary.therapy_type == therapy_type,
            TherapySummary.from_date == from_date,
            TherapySummary.to_date == to_date,
            TherapySummary.reports_hash == reports_hash,
            TherapySummary.schema_version == schema_version,
        )
        .first()
    )


def create_or_update_cache(
    db: Session,
    *,
    student_id: int,
    therapy_type: str,
    from_date: date,
    to_date: date,
    summaries: dict,
    reports_hash: str,
    schema_version: int,
    truncated: bool = False,
    truncation_type: Optional[str] = None,
    skipped_report_dates: Optional[List[date]] = None,
    used_reports: int = 0
) -> TherapySummary:
    """Save a new summary to the cache, invalidating any old summaries for this student/therapy/range."""
    # Delete older cached runs for this specific query range
    db.query(TherapySummary).filter(
        TherapySummary.student_id == student_id,
        TherapySummary.therapy_type == therapy_type,
        TherapySummary.from_date == from_date,
        TherapySummary.to_date == to_date,
    ).delete(synchronize_session=False)

    # Insert fresh cache entry
    db_obj = TherapySummary(
        student_id=student_id,
        therapy_type=therapy_type,
        from_date=from_date,
        to_date=to_date,
        summaries=summaries,
        reports_hash=reports_hash,
        schema_version=schema_version,
        truncated=truncated,
        truncation_type=truncation_type,
        skipped_report_dates=skipped_report_dates,
        used_reports=used_reports,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
