from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_host
from app.models.user import IdentityDocument, DocumentType, DocumentStatus, BankAccount
from app.models.payment import HostBalance, HostPayout
from app.schemas import DocumentUpload, BankAccountCreate

router = APIRouter(prefix="/host", tags=["میزبان"])

@router.post("/documents")
def upload_document(payload: DocumentUpload, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        dtype = DocumentType(payload.document_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="نوع مدرک نامعتبر است")
    doc = IdentityDocument(user_id=current_user.id, document_type=dtype, file_url=payload.file_url, status=DocumentStatus.pending)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"id": doc.id, "document_type": doc.document_type.value, "status": doc.status.value}

@router.get("/documents")
def list_documents(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    docs = db.query(IdentityDocument).filter(IdentityDocument.user_id == current_user.id).all()
    return [{"id": d.id, "document_type": d.document_type.value, "file_url": d.file_url, "status": d.status.value, "rejection_reason": d.rejection_reason} for d in docs]

@router.post("/bank-accounts")
def add_bank_account(payload: BankAccountCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.is_default:
        db.query(BankAccount).filter(BankAccount.user_id == current_user.id).update({"is_default": False})
    acc = BankAccount(
        user_id=current_user.id, bank_name=payload.bank_name,
        sheba_number=payload.sheba_number, card_number_masked=payload.card_number_masked,
        owner_name=payload.owner_name, is_default=payload.is_default,
    )
    db.add(acc)
    db.commit()
    db.refresh(acc)
    return {"id": acc.id, "bank_name": acc.bank_name, "sheba_number": acc.sheba_number, "is_verified": acc.is_verified}

@router.get("/bank-accounts")
def list_bank_accounts(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    accounts = db.query(BankAccount).filter(BankAccount.user_id == current_user.id).all()
    return [{"id": a.id, "bank_name": a.bank_name, "sheba_number": a.sheba_number, "owner_name": a.owner_name, "is_verified": a.is_verified, "is_default": a.is_default} for a in accounts]

@router.get("/finance")
def host_finance(current_user = Depends(require_host), db: Session = Depends(get_db)):
    balance = db.query(HostBalance).filter(HostBalance.host_id == current_user.id).first()
    payouts = db.query(HostPayout).filter(HostPayout.host_id == current_user.id).order_by(HostPayout.requested_at.desc()).all()
    return {
        "available_balance": float(balance.available_balance) if balance else 0,
        "pending_balance": float(balance.pending_balance) if balance else 0,
        "total_earned": float(balance.total_earned) if balance else 0,
        "payouts": [{"id": p.id, "amount": float(p.amount), "status": p.status, "requested_at": p.requested_at.isoformat() if p.requested_at else None} for p in payouts],
    }

@router.post("/payouts/request")
def request_payout(current_user = Depends(require_host), db: Session = Depends(get_db)):
    balance = db.query(HostBalance).filter(HostBalance.host_id == current_user.id).first()
    if not balance or float(balance.available_balance) <= 0:
        raise HTTPException(status_code=400, detail="موجودی قابل برداشت ندارید")
    default_acc = db.query(BankAccount).filter(BankAccount.user_id == current_user.id, BankAccount.is_default == True).first()
    if not default_acc:
        raise HTTPException(status_code=400, detail="ابتدا یک حساب بانکی پیش‌فرض ثبت کنید")
    payout = HostPayout(host_id=current_user.id, bank_account_id=default_acc.id, amount=balance.available_balance, status="pending", sheba_number=default_acc.sheba_number)
    balance.available_balance = 0
    db.add(payout)
    db.commit()
    return {"message": "درخواست برداشت ثبت شد", "payout_id": payout.id}

@router.get("/dashboard/stats")
def host_stats(current_user = Depends(require_host), db: Session = Depends(get_db)):
    from app.models.accommodation import Accommodation
    from app.models.booking import Booking, BookingUnit, BookingStatus
    my_acc_ids = [a.id for a in db.query(Accommodation).filter(Accommodation.host_id == current_user.id).all()]
    bookings = db.query(Booking).join(BookingUnit, BookingUnit.booking_id == Booking.id).filter(BookingUnit.accommodation_id.in_(my_acc_ids)).distinct().all() if my_acc_ids else []
    confirmed = [b for b in bookings if b.status == BookingStatus.confirmed]
    pending = [b for b in bookings if b.status == BookingStatus.pending_host_approval]
    total_earned = sum(float(b.total_amount or 0) * 0.9 for b in confirmed)
    return {
        "total_accommodations": len(my_acc_ids),
        "total_bookings": len(bookings),
        "confirmed_bookings": len(confirmed),
        "pending_approvals": len(pending),
        "total_earned_estimate": total_earned,
    }
