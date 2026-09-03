from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Body
import os
import json
import logging
import re
import time
import asyncio
import hashlib
from datetime import date, timedelta

try:
    from google import genai
    from google.genai import types as genai_types
except ImportError:
    genai = None  # type: ignore
    genai_types = None  # type: ignore

from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.core.config import settings
from app.schemas.therapy_summary import TherapySummaryRequest, TherapySummaryResponse
from app.crud.therapy_summary import get_cached_summary, create_or_update_cache
from app.utils.rate_limit import api_rate_limiter, daily_request_counter

router = APIRouter()

# Initialize Gemini client (lazy-loaded, one per process)
_gemini_client = None


def _get_gemini_client():
    """Get or initialize the Gemini client using the new google.genai SDK."""
    global _gemini_client

    if _gemini_client is None:
        if not genai:
            raise HTTPException(
                status_code=503,
                detail="google-genai package not installed. Run: pip install google-genai"
            )

        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="GEMINI_API_KEY environment variable not set on server."
            )

        try:
            _gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
            logging.getLogger(__name__).info(
                f"Gemini client initialised (model: {settings.GEMINI_MODEL})"
            )
        except Exception as e:
            logging.getLogger(__name__).error(f"Failed to initialise Gemini client: {e}")
            raise HTTPException(status_code=503, detail=f"Failed to initialise Gemini API: {str(e)}")

    return _gemini_client



def _populate_therapist_names(db: Session, reports: List[Any]):
    if not reports:
        return
    # Get all unique teacher_ids
    user_ids = {r.teacher_id for r in reports if r.teacher_id}
    if not user_ids:
        return
    
    # Query users
    from app.models.user import User
    from sqlalchemy import func
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    user_map = {u.id: u for u in users}
    
    # Gather emails by role to lookup names
    therapist_emails = []
    teacher_emails = []
    
    for u in users:
        role = (u.role or "").lower()
        if role == "therapist":
            therapist_emails.append(u.email.lower())
        elif role == "teacher":
            teacher_emails.append(u.email.lower())
            
    # Lookup therapist names
    therapist_names = {}
    if therapist_emails:
        from app.models.therapist import Therapist
        therapists = db.query(Therapist.email, Therapist.name).filter(
            func.lower(Therapist.email).in_(therapist_emails)
        ).all()
        therapist_names = {t.email.lower(): t.name for t in therapists if t.email}
        
    # Lookup teacher names
    teacher_names = {}
    if teacher_emails:
        from app.models.teacher import Teacher
        teachers = db.query(Teacher.email, Teacher.name).filter(
            func.lower(Teacher.email).in_(teacher_emails)
        ).all()
        teacher_names = {t.email.lower(): t.name for t in teachers if t.email}
        
    # Assign therapist_name to each report object
    for r in reports:
        if not r.teacher_id:
            r.therapist_name = "N/A"
            continue
        u = user_map.get(r.teacher_id)
        if not u:
            r.therapist_name = "N/A"
            continue
            
        role = (u.role or "").lower()
        email_lower = u.email.lower() if u.email else ""
        
        if role == "therapist" and email_lower in therapist_names:
            r.therapist_name = therapist_names[email_lower]
        elif role == "teacher" and email_lower in teacher_names:
            r.therapist_name = teacher_names[email_lower]
        else:
            r.therapist_name = u.username or u.email or "N/A"


def _get_therapist_specialization(db: Session, email: str) -> Optional[str]:
    from app.models.therapist import Therapist
    from sqlalchemy import func
    therapist = db.query(Therapist).filter(func.lower(Therapist.email) == email.lower()).first()
    return therapist.specialization if therapist else None


def _normalize_therapy_type(t_type: Optional[str]) -> str:
    if not t_type:
        return ""
    t = re.sub(r"[^a-z0-9]", "", t_type.lower())
    if t in ("physicaltherapy", "physio"):
        return "physiotherapy"
    return t


