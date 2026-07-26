from typing import List, Optional, Any, Dict

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, load_only

from app.api import deps
from app.crud.student import student as student_crud
from app.crud.teacher import teacher
from app.db.session import get_db
from app.core.cloudinary import build_profile_photo_public_id, delete_image, get_cloudinary_folder, upload_image
from app.models.student import Student as StudentModel
from app.schemas.student import StudentListItem
from app.schemas.teacher import Teacher, TeacherCreate, TeacherUpdate
from app.utils.pagination import Page, PageParams
from app.utils.student_serializers import STUDENT_LIST_LOAD_COLUMNS, serialize_student_list_item

router = APIRouter()


class TeachersPage(BaseModel):
    items: List[Teacher]
    total: int
    page: int
    limit: int
    total_pages: int


def _serialize_teacher_with_photo(db_teacher) -> Dict[str, Any]:
    return {c.name: getattr(db_teacher, c.name) for c in db_teacher.__table__.columns}


@router.post("/", response_model=Teacher)
def create_teacher(
    teacher_in: TeacherCreate,
    db: Session = Depends(get_db),
    current_user=Depends(deps.get_current_active_user),
):
    db_teacher = teacher.get_by_aadhar(db, aadhar_number=teacher_in.aadhar_number)
    if db_teacher:
        raise HTTPException(status_code=400, detail="Teacher with this Aadhar number already exists")

    db_teacher = teacher.get_by_rci(db, rci_number=teacher_in.rci_number)
    if db_teacher:
        raise HTTPException(status_code=400, detail="Teacher with this RCI number already exists")

    return teacher.create(db=db, obj_in=teacher_in)


@router.get("/", response_model=TeachersPage)
def read_teachers(
    db: Session = Depends(get_db),
    pagination: PageParams = Depends(),
    search: Optional[str] = None,
    current_user=Depends(deps.get_current_active_user),
) -> Dict[str, Any]:
    items, total = teacher.list_paginated(
        db,
        skip=pagination.skip,
        limit=pagination.limit,
        search=search,
    )
    page = Page.create(items=items, total=total, params=pagination)
    if hasattr(page, "dict"):
        return page.dict()
    return page


@router.get("/{teacher_id}", response_model=Teacher)
def read_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(deps.get_current_active_user),
):
    db_teacher = teacher.get(db, id=teacher_id)
    if db_teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return db_teacher


@router.post("/{teacher_id}/photo", response_model=Teacher)
def upload_teacher_photo(
    teacher_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(deps.get_current_active_user),
):
    db_teacher = teacher.get(db, id=teacher_id)
    if db_teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")

    contents = file.file.read()
    max_size = 200 * 1024
    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"Photo size exceeds 200KB limit. Uploaded file: {len(contents) / 1024:.2f}KB",
        )

    uploaded = upload_image(
        contents,
        folder=get_cloudinary_folder("teachers"),
        public_id=build_profile_photo_public_id("Tr", db_teacher.id),
        overwrite=True,
    )

    updated_teacher = teacher.update(
        db=db,
        db_obj=db_teacher,
        obj_in={
            "photo_url": uploaded.get("secure_url") or uploaded.get("url"),
            "photo_public_id": uploaded.get("public_id"),
        },
    )
    return updated_teacher


@router.delete("/{teacher_id}/photo", response_model=Teacher)
def delete_teacher_photo(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(deps.get_current_active_user),
):
    db_teacher = teacher.get(db, id=teacher_id)
    if db_teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")

    if getattr(db_teacher, "photo_public_id", None):
        try:
            delete_image(db_teacher.photo_public_id)
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Failed to delete teacher photo: {error}") from error

    updated_teacher = teacher.update(
        db=db,
        db_obj=db_teacher,
        obj_in={"photo_url": None, "photo_public_id": None},
    )
    return updated_teacher


@router.put("/{teacher_id}", response_model=Teacher)
def update_teacher(
    teacher_id: int,
    teacher_in: TeacherUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(deps.get_current_active_user),
):
    db_teacher = teacher.get(db, id=teacher_id)
    if db_teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    old_email = db_teacher.email
    updated_teacher = teacher.update(db=db, db_obj=db_teacher, obj_in=teacher_in)

    if teacher_in.email and teacher_in.email != old_email:
        from app.models.user import User as UserModel
        from sqlalchemy import func, or_
        user_account = db.query(UserModel).filter(
            or_(
                func.lower(UserModel.email) == (old_email or "").lower(),
                func.lower(UserModel.username) == (old_email or "").lower(),
                func.lower(UserModel.username) == (db_teacher.name or "").lower(),
                func.lower(UserModel.username) == (teacher_in.email or "").split('@')[0].lower()
            )
        ).first()
        if user_account:
            user_account.email = teacher_in.email
            db.commit()

    return updated_teacher


@router.delete("/{teacher_id}")
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(deps.get_current_active_user),
):
    db_teacher = teacher.get(db, id=teacher_id)
    if db_teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    if getattr(db_teacher, "photo_public_id", None):
        try:
            delete_image(db_teacher.photo_public_id)
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Failed to delete teacher photo: {error}") from error
    teacher.remove(db=db, id=teacher_id)
    return {"message": "Teacher deleted successfully"}


@router.get("/me/students", response_model=List[StudentListItem])
def read_my_students(
    db: Session = Depends(get_db),
    current_user=Depends(deps.get_current_active_user),
) -> List[Dict[str, Any]]:
    if not current_user or not getattr(current_user, "email", None):
        raise HTTPException(status_code=403, detail="Not authenticated as teacher")
    db_teacher = teacher.get_by_email(db, email=current_user.email)
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    assignments = db_teacher.class_assignments or []
    if not assignments:
        return []

    filters = []
    for assignment in assignments:
        cls = assignment.get("class") or assignment.get("class_name")
        div = assignment.get("division")
        if cls and div is not None:
            filters.append(
                and_(
                    StudentModel.class_name == cls,
                    StudentModel.division == div,
                )
            )

    if not filters:
        return []

    students = (
        db.query(StudentModel)
        .options(load_only(*STUDENT_LIST_LOAD_COLUMNS))
        .filter(or_(*filters))
        .order_by(StudentModel.name.asc())
        .all()
    )
    return [serialize_student_list_item(student) for student in students]
