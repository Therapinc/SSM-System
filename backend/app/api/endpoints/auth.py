from datetime import timedelta
from typing import Any
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app import crud, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import UserRole
from app.utils import otp_store
from app.utils.email import send_otp_email

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
def login(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = crud.user.authenticate(
        db, username=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            {"sub": str(user.id)}, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "role": user.role
    } 

@router.post("/change-password")
def change_password(
    password_in: schemas.PasswordChange,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    """Change the password for the current authenticated user"""
    if not security.verify_password(password_in.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )

    crud.user.update(db, db_obj=current_user, obj_in={"password": password_in.new_password})
    return {"msg": "Password updated successfully"}


@router.get("/me", response_model=schemas.User)
def read_current_user(
    db: Session = Depends(deps.get_db),
    current_user: schemas.User = Depends(deps.get_current_active_user),
) -> Any:
    """Return the current authenticated user"""
    if current_user and str(current_user.role).lower() == "therapist":
        from app.models.therapist import Therapist
        from sqlalchemy import func
        therapist = db.query(Therapist).filter(func.lower(Therapist.email) == current_user.email.lower()).first()
        if therapist:
            current_user.specialization = therapist.specialization
    return current_user


@router.post("/forgot-password/request")
def forgot_password_request(
    request_in: schemas.ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Generate and print a 6-digit OTP code for teacher/therapist (admin accounts blocked).
    """
    input_str = request_in.username.strip()
    print(f"[FORGOT PASSWORD] Request received for input: '{input_str}'", flush=True)
    user = None
    otp_email = None  # email to send the OTP to

    from app.models.user import User as UserModel
    from app.models.therapist import Therapist
    from app.models.teacher import Teacher
    from sqlalchemy import func, or_

    clean_input = input_str.lower()

    # 1. Try by username or email directly on User table (case-insensitive)
    user = db.query(UserModel).filter(
        or_(
            func.lower(UserModel.username) == clean_input,
            func.lower(UserModel.email) == clean_input
        )
    ).first()

    # 2. Try by therapist profile email
    if not user:
        therapist = db.query(Therapist).filter(
            func.lower(Therapist.email) == clean_input
        ).first()
        if therapist:
            otp_email = therapist.email
            user = db.query(UserModel).filter(
                or_(
                    func.lower(UserModel.email) == therapist.email.lower(),
                    func.lower(UserModel.username) == therapist.email.lower(),
                    func.lower(UserModel.username) == therapist.name.lower()
                )
            ).first()

    # 3. Try by teacher profile email
    if not user:
        teacher = db.query(Teacher).filter(
            func.lower(Teacher.email) == clean_input
        ).first()
        if teacher:
            otp_email = teacher.email
            user = db.query(UserModel).filter(
                or_(
                    func.lower(UserModel.email) == teacher.email.lower(),
                    func.lower(UserModel.username) == teacher.email.lower(),
                    func.lower(UserModel.username) == teacher.name.lower()
                )
            ).first()

    # 4. Try matching teacher or therapist by profile name
    if not user:
        teacher = db.query(Teacher).filter(
            func.lower(Teacher.name) == clean_input
        ).first()
        if teacher:
            otp_email = teacher.email
            user = db.query(UserModel).filter(
                or_(
                    func.lower(UserModel.email) == teacher.email.lower(),
                    func.lower(UserModel.username) == teacher.email.lower(),
                    func.lower(UserModel.username) == teacher.name.lower()
                )
            ).first()

    if not user:
        therapist = db.query(Therapist).filter(
            func.lower(Therapist.name) == clean_input
        ).first()
        if therapist:
            otp_email = therapist.email
            user = db.query(UserModel).filter(
                or_(
                    func.lower(UserModel.email) == therapist.email.lower(),
                    func.lower(UserModel.username) == therapist.email.lower(),
                    func.lower(UserModel.username) == therapist.name.lower()
                )
            ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found. Please try your login username instead."
        )
        
    # Security Guard: Admin / HM accounts cannot use OTP reset
    is_admin = (
        user.is_superuser
        or str(user.role).lower() in {"admin", "hm", "headmaster", UserRole.ADMIN.value}
    )
    if is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin passwords cannot be reset via OTP."
        )
        
    # Generate OTP
    otp = otp_store.generate_otp(user.username)
    print(f"\n==================================================")
    print(f"[OTP SERVICE] Reset code for '{user.username}' is: {otp}")
    print(f"==================================================\n")
    
    # Try sending real email in background (non-blocking)
    has_email_service = bool(settings.BREVO_API_KEY) or bool(settings.SMTP_USER and settings.SMTP_PASSWORD)
    print(f"[EMAIL CONFIG] SMTP_USER set: {bool(settings.SMTP_USER)} | SMTP_PASSWORD set: {bool(settings.SMTP_PASSWORD)} | BREVO_API_KEY set: {bool(settings.BREVO_API_KEY)}")
    if has_email_service:
        # Use profile email if available, otherwise fall back to user account email
        delivery_email = otp_email or user.email
        if not delivery_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No email address found for this account. Please contact your administrator."
            )
        print(f"[EMAIL CONFIG] Queuing email to: {delivery_email}")
        # Queue email in background — API returns immediately without waiting
        background_tasks.add_task(send_otp_email, delivery_email, user.username, otp)
        msg = f"Verification code sent to {delivery_email}. Check your inbox and spam folder."
    else:
        print("[EMAIL CONFIG] Email service not configured — skipping email, OTP only in console.")
        msg = "Email service not configured. Verification code generated and printed to console."

    return {
        "status": "success",
        "message": msg,
        "username": user.username
    }


@router.post("/forgot-password/reset")
def forgot_password_reset(
    reset_in: schemas.ForgotPasswordReset,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Verify OTP code and reset the password.
    """
    input_str = reset_in.username.strip()
    clean_input = input_str.lower()
    
    from app.models.user import User as UserModel
    from app.models.therapist import Therapist
    from app.models.teacher import Teacher
    from sqlalchemy import func, or_
    
    user = db.query(UserModel).filter(
        or_(
            func.lower(UserModel.username) == clean_input,
            func.lower(UserModel.email) == clean_input
        )
    ).first()

    if not user:
        therapist = db.query(Therapist).filter(func.lower(Therapist.email) == clean_input).first()
        if therapist:
            user = db.query(UserModel).filter(
                or_(
                    func.lower(UserModel.email) == therapist.email.lower(),
                    func.lower(UserModel.username) == therapist.email.lower(),
                    func.lower(UserModel.username) == therapist.name.lower()
                )
            ).first()

    if not user:
        teacher = db.query(Teacher).filter(func.lower(Teacher.email) == clean_input).first()
        if teacher:
            user = db.query(UserModel).filter(
                or_(
                    func.lower(UserModel.email) == teacher.email.lower(),
                    func.lower(UserModel.username) == teacher.email.lower(),
                    func.lower(UserModel.username) == teacher.name.lower()
                )
            ).first()
        
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found"
        )
        
    # Verification
    is_valid = otp_store.verify_otp(user.username, reset_in.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code."
        )
        
    crud.user.update(db, db_obj=user, obj_in={"password": reset_in.new_password})
    return {"status": "success", "message": "Password reset successfully"}


@router.get("/forgot-password/debug-db")
def debug_db(db: Session = Depends(deps.get_db)) -> Any:
    from app.models.user import User as UserModel
    from app.models.therapist import Therapist
    from app.models.teacher import Teacher
    users = db.query(UserModel).all()
    therapists = db.query(Therapist).all()
    teachers = db.query(Teacher).all()
    
    user_list = [{"username": u.username, "email": u.email, "role": u.role} for u in users]
    therapist_list = [{"id": t.id, "name": t.name, "email": t.email} for t in therapists]
    teacher_list = [{"id": t.id, "name": t.name, "email": t.email} for t in teachers]
    
    return {
        "users": user_list,
        "therapists": therapist_list,
        "teachers": teacher_list
    }