@router.post("/", response_model=schemas.therapy_report.TherapyReport)
def create_report(
    *,
    db: Session = Depends(deps.get_db),
    report_in: schemas.therapy_report.TherapyReportCreate,
    current_user: schemas.user.User = Depends(deps.get_current_active_user),
) -> Any:
    """Create a therapy report for a student."""
    role = str(getattr(current_user, "role", "") or "").lower()
    if role == "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teachers are not authorized to create or enter therapy reports."
        )
    if role == "therapist":
        specialization = _get_therapist_specialization(db, current_user.email)
        if not specialization:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Therapists must have a specialization assigned to enter reports."
            )
        if _normalize_therapy_type(report_in.therapy_type) != _normalize_therapy_type(specialization):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You are only authorized to enter reports under your therapy type: {specialization}."
            )
    try:
        # Optionally set teacher_id from current_user if not provided
        if not report_in.teacher_id:
            try:
                report_in.teacher_id = current_user.id
            except Exception as e:
                logging.warning(f"Could not set teacher_id from current_user: {e}")
                report_in.teacher_id = None

        # Log the incoming goals_achieved structure
        logging.info(f"Creating report for student {report_in.student_id}, therapy: {report_in.therapy_type}")
        if hasattr(report_in, 'goals_achieved') and report_in.goals_achieved:
            logging.info(f"goals_achieved type: {type(report_in.goals_achieved)}")
            if isinstance(report_in.goals_achieved, dict):
                logging.info(f"goals_achieved keys: {list(report_in.goals_achieved.keys())}")
                # Log first entry as sample
                for key, value in list(report_in.goals_achieved.items())[:1]:
                    logging.info(f"Sample entry - key: '{key}', value type: {type(value)}, value: {value}")

        # Create the report
        report = crud.therapy_report.create(db, obj_in=report_in)
        logging.info(f"Successfully created therapy report for student {report_in.student_id}")
        _populate_therapist_names(db, [report])
        return report
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error creating therapy report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create therapy report: {str(e)}"
        )


@router.get("/student/{student_id}")
def list_reports_for_student(
    student_id: int,
    db: Session = Depends(deps.get_db),
    current_user: schemas.user.User = Depends(deps.get_current_active_user),
    page: int = 1,
    page_size: int = 50,
) -> Any:
    """List therapy reports for a student (paginated, default 50 per page)."""
    total = crud.therapy_report.count_by_student(db, student_id=student_id)
    offset = (page - 1) * page_size
    reports = crud.therapy_report.get_by_student(db, student_id=student_id, limit=page_size, offset=offset)
    _populate_therapist_names(db, reports)
    
    role = str(getattr(current_user, "role", "") or "").lower()
    if role == "therapist":
        specialization = _get_therapist_specialization(db, current_user.email)
        if specialization:
            spec_norm = _normalize_therapy_type(specialization)
            reports = [r for r in reports if _normalize_therapy_type(r.therapy_type) == spec_norm]
        else:
            reports = []
    return {"items": reports, "total": total, "page": page, "page_size": page_size}


@router.put("/{report_id}", response_model=schemas.therapy_report.TherapyReport)
def update_report(
    *,
    db: Session = Depends(deps.get_db),
    report_id: int,
    report_in: schemas.therapy_report.TherapyReportCreate,
    current_user: schemas.user.User = Depends(deps.get_current_active_user),
) -> Any:
    """Update an existing therapy report."""
    from app.models.therapy_report import TherapyReport
    report = db.query(TherapyReport).filter(TherapyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Therapy report not found")
        
    role = str(getattr(current_user, "role", "") or "").lower()
    if role == "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teachers are not authorized to update therapy reports."
        )
    if role == "therapist":
        specialization = _get_therapist_specialization(db, current_user.email)
        if not specialization:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Therapists must have a specialization assigned to update reports."
            )
        if _normalize_therapy_type(report.therapy_type) != _normalize_therapy_type(specialization):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You are only authorized to update reports under your therapy type: {specialization}."
            )
            
    # Update fields
    report.report_date = report_in.report_date
    report.therapy_type = report_in.therapy_type
    report.present_complaints = report_in.present_complaints
    report.current_observation = report_in.current_observation
    report.assessment_done = report_in.assessment_done
    report.provisional_diagnosis = report_in.provisional_diagnosis
    report.progress_notes = report_in.progress_notes
    report.goals_achieved = report_in.goals_achieved
    report.progress_level = report_in.progress_level
    
    db.add(report)
    db.commit()
    db.refresh(report)
    _populate_therapist_names(db, [report])
    return report


