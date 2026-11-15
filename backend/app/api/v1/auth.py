import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.models.user import User, UserProfile, OTPCode, UserRole
from app.schemas import OTPRequest, OTPVerify, RefreshRequest, ProfileUpdate
from app.services.sms import sms_service

router = APIRouter(prefix="/auth", tags=["احراز هویت"])

def hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()

@router.post("/otp/request")
def request_otp(payload: OTPRequest, db: Session = Depends(get_db)):
    # Rate limit ساده: حداکثر ۱۰ درخواست در ساعت برای هر موبایل
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    recent = db.query(OTPCode).filter(OTPCode.mobile == payload.mobile, OTPCode.created_at > one_hour_ago).count()
    if recent >= settings.OTP_RATE_LIMIT_PER_HOUR:
        raise HTTPException(status_code=429, detail="تعداد درخواست OTP بیش از حد مجاز است. لطفاً بعداً تلاش کنید.")

    code = "".join(str(secrets.randbelow(10)) for _ in range(settings.OTP_LENGTH))
    # در محیط dev کد ثابت برای تست راحت‌تر
    if settings.DEBUG:
        code = "12345"

    otp = OTPCode(
        mobile=payload.mobile,
        code_hash=hash_code(code),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    )
    db.add(otp)
    db.commit()

    sms_service.send_otp(payload.mobile, code)

    resp = {"message": "کد OTP ارسال شد", "expires_in_minutes": settings.OTP_EXPIRE_MINUTES}
    if settings.DEBUG:
        resp["dev_code"] = code  # فقط در dev
    return resp

@router.post("/otp/verify")
def verify_otp(payload: OTPVerify, db: Session = Depends(get_db)):
    otp = db.query(OTPCode).filter(
        OTPCode.mobile == payload.mobile,
        OTPCode.is_used == False,
        OTPCode.expires_at > datetime.now(timezone.utc),
    ).order_by(OTPCode.created_at.desc()).first()

    if not otp:
        raise HTTPException(status_code=400, detail="کد OTP منقضی شده یا یافت نشد. لطفاً دوباره درخواست دهید.")
    if otp.attempts >= settings.OTP_MAX_ATTEMPTS:
        otp.is_used = True
        db.commit()
        raise HTTPException(status_code=429, detail="تعداد تلاش‌های وارد کردن کد بیش از حد مجاز است. کد جدید درخواست دهید.")
    if otp.code_hash != hash_code(payload.code):
        otp.attempts += 1
        if otp.attempts >= settings.OTP_MAX_ATTEMPTS:
            otp.is_used = True
        db.commit()
        raise HTTPException(status_code=400, detail="کد OTP اشتباه است")

    otp.is_used = True

    user = db.query(User).filter(User.mobile == payload.mobile).first()
    if not user:
        user = User(mobile=payload.mobile, role=UserRole.guest, is_verified=True)
        db.add(user)
        db.flush()
        profile = UserProfile(user_id=user.id)
        db.add(profile)
    else:
        user.is_verified = True

    db.commit()
    db.refresh(user)

    access = create_access_token({"sub": user.id, "mobile": user.mobile, "role": user.role.value})
    refresh = create_refresh_token({"sub": user.id})

    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "user": {
            "id": user.id, "mobile": user.mobile, "email": user.email,
            "role": user.role.value, "is_verified": user.is_verified,
            "is_host_approved": user.is_host_approved,
            "first_name": user.profile.first_name if user.profile else None,
            "last_name": user.profile.last_name if user.profile else None,
            "avatar_url": user.profile.avatar_url if user.profile else None,
        },
    }

@router.post("/refresh")
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    decoded = decode_token(payload.refresh_token)
    if not decoded or decoded.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="توکن رفرش نامعتبر است")
    user = db.query(User).filter(User.id == decoded.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="کاربر یافت نشد")
    access = create_access_token({"sub": user.id, "mobile": user.mobile, "role": user.role.value})
    return {"access_token": access, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id, "mobile": current_user.mobile, "email": current_user.email,
        "role": current_user.role.value, "is_verified": current_user.is_verified,
        "is_host_approved": current_user.is_host_approved,
        "first_name": current_user.profile.first_name if current_user.profile else None,
        "last_name": current_user.profile.last_name if current_user.profile else None,
        "national_code": current_user.profile.national_code if current_user.profile else None,
        "avatar_url": current_user.profile.avatar_url if current_user.profile else None,
        "bio": current_user.profile.bio if current_user.profile else None,
    }

@router.put("/me/profile")
def update_profile(payload: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    return {"message": "پروفایل به‌روزرسانی شد"}
