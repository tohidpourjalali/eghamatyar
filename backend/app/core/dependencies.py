from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole

security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="احراز هویت لازم است")
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="توکن نامعتبر است")
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="کاربر یافت نشد")
    return user

def get_current_user_optional(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    return user

def require_role(*roles: UserRole):
    def checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles and current_user.role != UserRole.super_admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="دسترسی ندارید")
        return current_user
    return checker

def require_host(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.host, UserRole.admin, UserRole.super_admin]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="شما میزبان نیستید")
    return current_user

def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.admin, UserRole.super_admin]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="دسترسی ادمین لازم است")
    return current_user