# ============================================================================
# DYNAMIC PRESETS, PRUNING, AND AI SUMMARIZATION HELPER FUNCTIONS
# ============================================================================

def get_preset_dates(preset: str) -> tuple[date, date]:
    today = date.today()
    if preset == "last_30_days":
        return today - timedelta(days=30), today
    elif preset == "current_month":
        return date(today.year, today.month, 1), today
    elif preset == "prev_month":
        first_this_month = date(today.year, today.month, 1)
        last_day_prev = first_this_month - timedelta(days=1)
        return date(last_day_prev.year, last_day_prev.month, 1), last_day_prev
    elif preset == "current_trimester":
        month = today.month
        # Academic Trimester boundaries: Term 1 (June-Sept), Term 2 (Oct-Dec), Term 3 (Jan-May)
        if 6 <= month <= 9:  # Term 1
            return date(today.year, 6, 1), min(today, date(today.year, 9, 30))
        elif 10 <= month <= 12:  # Term 2
            return date(today.year, 10, 1), min(today, date(today.year, 12, 31))
        else:  # Term 3
            year = today.year
            return date(year, 1, 1), min(today, date(year, 5, 31))
    else:
        raise ValueError(f"Unknown preset range: {preset}")


def _scrub_pii_name(text: str, student_name: str) -> str:
    if not text or not student_name:
        return text
    name_clean = student_name.strip()
    # Replace full name
    pattern_full = re.compile(rf"\b{re.escape(name_clean)}\b", re.IGNORECASE)
    scrubbed = pattern_full.sub("[Student]", text)
    # Replace first name (if name has spaces, get the first part)
    parts = name_clean.split()
    if len(parts) > 1:
        first_name = parts[0]
        if len(first_name) > 2:  # Avoid matching short initials or words
            pattern_first = re.compile(rf"\b{re.escape(first_name)}\b", re.IGNORECASE)
            scrubbed = pattern_first.sub("[Student]", scrubbed)
    return scrubbed


def _parse_goals_achieved(goals_achieved):
    """Parse goals_achieved field which may be a JSON string, dict, or None.
    Returns a dict or None."""
    if goals_achieved is None:
        return None
    if isinstance(goals_achieved, dict):
        return goals_achieved
    if isinstance(goals_achieved, str):
        try:
            parsed = json.loads(goals_achieved)
            if isinstance(parsed, dict):
                return parsed
        except (json.JSONDecodeError, TypeError):
            pass
    return None


def _get_active_sub_areas(reports: List[Any]) -> List[str]:
    sub_areas = set()
    for r in reports:
        parsed = _parse_goals_achieved(r.goals_achieved)
        if isinstance(parsed, dict):
            for key, val in parsed.items():
                if isinstance(val, dict):
                    label = val.get("label", key).strip()
                    notes = val.get("notes", "").strip()
                    response = val.get("response", "").strip()
                    if (notes or response) and label:
                        sub_areas.add(label)
                elif isinstance(val, str) and val.strip():
                    sub_areas.add(key)
    return sorted(list(sub_areas))


def _goals_to_readable_text_truncated(goals_achieved, max_field_length: Optional[int] = None) -> str:
    parsed = _parse_goals_achieved(goals_achieved)
    if parsed is None:
        if isinstance(goals_achieved, str) and goals_achieved.strip():
            val = goals_achieved.strip()
            if max_field_length is not None:
                val = val[:max_field_length]
            return val
        return ""
    
    parts = []
    for key, value in parsed.items():
        if isinstance(value, dict):
            label = value.get('label', key)
            notes = value.get('notes', '').strip()
            response = value.get('response', '').strip()
            
            if max_field_length is not None:
                notes = notes[:max_field_length]
                response = response[:max_field_length]
                
            goal_text = []
            if notes:
                goal_text.append(f"Goal: {notes}")
            if response:
                goal_text.append(f"Response: {response}")
            if goal_text:
                parts.append(f"{label} ({' | '.join(goal_text)})")
        elif isinstance(value, str) and value.strip():
            val = value.strip()
            if max_field_length is not None:
                val = val[:max_field_length]
            parts.append(f"{key}: {val}")
    
    if not parts:
        return ""
    return "; ".join(parts)


