from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.crud.teacher import teacher
from app.schemas.teacher import Teacher, TeacherCreate, TeacherUpdate
from app.db.session import get_db
from app.api import deps
from app.crud.student import student as student_crud
from sqlalchemy import and_, or_
from typing import Optional
from app.schemas.student import Student as StudentSchema
from app.models.student import Student as StudentModel
from fastapi import status
from app.crud.user import user as user_crud
from app.schemas.user import UserCreate
from app.models.user import UserRole
from app.api import deps as api_deps

router = APIRouter()

@router.post("/", response_model=Teacher)
def create_teacher(
    teacher_in: TeacherCreate,
    db: Session = Depends(get_db),
    current_user = Depends(api_deps.get_current_active_user),
):
    # Only admin may create teachers (same rule as user creation endpoints)
    if not current_user.is_superuser and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Only admins can create new teacher accounts")

    # Basic uniqueness checks for teacher fields
    if teacher.get_by_aadhar(db, aadhar_number=teacher_in.aadhar_number):
        raise HTTPException(status_code=400, detail="Teacher with this Aadhar number already exists")
    if teacher_in.rci_number and teacher.get_by_rci(db, rci_number=teacher_in.rci_number):
        raise HTTPException(status_code=400, detail="Teacher with this RCI number already exists")

    # Create teacher then attempt to create a linked user account.
    # If user creation fails, remove the teacher to keep consistency.
    new_teacher = None
    try:
        new_teacher = teacher.create(db=db, obj_in=teacher_in)

        # Only create a login user when a valid email is provided
        if teacher_in.email and "@" in teacher_in.email:
            username = teacher_in.email.split("@")[0]
            # derive default password same as frontend: Teacher + last 4 of Aadhaar
            last_four = str(teacher_in.aadhar_number)[-4:]
            generated_password = f"Teacher{last_four}"

            # ensure username/email not already taken
            if user_crud.get_by_username(db, username=username) or user_crud.get_by_email(db, email=teacher_in.email):
                # rollback teacher and inform operator
                teacher.remove(db=db, id=new_teacher.id)
                raise HTTPException(status_code=400, detail="Username or email already exists for another user")

            user_in = UserCreate(
                username=username,
                email=teacher_in.email,
                password=generated_password,
                role=UserRole.TEACHER,
                is_active=True,
                is_superuser=False,
            )

            user_crud.create(db=db, obj_in=user_in)

        return new_teacher

    except HTTPException:
        raise
    except Exception as exc:
        # cleanup teacher if it was created
        if new_teacher:
            try:
                teacher.remove(db=db, id=new_teacher.id)
            except Exception:
                pass
        raise HTTPException(status_code=400, detail=str(exc))

@router.get("/", response_model=List[Teacher])
def read_teachers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    teachers = teacher.get_multi(db, skip=skip, limit=limit)
    return teachers

@router.get("/{teacher_id}", response_model=Teacher)
def read_teacher(teacher_id: int, db: Session = Depends(get_db)):
    db_teacher = teacher.get(db, id=teacher_id)
    if db_teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return db_teacher

@router.put("/{teacher_id}", response_model=Teacher)
def update_teacher(teacher_id: int, teacher_in: TeacherUpdate, db: Session = Depends(get_db)):
    db_teacher = teacher.get(db, id=teacher_id)
    if db_teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    updated_teacher = teacher.update(db=db, db_obj=db_teacher, obj_in=teacher_in)
    return updated_teacher

@router.delete("/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    db_teacher = teacher.get(db, id=teacher_id)
    if db_teacher is None:
        raise HTTPException(status_code=404, detail="Teacher not found")
    teacher.remove(db=db, id=teacher_id)
    return {"message": "Teacher deleted successfully"} 


@router.get("/me/students", response_model=List[StudentSchema])
def read_my_students(
    db: Session = Depends(get_db),
    current_user=Depends(deps.get_current_active_user),
) -> List[StudentSchema]:
    # Find teacher record linked to current user by email
    if not current_user or not getattr(current_user, "email", None):
        raise HTTPException(status_code=403, detail="Not authenticated as teacher")
    db_teacher = teacher.get_by_email(db, email=current_user.email)
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")

    assignments = db_teacher.class_assignments or []
    if not assignments:
        return []

    # Build SQL filters: (class_name == a['class'] AND division == a['division']) OR ...
    filters = []
    for a in assignments:
        cls = a.get("class") or a.get("class_name")
        div = a.get("division")
        if cls and div is not None:
            filters.append(and_(
                StudentModel.class_name == cls,
                StudentModel.division == div,
            ))

    if not filters:
        return []

    students_q = db.query(StudentModel).filter(or_(*filters))
    students = students_q.all()
    return students