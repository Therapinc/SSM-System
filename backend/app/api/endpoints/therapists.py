from typing import List, Optional, Any, Dict

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import therapist as crud_therapist
from app.crud import therapist_assignment as crud_therapist_assignment
from app.core.cloudinary import build_profile_photo_public_id, delete_image, get_cloudinary_folder, upload_image
from app.schemas import student as schemas_student
from app.schemas import therapist as schemas_therapist
from app.utils.pagination import Page, PageParams
from app.utils.student_serializers import serialize_student_list_item

router = APIRouter()


class TherapistsPage(BaseModel):
    items: List[schemas_therapist.Therapist]
    total: int
    page: int
    limit: int
    total_pages: int


def _serialize_therapist_with_photo(db_therapist) -> Dict[str, Any]:
    return {c.name: getattr(db_therapist, c.name) for c in db_therapist.__table__.columns}


@router.get("/", response_model=TherapistsPage)
def read_therapists(
    db: Session = Depends(deps.get_db),
    pagination: PageParams = Depends(),
    search: Optional[str] = None,
    current_user=Depends(deps.get_current_active_user),
) -> Dict[str, Any]:
    items, total = crud_therapist.list_therapists_paginated(
        db,
        skip=pagination.skip,
        limit=pagination.limit,
        search=search,
    )
    page = Page.create(items=items, total=total, params=pagination)
    if hasattr(page, "dict"):
        return page.dict()
    return page


@router.post("/", response_model=schemas_therapist.Therapist)
def create_therapist(
    therapist: schemas_therapist.TherapistCreate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
):
    return crud_therapist.create_therapist(db=db, therapist=therapist)


@router.get("/{therapist_id}", response_model=schemas_therapist.Therapist)
def read_therapist(
    therapist_id: int,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
):
    db_therapist = crud_therapist.get_therapist(db, therapist_id=therapist_id)
    if db_therapist is None:
        raise HTTPException(status_code=404, detail="Therapist not found")
    return db_therapist


@router.post("/{therapist_id}/photo", response_model=schemas_therapist.Therapist)
def upload_therapist_photo(
    therapist_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
):
    db_therapist = crud_therapist.get_therapist(db, therapist_id=therapist_id)
    if db_therapist is None:
        raise HTTPException(status_code=404, detail="Therapist not found")

    contents = file.file.read()
    max_size = 200 * 1024
    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"Photo size exceeds 200KB limit. Uploaded file: {len(contents) / 1024:.2f}KB",
        )

    uploaded = upload_image(
        contents,
        folder=get_cloudinary_folder("therapists"),
        public_id=build_profile_photo_public_id("Therapist", db_therapist.id),
        overwrite=True,
    )

    updated_therapist = crud_therapist.update_therapist(
        db,
        therapist_id=therapist_id,
        therapist={
            "photo_url": uploaded.get("secure_url") or uploaded.get("url"),
            "photo_public_id": uploaded.get("public_id"),
        },
    )
    return updated_therapist


@router.delete("/{therapist_id}/photo", response_model=schemas_therapist.Therapist)
def delete_therapist_photo(
    therapist_id: int,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
):
    db_therapist = crud_therapist.get_therapist(db, therapist_id=therapist_id)
    if db_therapist is None:
        raise HTTPException(status_code=404, detail="Therapist not found")

    if getattr(db_therapist, "photo_public_id", None):
        try:
            delete_image(db_therapist.photo_public_id)
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Failed to delete therapist photo: {error}") from error

    updated_therapist = crud_therapist.update_therapist(
        db,
        therapist_id=therapist_id,
        therapist={"photo_url": None, "photo_public_id": None},
    )
    return updated_therapist


@router.put("/{therapist_id}", response_model=schemas_therapist.Therapist)
def update_therapist(
    therapist_id: int,
    therapist: schemas_therapist.TherapistUpdate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
):
    db_therapist = crud_therapist.get_therapist(db, therapist_id=therapist_id)
    if db_therapist is None:
        raise HTTPException(status_code=404, detail="Therapist not found")

    old_email = db_therapist.email
    updated_therapist = crud_therapist.update_therapist(db, therapist_id=therapist_id, therapist=therapist)

    if therapist.email and therapist.email != old_email:
        from app.models.user import User as UserModel
        from sqlalchemy import func, or_
        user_account = db.query(UserModel).filter(
            or_(
                func.lower(UserModel.email) == (old_email or "").lower(),
                func.lower(UserModel.username) == (old_email or "").lower(),
                func.lower(UserModel.username) == (db_therapist.name or "").lower(),
                func.lower(UserModel.username) == (therapist.email or "").split('@')[0].lower()
            )
        ).first()
        if user_account:
            user_account.email = therapist.email
            db.commit()

    return updated_therapist


@router.delete("/{therapist_id}")
def delete_therapist(
    therapist_id: int,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_user),
):
    db_therapist = crud_therapist.get_therapist(db, therapist_id=therapist_id)
    if not db_therapist:
        raise HTTPException(status_code=404, detail="Therapist not found")
    if db_therapist and getattr(db_therapist, "photo_public_id", None):
        try:
            delete_image(db_therapist.photo_public_id)
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Failed to delete therapist photo: {error}") from error
    success = crud_therapist.delete_therapist(db, therapist_id=therapist_id)
    if not success:
        raise HTTPException(status_code=404, detail="Therapist not found")
    return {"message": "Therapist deleted successfully"}


@router.get("/{therapist_id}/students", response_model=List[schemas_student.StudentListItem])
def read_therapist_students(
    therapist_id: int,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_or_teacher_user),
):
    db_therapist = crud_therapist.get_therapist(db, therapist_id=therapist_id)
    if db_therapist is None:
        raise HTTPException(status_code=404, detail="Therapist not found")
    assigned = crud_therapist_assignment.get_assigned_students(db, therapist_id)
    return [serialize_student_list_item(student) for student in assigned]


@router.put("/{therapist_id}/students", response_model=List[schemas_student.StudentListItem])
def update_therapist_students(
    therapist_id: int,
    payload: schemas_therapist.TherapistStudentAssignmentsUpdate,
    db: Session = Depends(deps.get_db),
    current_user=Depends(deps.get_current_admin_or_teacher_user),
):
    db_therapist = crud_therapist.get_therapist(db, therapist_id=therapist_id)
    if db_therapist is None:
        raise HTTPException(status_code=404, detail="Therapist not found")

    try:
        assigned = crud_therapist_assignment.set_assigned_students(
            db,
            therapist_id=therapist_id,
            student_ids=payload.student_ids,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    return [serialize_student_list_item(student) for student in assigned]