def _serialize_report_to_text(r, student_name: str, max_field_length: Optional[int] = None) -> str:
    complaints = _scrub_pii_name(r.present_complaints or "", student_name)
    observation = _scrub_pii_name(r.current_observation or "", student_name)
    assessment = _scrub_pii_name(r.assessment_done or "", student_name)
    diagnosis = _scrub_pii_name(r.provisional_diagnosis or "", student_name)
    notes = _scrub_pii_name(r.progress_notes or "", student_name)
    
    goals_text = _goals_to_readable_text_truncated(r.goals_achieved, max_field_length)
    goals_text_scrubbed = _scrub_pii_name(goals_text, student_name)
    
    if max_field_length is not None:
        if complaints: complaints = complaints[:max_field_length]
        if observation: observation = observation[:max_field_length]
        if assessment: assessment = assessment[:max_field_length]
        if diagnosis: diagnosis = diagnosis[:max_field_length]
        if notes: notes = notes[:max_field_length]
        
    parts = []
    if complaints: parts.append(f"Complaints: {complaints}")
    if observation: parts.append(f"Observation: {observation}")
    if assessment: parts.append(f"Assessment: {assessment}")
    if diagnosis: parts.append(f"Diagnosis: {diagnosis}")
    if notes: parts.append(f"Notes: {notes}")
    if goals_text_scrubbed: parts.append(f"Goals/Observations: {goals_text_scrubbed}")
    
    return f"Date: {r.report_date}\n" + "\n".join(parts)


def _calculate_total_char_count(reports: List[Any], student_name: str, max_field_length: Optional[int] = None) -> int:
    return sum(len(_serialize_report_to_text(r, student_name, max_field_length)) for r in reports)


def _extract_skipped_report_dates(all_reports: List[Any], kept_reports: List[Any]) -> List[str]:
    """Return list of dates (as YYYY-MM-DD strings) for reports that were skipped."""
    kept_ids = {r.id for r in kept_reports}
    skipped_dates = []
    for r in all_reports:
        if r.id not in kept_ids:
            skipped_dates.append(r.report_date.isoformat())
    return skipped_dates


def _build_ai_summary_prompt(
    kept_reports: List[Any],
    student_name: str,
    active_sub_areas: List[str],
    max_field_length: Optional[int]
) -> str:
    therapy_type = kept_reports[0].therapy_type if kept_reports else "Therapy"
    
    prompt = f"""You are a clinical therapist writing a progress summary for {therapy_type} sessions.
Your task is to analyze the session notes and write a factual progress summary for each of the active sub-areas.

STRICT CLINICAL RULES:
- Write in professional, objective, evidence-based clinical language.
- Summarize only what is explicitly documented. Do NOT make assumptions, extrapolate, or invent details.
- Compare earlier and later sessions when multiple reports are available. Highlight only clearly documented improvements, consistent performance, or continuing difficulties. Do not infer progress where the reports do not provide evidence.
- For each sub-area, write a coherent summary of 2-3 complete sentences detailing the student's current status and progress.
- Describe progress or challenges objectively (e.g. "the student demonstrated...", "required prompts for...", "performance was consistent").
- If the notes describe inconsistent or fluctuating progress, report that directly.
- DO NOT provide any recommendations, next steps, strategies, or treatment advice (e.g. do NOT write "continued support is recommended" or "the therapist should").
- If a sub-area has no notes or data in the session details below, provide a short statement "No documented progress details in this period."

ACTIVE SUB-AREAS:
{", ".join(active_sub_areas)}

SESSION NOTES:
"""
    for idx, r in enumerate(kept_reports, 1):
        prompt += f"\nSession {idx}:\n"
        prompt += _serialize_report_to_text(r, student_name, max_field_length) + "\n"
        
    prompt += """
Provide your output as a JSON object where the keys are the exact active sub-areas listed above and the values are their corresponding progress summaries.
"""
    return prompt


