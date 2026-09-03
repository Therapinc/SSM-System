import base64
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy import false
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict

# Renamed import to avoid variable name conflicts
from app.crud.student import student as crud_student
from app.crud import therapist_assignment as crud_therapist_assignment
from app.schemas.student import Student, StudentCreate, StudentUpdate, StudentListItem
from app.utils.student_serializers import STUDENT_LIST_LOAD_COLUMNS, serialize_student_list_item
from pydantic import BaseModel
from sqlalchemy.orm import load_only


class StudentsPage(BaseModel):
    items: List[StudentListItem]
    total: int
    page: int
    limit: int
    total_pages: int
from app.db.session import get_db
from app.utils.pagination import PageParams, Page
from app.api.deps import get_current_active_user
from app.models.therapist import Therapist
from app.models.user import User
from app.models.user import UserRole
from app.core.cloudinary import delete_image, get_cloudinary_folder, upload_image

router = APIRouter()


# Columns to skip when serializing — these are heavy blobs that should
# not be transferred from Neon unless explicitly needed.
_HEAVY_COLUMNS = {"photo", "documents"}


def _serialize_student_with_photo(student_obj) -> Dict[str, Any]:
    student_data = {
        c.name: getattr(student_obj, c.name)
        for c in student_obj.__table__.columns
        if c.name not in _HEAVY_COLUMNS
    }
    # photo_url (Cloudinary URL) is always included; legacy photo binary is skipped.
    return student_data


def _get_student_documents_metadata(db: Session, student_id: int) -> List[Dict[str, Any]]:
    from app.models.student import StudentDocument
    from sqlalchemy.orm import defer
    docs = db.query(StudentDocument).options(defer(StudentDocument.file_data)).filter(StudentDocument.student_id == student_id).all()
    return [
        {
            "id": doc.id,
            "name": doc.name,
            "documentType": doc.document_type,
            "documentLabel": doc.document_label,
            "content_type": doc.content_type,
            "file_url": doc.file_data if (doc.file_data and (doc.file_data.startswith("http://") or doc.file_data.startswith("https://"))) else f"/api/v1/students/{student_id}/documents/{doc.id}",
            "upload_date": doc.upload_date.isoformat() if doc.upload_date else None,
            "file_size": doc.file_size
        }
        for doc in docs
    ]

# --------------------------------------------------------------------
# ▼▼▼ THIS IS THE FULLY MODIFIED FUNCTION ▼▼▼
# --------------------------------------------------------------------
@router.get("/", response_model=StudentsPage)
def read_students(
    db: Session = Depends(get_db),
    pagination: PageParams = Depends(),
    search: Optional[str] = None,
    class_name: Optional[str] = None,
    division: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Retrieve students with optional search, filtering, and pagination.
    """
    current_role = str(getattr(current_user, "role", "") or "").lower()
    query = db.query(crud_student.model)

    if current_user.is_superuser or current_role in {UserRole.ADMIN.value, "hm", "headmaster"}:
        pass
    elif current_role == UserRole.THERAPIST.value:
        therapist = db.query(Therapist).filter(Therapist.email == current_user.email).first()
        assigned_ids = (
            crud_therapist_assignment.get_assigned_student_ids(db, therapist.id)
            if therapist
            else []
        )
        query = query.filter(crud_student.model.id.in_(assigned_ids)) if assigned_ids else query.filter(false())
    else:
        query = query.filter(false())

    if search:
        from sqlalchemy import or_
        search_filter = or_(
            crud_student.model.name.ilike(f"%{search}%"),
            crud_student.model.admission_number.ilike(f"%{search}%"),
            crud_student.model.student_id.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    if class_name:
        query = query.filter(crud_student.model.class_name == class_name)

    if division:
        query = query.filter(crud_student.model.division == division)

    total = query.count()
    students_from_db = (
        query.options(load_only(*STUDENT_LIST_LOAD_COLUMNS))
        .offset(pagination.skip)
        .limit(pagination.limit)
        .all()
    )

    list_items = [serialize_student_list_item(student_obj) for student_obj in students_from_db]

    page = Page.create(items=list_items, total=total, params=pagination)
    if hasattr(page, "dict"):
        return page.dict()
    return page
# --------------------------------------------------------------------
# ▲▲▲ END OF MODIFIED FUNCTION ▲▲▲
# --------------------------------------------------------------------


@router.get("/me")
def get_my_student_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get the current logged-in student's own data (read-only).
    The username should match the student_id.
    """
    # Get student by student_id (which is the username for student users)
    # Use a deferred query to skip heavy columns (photo binary, legacy documents JSONB)
    from sqlalchemy.orm import defer as sa_defer
    student = (
        db.query(crud_student.model)
        .options(sa_defer(crud_student.model.photo), sa_defer(crud_student.model.documents))
        .filter(crud_student.model.student_id == current_user.username)
        .first()
    )
    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student record not found for this user"
        )
    
    student_data = _serialize_student_with_photo(student)
    
    # Strip file_data from documents to keep payload small
    student_data['documents'] = _get_student_documents_metadata(db, student.id)
    
    return student_data


