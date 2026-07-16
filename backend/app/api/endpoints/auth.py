from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
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
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Generate and print a 6-digit OTP code for teacher/therapist (admin accounts blocked).
    """
    username = request_in.username.strip()
    user = crud.user.get_by_username(db, username=username)
    if not user:
        user = crud.user.get_by_email(db, email=username)
        
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found"
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
    
    # Try sending real email
    if settings.SMTP_USER and settings.SMTP_PASSWORD:
        if not user.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account has no registered email address."
            )
        success = send_otp_email(user.email, user.username, otp)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification email. Please try again."
            )
        msg = f"Verification code sent successfully to {user.email}."
    else:
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
    username = reset_in.username.strip()
    user = crud.user.get_by_username(db, username=username)
    if not user:
        user = crud.user.get_by_email(db, email=username)
        
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