def _generate_fallback_summary(
    kept_reports: List[Any],
    active_sub_areas: List[str],
    student_name: str,
    max_field_length: Optional[int]
) -> Dict[str, str]:
    """Build structured, date-anchored progress summaries from raw session notes.

    Notes are grouped by session date and formatted as date-prefixed points
    (e.g. '2026-08-05: Observed steady progress; 2026-08-20: Required minimal
    prompts.') capped at clean sentence/clause boundaries.
    """
    fallback_summaries = {}
    for sub in active_sub_areas:
        # Collect (date, note_text) pairs so output is chronological
        dated_notes: List[tuple] = []
        for r in kept_reports:
            parsed = _parse_goals_achieved(r.goals_achieved)
            if not isinstance(parsed, dict) or sub not in parsed:
                continue
            val = parsed[sub]
            date_label = r.report_date.isoformat() if hasattr(r.report_date, "isoformat") else str(r.report_date)
            if isinstance(val, dict):
                note_parts = []
                notes = val.get("notes", "").strip()
                response = val.get("response", "").strip()
                if notes:
                    note_parts.append(notes)
                if response:
                    note_parts.append(response)
                if note_parts:
                    dated_notes.append((date_label, " ".join(note_parts)))
            elif isinstance(val, str) and val.strip():
                dated_notes.append((date_label, val.strip()))

        if not dated_notes:
            fallback_summaries[sub] = "No documented progress details in this period."
            continue

        # Scrub PII and optionally truncate each note
        cleaned: List[str] = []
        for date_label, note in dated_notes:
            scrubbed = _scrub_pii_name(note, student_name)
            if max_field_length is not None:
                scrubbed = scrubbed[:max_field_length]
            cleaned.append(f"{date_label}: {scrubbed}")

        # Join with " ; " and cap at 450 chars, cutting only at a "; " boundary
        joined = " ; ".join(cleaned)
        if len(joined) > 450:
            # Walk backwards from char 450 to find last "; " boundary
            cut = joined.rfind(" ; ", 0, 450)
            if cut > 0:
                joined = joined[:cut]
            else:
                # No boundary found — hard-cut at 447 chars
                joined = joined[:447] + "..."

        fallback_summaries[sub] = joined

    return fallback_summaries


def _get_gemini_error_status_code(exc: Exception) -> Optional[int]:
    """Extract a status code from common google-genai/httpx exceptions."""
    for attr_name in ("status_code", "status", "code", "statusCode"):
        value = getattr(exc, attr_name, None)
        if isinstance(value, int):
            return value

    response = getattr(exc, "response", None)
    if response is not None:
        response_status = getattr(response, "status_code", None)
        if isinstance(response_status, int):
            return response_status

    exc_text = str(exc).lower()
    if "503" in exc_text:
        return 503
    if "429" in exc_text:
        return 429
    return None


def _is_retryable_gemini_error(exc: Exception) -> bool:
    """Only retry errors that are reasonably transient."""
    status_code = _get_gemini_error_status_code(exc)
    if status_code == 503:
        return True
    if status_code in (429, 400, 401, 403):
        return False
    if isinstance(exc, (TimeoutError, ConnectionError, OSError)):
        return True
    exc_name = type(exc).__name__.lower()
    if any(token in exc_name for token in ("timeout", "network", "connect")):
        return True
    return False


