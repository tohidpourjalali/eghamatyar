from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import IdentityDocument, DocumentStatus, User
from app.models.accommodation import Accommodation, AccommodationStatus
from app.models.booking import Booking
from app.models.misc import AuditLog
from app.models.payment import HostPayout, HostBalance
from app.schemas import DocumentReview, PayoutReview

router = APIRouter(prefix="/admin", tags=["ادمین"])

@router.get("/dashboard/stats")
def admin_stats(current_user = Depends(require_admin), db: Session = Depends(get_db)):
    return {
        "total_users": db.query(User).count(),
        "total_accommodations": db.query(Accommodation).count(),
        "published_accommodations": db.query(Accommodation).filter(Accommodation.status == AccommodationStatus.published).count(),
        "pending_accommodations": db.query(Accommodation).filter(Accommodation.status == AccommodationStatus.pending_review).count(),
        "total_bookings": db.query(Booking).count(),
        "pending_documents": db.query(IdentityDocument).filter(IdentityDocument.status == DocumentStatus.pending).count(),
    }

@router.get("/documents/pending")
def pending_documents(current_user = Depends(require_admin), db: Session = Depends(get_db)):
    docs = db.query(IdentityDocument).filter(IdentityDocument.status == DocumentStatus.pending).all()
    return [{"id": d.id, "user_id": d.user_id, "document_type": d.document_type.value, "file_url": d.file_url, "created_at": d.created_at.isoformat() if d.created_at else None} for d in docs]

@router.post("/documents/{doc_id}/review")
def review_document(doc_id: str, payload: DocumentReview, current_user = Depends(require_admin), db: Session = Depends(get_db)):
    doc = db.query(IdentityDocument).filter(IdentityDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="مدرک یافت نشد")
    if payload.action == "approve":
        doc.status = DocumentStatus.approved
        doc.reviewed_by = current_user.id
        user = db.query(User).filter(User.id == doc.user_id).first()
        if user:
            all_docs = db.query(IdentityDocument).filter(IdentityDocument.user_id == doc.user_id).all()
            approved_types = {d.document_type.value for d in all_docs if d.status == DocumentStatus.approved or d.id == doc.id}
            if {"national_card", "birth_certificate", "bank_card"}.issubset(approved_types):
                user.is_host_approved = True
                from app.models.user import UserRole
                user.role = UserRole.host
    elif payload.action == "reject":
        doc.status = DocumentStatus.rejected
        doc.reviewed_by = current_user.id
        doc.rejection_reason = payload.rejection_reason
    else:
        raise HTTPException(status_code=400, detail="action باید approve یا reject باشد")
    db.add(AuditLog(user_id=current_user.id, action=f"document_{payload.action}", entity_type="identity_document", entity_id=doc_id))
    db.commit()
    return {"message": "بررسی انجام شد", "status": doc.status.value}

@router.get("/accommodations/pending")
def pending_accommodations(current_user = Depends(require_admin), db: Session = Depends(get_db)):
    items = db.query(Accommodation).filter(Accommodation.status == AccommodationStatus.pending_review).all()
    return [{"id": a.id, "title": a.title, "host_id": a.host_id, "city": a.city.name if a.city else None, "created_at": a.created_at.isoformat() if a.created_at else None} for a in items]

@router.post("/accommodations/{acc_id}/approve")
def approve_accommodation(acc_id: str, current_user = Depends(require_admin), db: Session = Depends(get_db)):
    acc = db.query(Accommodation).filter(Accommodation.id == acc_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="اقامتگاه یافت نشد")
    acc.status = AccommodationStatus.published
    from datetime import datetime, timezone
    acc.published_at = datetime.now(timezone.utc)
    db.add(AuditLog(user_id=current_user.id, action="accommodation_approved", entity_type="accommodation", entity_id=acc_id))
    db.commit()
    return {"message": "اقامتگاه منتشر شد"}

@router.post("/accommodations/{acc_id}/reject")
def reject_accommodation(acc_id: str, current_user = Depends(require_admin), db: Session = Depends(get_db)):
    acc = db.query(Accommodation).filter(Accommodation.id == acc_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="اقامتگاه یافت نشد")
    acc.status = AccommodationStatus.rejected
    db.add(AuditLog(user_id=current_user.id, action="accommodation_rejected", entity_type="accommodation", entity_id=acc_id))
    db.commit()
    return {"message": "اقامتگاه رد شد"}

@router.get("/bookings")
def all_bookings(current_user = Depends(require_admin), db: Session = Depends(get_db)):
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).limit(100).all()
    return [{"id": b.id, "booking_code": b.booking_code, "status": b.status.value, "total_amount": float(b.total_amount or 0), "guest_id": b.guest_id, "created_at": b.created_at.isoformat() if b.created_at else None} for b in bookings]

@router.get("/users")
def all_users(current_user = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).limit(100).all()
    return [{"id": u.id, "mobile": u.mobile, "role": u.role.value, "is_verified": u.is_verified, "is_host_approved": u.is_host_approved, "created_at": u.created_at.isoformat() if u.created_at else None} for u in users]

@router.get("/payouts/pending")
def pending_payouts(current_user = Depends(require_admin), db: Session = Depends(get_db)):
    payouts = db.query(HostPayout).filter(HostPayout.status == "pending").order_by(HostPayout.requested_at.asc()).all()
    return [{"id": p.id, "host_id": p.host_id, "amount": float(p.amount), "sheba_number": p.sheba_number, "requested_at": p.requested_at.isoformat() if p.requested_at else None} for p in payouts]

@router.post("/payouts/{payout_id}/review")
def review_payout(payout_id: str, payload: PayoutReview, current_user = Depends(require_admin), db: Session = Depends(get_db)):
    payout = db.query(HostPayout).filter(HostPayout.id == payout_id).with_for_update().first()
    if not payout:
        raise HTTPException(status_code=404, detail="درخواست برداشت یافت نشد")
    if payout.status != "pending":
        raise HTTPException(status_code=400, detail="این درخواست قبلاً بررسی شده است")
    if payload.action not in {"paid", "reject"}:
        raise HTTPException(status_code=400, detail="action باید paid یا reject باشد")

    from datetime import datetime, timezone
    payout.processed_at = datetime.now(timezone.utc)
    if payload.action == "paid":
        payout.status = "paid"
        payout.tracking_code = payload.tracking_code
    else:
        payout.status = "rejected"
        balance = db.query(HostBalance).filter(HostBalance.host_id == payout.host_id).with_for_update().first()
        if balance:
            balance.available_balance = (balance.available_balance or 0) + payout.amount
    db.add(AuditLog(
        user_id=current_user.id,
        action=f"payout_{payload.action}",
        entity_type="host_payout",
        entity_id=payout.id,
        details={"amount": float(payout.amount), "reason": payload.rejection_reason, "tracking_code": payload.tracking_code},
    ))
    db.commit()
    return {"message": "درخواست برداشت بررسی شد", "status": payout.status}