@router.post("/", response_model=Student)
def create_student(
    student_in: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new student.
    """
    
    if student_in.admission_number:
        db_student = crud_student.get_by_admission_number(db, admission_number=student_in.admission_number)
        if db_student:
            raise HTTPException(
                status_code=400,
                detail="Student with this admission number already exists"
            )
    return crud_student.create(db=db, obj_in=student_in)

@router.put("/{student_id}/case-record", response_model=Student)
def upsert_case_record(
    student_id: int,
    case_record: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create/update a student's case record.
    """
    db_student = crud_student.get(db, id=student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    updated = crud_student.update_case_record(db=db, db_obj=db_student, case_record=case_record)
    return updated

@router.get("/{student_id}")
def read_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get a specific student by ID, including a photo URL if available.
    """
    db_student = crud_student.get_deferred(db, id=student_id, defer_columns=["photo", "documents"])
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    student_data = _serialize_student_with_photo(db_student)
    # Strip file_data from documents to keep payload small
    student_data['documents'] = _get_student_documents_metadata(db, student_id)

    return student_data

@router.post("/{student_id}/photo")
def upload_student_photo(
    *,
    student_id: int,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Upload and update a student's photo.
    """
    db_student = crud_student.get(db, id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    contents = file.file.read()
    # Validate file size (200 KB limit to prevent database bloat)
    max_size = 200 * 1024
    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"Photo size exceeds 200KB limit. Uploaded file: {len(contents) / 1024:.2f}KB"
        )

    cloudinary_folder = get_cloudinary_folder("students", db_student.student_id)
    uploaded = upload_image(
        contents,
        folder=cloudinary_folder,
        public_id="profile_photo",
        overwrite=True,
    )
    update_data = {
        "photo": contents,
        "photo_url": uploaded.get("secure_url") or uploaded.get("url"),
        "photo_public_id": uploaded.get("public_id"),
    }
    updated_student = crud_student.update(db=db, db_obj=db_student, obj_in=update_data)

    student_data = _serialize_student_with_photo(updated_student)
    # Strip file_data from documents
    student_data['documents'] = _get_student_documents_metadata(db, student_id)
    return student_data

@router.delete("/{student_id}/photo")
def delete_student_photo(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Remove/delete a student's photo.
    """
    db_student = crud_student.get(db, id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    if getattr(db_student, "photo_public_id", None):
        try:
            delete_image(db_student.photo_public_id)
        except Exception:
            pass

    update_data = {"photo": None, "photo_url": None, "photo_public_id": None}
    updated_student = crud_student.update(db=db, db_obj=db_student, obj_in=update_data)

    student_data = _serialize_student_with_photo(updated_student)
    student_data['photo_url'] = None
    # Strip file_data from documents
    student_data['documents'] = _get_student_documents_metadata(db, student_id)
    return student_data


@router.put("/{student_id}")
def update_student(
    student_id: int,
    student_update: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Update a student's information.
    """
    db_student = crud_student.get(db, id=student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    # If photo is being updated, handle it
    update_data = student_update.model_dump(exclude_unset=True)
    if 'photo' in update_data and update_data['photo'] is not None:
        update_data['photo'] = update_data['photo']  # bytes expected
    db_student = crud_student.update(db=db, db_obj=db_student, obj_in=update_data)

    student_data = _serialize_student_with_photo(db_student)
    # Strip file_data from documents
    student_data['documents'] = _get_student_documents_metadata(db, student_id)
    return student_data

@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a student.
    """
    db_student = db.query(crud_student.model.id).filter(crud_student.model.id == student_id).first()
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    crud_student.remove(db=db, id=student_id)
    return {"message": "Student successfully deleted"}

@router.post("/{student_id}/documents")
def upload_student_document(
    *,
    student_id: int,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    document_type: Optional[str] = Form(None),
    document_label: Optional[str] = Form(None),
    documentType: Optional[str] = Form(None),
    documentTypeLabel: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Upload a document/certificate (PDF) for a student. Maximum 5MB.
    """
    # Validate file type
    allowed_content_types = {
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
    }
    file_content_type = (file.content_type or "application/pdf").lower()
    file_name = file.filename or "document"
    if file_content_type not in allowed_content_types and not file_name.lower().endswith((".pdf", ".png", ".jpg", ".jpeg")):
        raise HTTPException(status_code=400, detail="Only PDF, PNG, JPG, and JPEG files are allowed")
    
    # Read file contents
    contents = file.file.read()
    file_size = len(contents)
    
    # Validate file size (5MB = 5 * 1024 * 1024 bytes)
    max_size = 5 * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(status_code=400, detail=f"File size exceeds 5MB limit. File size: {file_size / (1024 * 1024):.2f}MB")
    
    db_student = db.query(crud_student.model.id).filter(crud_student.model.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    resolved_document_type = document_type or documentType
    resolved_document_label = document_label or documentTypeLabel
    
    from datetime import datetime
    import uuid
    document_id = str(uuid.uuid4())
    stored_file_data = None
    
    # Try uploading to Cloudinary first
    try:
        folder = get_cloudinary_folder("student_documents", str(student_id))
        cloudinary_resp = upload_image(
            contents,
            folder=folder,
            public_id=document_id,
            overwrite=True,
            resource_type="auto"
        )
        if cloudinary_resp and cloudinary_resp.get("secure_url"):
            stored_file_data = cloudinary_resp.get("secure_url")
    except Exception:
        # Fallback to base64 encoding if Cloudinary is not configured or fails
        pass

    if not stored_file_data:
        import base64
        stored_file_data = base64.b64encode(contents).decode('utf-8')
    
    try:
        from app.models.student import StudentDocument
        db_doc = StudentDocument(
            id=document_id,
            student_id=student_id,
            name=file_name,
            document_type=resolved_document_type,
            document_label=resolved_document_label,
            content_type=file_content_type,
            file_data=stored_file_data,
            upload_date=datetime.now(),
            file_size=file_size
        )
        db.add(db_doc)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save document: {str(e)}")
    
    return {
        "message": "Document uploaded successfully",
        "document_name": file.filename,
        "file_size": file_size,
        "document_id": document_id
    }

@router.get("/{student_id}/documents")
def get_student_documents(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get all documents for a student.
    """
    db_student = db.query(crud_student.model.id).filter(crud_student.model.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    documents_list = _get_student_documents_metadata(db, student_id)
    
    return {
        "documents": documents_list,
        "total": len(documents_list)
    }

@router.get("/{student_id}/documents/{document_id}")
def download_student_document(
    student_id: int,
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Download a specific document by UUID.
    """
    db_student = db.query(crud_student.model.id).filter(crud_student.model.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    from app.models.student import StudentDocument
    document = db.query(StudentDocument).filter(
        StudentDocument.id == document_id,
        StudentDocument.student_id == student_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    is_url = document.file_data and (document.file_data.startswith("http://") or document.file_data.startswith("https://"))
    file_url = document.file_data if is_url else f"/api/v1/students/{student_id}/documents/{document.id}"
    file_data_payload = document.file_data if is_url else f"data:{document.content_type};base64,{document.file_data}"

    return {
        "id": document.id,
        "name": document.name,
        "documentType": document.document_type,
        "documentLabel": document.document_label,
        "content_type": document.content_type,
        "file_url": file_url,
        "file_data": file_data_payload,
        "upload_date": document.upload_date.isoformat() if document.upload_date else None,
        "file_size": document.file_size
    }

@router.delete("/{student_id}/documents/{document_id}")
def delete_student_document(
    student_id: int,
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Delete a specific document by UUID.
    """
    db_student = db.query(crud_student.model.id).filter(crud_student.model.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    from app.models.student import StudentDocument
    doc = db.query(StudentDocument).filter(
        StudentDocument.id == document_id,
        StudentDocument.student_id == student_id
    ).first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    deleted_doc_name = doc.name
    try:
        db.delete(doc)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")
    
    return {
        "message": "Document deleted successfully",
        "document_name": deleted_doc_name
    }