@router.post("/summary/ai", response_model=TherapySummaryResponse)
async def ai_summarize_reports(
    payload: TherapySummaryRequest = Body(...),
    db: Session = Depends(deps.get_db),
    current_user: schemas.user.User = Depends(deps.get_current_active_user),
) -> Any:
    """Generate a comprehensive AI analysis of therapy reports for a student."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY environment variable not set on server.")

    # Resolve therapist specialization restriction
    role = str(getattr(current_user, "role", "") or "").lower()
    if role == "therapist":
        specialization = _get_therapist_specialization(db, current_user.email)
        if not specialization:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Therapists must have a specialization assigned to generate AI summaries."
            )
        # Force the requested therapy type to match specialization
        payload.therapy_type = specialization

    # Fetch student record
    from app.crud.student import student as crud_student
    db_student = crud_student.get_by_student_id(db, student_id=payload.student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail=f"Student with ID {payload.student_id} not found.")

    # Get dates for preset range
    try:
        from_date, to_date = get_preset_dates(payload.preset_range)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Fetch reports
    reports = crud.therapy_report.get_by_student(db, student_id=db_student.id)
    if not reports:
        raise HTTPException(status_code=404, detail="No therapy reports found for student.")

    # Filter reports
    filtered = []
    for r in reports:
        if r.therapy_type != payload.therapy_type:
            continue
        if r.report_date < from_date or r.report_date > to_date:
            continue
        filtered.append(r)

    filtered.sort(key=lambda r: r.report_date)
    original_count = len(filtered)
    if original_count == 0:
        raise HTTPException(status_code=404, detail="No therapy reports found in the selected range.")

    # Cap original set at latest 100 reports
    kept_reports = list(filtered[-100:])

    # Generate cache key hash
    reports_hash = hashlib.md5(",".join([f"{r.id}:{r.updated_at.isoformat()}" for r in kept_reports]).encode("utf-8")).hexdigest()
    SCHEMA_VERSION = 2  # Bumped to 2: invalidates fallback-cached summaries from SDK migration (2026-06-27)

    # Layer 1: Cache check
    cached = get_cached_summary(
        db,
        student_id=db_student.id,
        therapy_type=payload.therapy_type,
        from_date=from_date,
        to_date=to_date,
        reports_hash=reports_hash,
        schema_version=SCHEMA_VERSION
    )
    if cached:
        return TherapySummaryResponse(
            student_id=payload.student_id,
            therapy_type=payload.therapy_type,
            summaries=cached.summaries,
            used_reports=original_count,
            truncated=cached.truncated,
            truncation_type=cached.truncation_type,
            skipped_report_dates=cached.skipped_report_dates,
            model="cache",
            date_range={
                "start_date": from_date.isoformat(),
                "end_date": to_date.isoformat()
            }
        )

    # Layer 2: Preemptive daily check
    daily_quota_ok = await daily_request_counter.increment_and_check()
    student_name = db_student.name or "the student"

    if not daily_quota_ok:
        # Fallback to database generator immediately
        active_sub_areas = _get_active_sub_areas(kept_reports)
        if not active_sub_areas:
            active_sub_areas = ["General Progress"]
        fallback_summaries = _generate_fallback_summary(kept_reports, active_sub_areas, student_name, None)
        
        create_or_update_cache(
            db,
            student_id=db_student.id,
            therapy_type=payload.therapy_type,
            from_date=from_date,
            to_date=to_date,
            summaries=fallback_summaries,
            reports_hash=reports_hash,
            schema_version=SCHEMA_VERSION,
            truncated=False,
            truncation_type=None,
            skipped_report_dates=None,
            used_reports=original_count
        )
        return TherapySummaryResponse(
            student_id=payload.student_id,
            therapy_type=payload.therapy_type,
            summaries=fallback_summaries,
            used_reports=original_count,
            truncated=False,
            truncation_type=None,
            skipped_report_dates=None,
            model="fallback-data-analysis",
            date_range={
                "start_date": from_date.isoformat(),
                "end_date": to_date.isoformat()
            }
        )

    # Layer 3: Pruning & Truncation with Convergence safety check
    truncated = False
    truncation_type = None
    max_field_length = None

    total_chars = _calculate_total_char_count(kept_reports, student_name)
    if total_chars > 40000:
        truncated = True
        if len(kept_reports) > 30:
            # Uniform Sampling: Keep first 2 (baseline), last 10 (recent status),
            # and up to 18 reports uniformly spread across the middle — so no
            # multi-week block is silently dropped from the clinical record.
            BASELINE = 2
            RECENT = 10
            MIDDLE_BUDGET = 18
            head = kept_reports[:BASELINE]
            tail = kept_reports[-RECENT:]
            # Middle is everything between baseline and recent tail
            tail_start_idx = max(BASELINE, len(kept_reports) - RECENT)
            middle_pool = kept_reports[BASELINE:tail_start_idx]
            if len(middle_pool) <= MIDDLE_BUDGET:
                middle_sample = middle_pool
            else:
                # Pick evenly spaced indices across the middle pool
                step = len(middle_pool) / MIDDLE_BUDGET
                middle_sample = [middle_pool[int(i * step)] for i in range(MIDDLE_BUDGET)]
            # De-duplicate by id preserving chronological order
            seen_ids: set = set()
            merged = []
            for r in head + middle_sample + tail:
                if r.id not in seen_ids:
                    seen_ids.add(r.id)
                    merged.append(r)
            kept_reports = sorted(merged, key=lambda r: r.report_date)
            logging.info(
                f"Uniform sampling: {len(kept_reports)} reports kept "
                f"(baseline={BASELINE}, middle_sample={len(middle_sample)}, recent={RECENT})."
            )

        # Check if still exceeding 40k after sampling
        total_chars = _calculate_total_char_count(kept_reports, student_name)
        if total_chars > 40000:
            active_sub_areas = _get_active_sub_areas(kept_reports)
            n_sub = len(active_sub_areas) if active_sub_areas else 1
            max_field_length = 40000 // (len(kept_reports) * n_sub * 2)

            # Incremental pruning loop if max_field_length < 150
            while max_field_length < 150 and len(kept_reports) > 10:
                kept_reports.pop(len(kept_reports) // 2)  # Pop a middle report
                active_sub_areas = _get_active_sub_areas(kept_reports)
                n_sub = len(active_sub_areas) if active_sub_areas else 1
                max_field_length = 40000 // (len(kept_reports) * n_sub * 2)

            if max_field_length < 150:
                # Fallback: If we hit the 10-report floor and max_field_length is still < 150
                # (which requires a pathologically high active_sub_areas count), we clamp
                # max_field_length to 150. This prevents producing near-empty truncated fields
                # while risking slightly exceeding the character budget (an acceptable trade-off
                # for clinical readability).
                logging.warning(
                    f"Incremental pruning reached 10-report floor without converging. "
                    f"Clamping max_field_length to 150 (sub-areas count: {n_sub})."
                )
                max_field_length = 150

    # Extract skipped dates comparing all matching reports to kept reports
    skipped_report_dates = _extract_skipped_report_dates(filtered, kept_reports)
    if len(skipped_report_dates) > 0:
        truncation_type = "reports_skipped"
    elif max_field_length is not None:
        truncation_type = "text_trimmed"

    # Derive active sub areas for final kept reports
    active_sub_areas = _get_active_sub_areas(kept_reports)
    if not active_sub_areas:
        active_sub_areas = ["General Progress"]

    # Layer 4: Sliding window rate limit check
    await api_rate_limiter.acquire()

    # Layer 5: Gemini API execution with targeted retry + JSON mode
    client = _get_gemini_client()
    prompt = _build_ai_summary_prompt(kept_reports, student_name, active_sub_areas, max_field_length)

    response_text = None
    model_name = "fallback-data-analysis"

    # Up to 3 attempts (0, 1, 2). Retryable errors (503, timeout, network) get
    # incremental backoff (1.5s then 3s). Non-retryable errors (429, 4xx auth)
    # bail immediately so the user gets the fallback summary without extra delay.
    MAX_RETRIES = 2
    for attempt in range(MAX_RETRIES + 1):
        try:
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    response_mime_type="application/json",
                    safety_settings=[
                        genai_types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH",      threshold="BLOCK_ONLY_HIGH"),
                        genai_types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_ONLY_HIGH"),
                        genai_types.SafetySetting(category="HARM_CATEGORY_HARASSMENT",        threshold="BLOCK_ONLY_HIGH"),
                        genai_types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_ONLY_HIGH"),
                    ]
                )
            )
            response_text = response.text
            break
        except Exception as e:
            is_last_attempt = attempt == MAX_RETRIES
            status_code = _get_gemini_error_status_code(e)

            # Fast-fail for quota / auth errors — no point retrying
            if status_code in (429, 400, 401, 403):
                logging.warning(
                    f"Gemini non-retryable error (HTTP {status_code}) on attempt {attempt}; "
                    f"using local fallback: {e}"
                )
                break

            # Retry transient errors: 503 service unavailable, timeouts, network blips
            if status_code == 503 or _is_retryable_gemini_error(e):
                if not is_last_attempt:
                    delay = 1.5 * (attempt + 1)  # 1.5s then 3.0s
                    logging.warning(
                        f"Gemini attempt {attempt} failed ({type(e).__name__}, "
                        f"HTTP {status_code}); retrying in {delay}s: {e}"
                    )
                    await asyncio.sleep(delay)
                    continue
                logging.warning(
                    f"Gemini all {MAX_RETRIES + 1} attempts exhausted; using local fallback: {e}"
                )
                break

            # Unknown error — don't retry
            logging.warning(f"Gemini unknown error on attempt {attempt}: {type(e).__name__}: {e}")
            break

    # Parse JSON structured output
    summaries = None
    if response_text:
        try:
            parsed = json.loads(response_text)
            if not isinstance(parsed, dict):
                raise ValueError("Gemini response is not a JSON object")
            summaries = {}
            for sub in active_sub_areas:
                summaries[sub] = parsed.get(sub, "No documented progress details in this period.")
            logging.info("Gemini summary generated successfully")
            model_name = settings.GEMINI_MODEL
        except (TypeError, ValueError, json.JSONDecodeError) as e:
            logging.warning(f"Gemini response JSON parsing failed; using local fallback: {e}")
            response_text = None

    # Fallback to local DB-driven analysis if Gemini response is missing or malformed
    if summaries is None:
        summaries = _generate_fallback_summary(kept_reports, active_sub_areas, student_name, max_field_length)
        model_name = "fallback-data-analysis"

    # Cache the result. skipped_report_dates is already a List[str] (ISO format), pass directly.
    create_or_update_cache(
        db,
        student_id=db_student.id,
        therapy_type=payload.therapy_type,
        from_date=from_date,
        to_date=to_date,
        summaries=summaries,
        reports_hash=reports_hash,
        schema_version=SCHEMA_VERSION,
        truncated=truncated,
        truncation_type=truncation_type,
        skipped_report_dates=skipped_report_dates if skipped_report_dates else None,
        used_reports=original_count
    )

    return TherapySummaryResponse(
        student_id=payload.student_id,
        therapy_type=payload.therapy_type,
        summaries=summaries,
        used_reports=original_count,
        truncated=truncated,
        truncation_type=truncation_type,
        skipped_report_dates=skipped_report_dates,
        model=model_name,
        date_range={
            "start_date": from_date.isoformat(),
            "end_date": to_date.isoformat()
        }
    )


@router.get("/summary/history/{student_id}", response_model=List[Any])
def get_summary_history(
    student_id: str,
    db: Session = Depends(deps.get_db),
    current_user: schemas.user.User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve all previously generated AI progress summaries for a student."""
    from app.crud.student import student as crud_student
    from app.models.therapy_summary import TherapySummary
    from app.models.student import Student
    
    db_student = crud_student.get_by_student_id(db, student_id=student_id)
    if not db_student:
        try:
            student_int_id = int(student_id)
            db_student = db.query(Student).filter(Student.id == student_int_id).first()
        except ValueError:
            pass
            
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    summaries = (
        db.query(TherapySummary)
        .filter(TherapySummary.student_id == db_student.id)
        .order_by(TherapySummary.created_at.desc())
        .all()
    )
    
    history_list = []
    for s in summaries:
        history_list.append({
            "id": s.id,
            "summaries": s.summaries,
            "summary": "",  # dynamically parsed on frontend
            "dateRange": {
                "start": s.from_date.isoformat() if s.from_date else "All dates",
                "end": s.to_date.isoformat() if s.to_date else "Current",
            },
            "therapyType": s.therapy_type,
            "reportCount": s.used_reports or 0,
            "generatedAt": s.created_at.strftime("%Y-%m-%d %H:%M:%S") if s.created_at else "",
            "model": s.reports_hash,
        })
    return history_list


@router.delete("/summary/history/{summary_id}")
def delete_summary_history(
    summary_id: int,
    db: Session = Depends(deps.get_db),
    current_user: schemas.user.User = Depends(deps.get_current_active_user),
) -> Any:
    """Delete a generated summary history entry from the database."""
    from app.models.therapy_summary import TherapySummary
    
    db_obj = db.query(TherapySummary).filter(TherapySummary.id == summary_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Summary entry not found.")
        
    # Check therapist authorization if role is therapist
    role = str(getattr(current_user, "role", "") or "").lower()
    if role == "therapist":
        specialization = _get_therapist_specialization(db, current_user.email)
        if not specialization or _normalize_therapy_type(db_obj.therapy_type) != _normalize_therapy_type(specialization):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are only authorized to delete summaries of your own therapy type."
            )
            
    db.delete(db_obj)
    db.commit()
    return {"status": "success", "message": "Summary deleted successfully."}