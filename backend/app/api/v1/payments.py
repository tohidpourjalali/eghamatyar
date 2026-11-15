import uuid
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.booking import Booking, BookingStatus
from app.models.payment import Payment, PaymentType, PaymentStatus, Gateway, Commission, HostBalance
from app.models.misc import Notification, AuditLog
from app.schemas import PaymentInitiate, PaymentVerify
from app.services.payment_gateway import get_gateway
from app.core.config import settings
from app.core.time import as_utc

router = APIRouter(prefix="/payments", tags=["پرداخت‌ها"])


def _host_weights(booking: Booking):
    """Return {host_id: weight} by each host's share of the booking's unit totals."""
    totals: dict[str, Decimal] = {}
    for unit in booking.units:
        host_id = unit.accommodation.host_id if unit.accommodation else None
        if host_id:
            totals[host_id] = totals.get(host_id, Decimal("0")) + Decimal(str(unit.total_amount or 0))
    total = sum(totals.values(), Decimal("0"))
    if total <= 0:
        return {}
    return {host_id: value / total for host_id, value in totals.items()}


def _record_booking_commissions(db: Session, booking: Booking) -> None:
    """Create one commission allocation per host, exactly once per booking."""
    if db.query(Commission.id).filter(Commission.booking_id == booking.id).first():
        return
    weights = _host_weights(booking)
    if not weights:
        return
    commission_total = Decimal(str(booking.commission_amount or 0))
    host_ids = list(weights)
    allocated = Decimal("0")
    for host_id in host_ids[:-1]:
        share = (commission_total * weights[host_id]).quantize(Decimal("1"))
        allocated += share
        db.add(Commission(booking_id=booking.id, host_id=host_id, amount=share, percent=Decimal(str(settings.COMMISSION_PERCENT)), status="pending"))
    last_host = host_ids[-1]
    db.add(Commission(booking_id=booking.id, host_id=last_host, amount=commission_total - allocated, percent=Decimal(str(settings.COMMISSION_PERCENT)), status="pending"))


def _credit_hosts_for_payment(db: Session, booking: Booking, amount: Decimal) -> None:
    """Credit each host's collected share (net of platform commission) as pending."""
    from app.models.payment import HostBalance
    weights = _host_weights(booking)
    if not weights:
        return
    commission_rate = Decimal(str(settings.COMMISSION_PERCENT)) / Decimal("100")
    host_ids = list(weights)
    allocated = Decimal("0")
    for host_id in host_ids[:-1]:
        gross = (amount * weights[host_id]).quantize(Decimal("1"))
        allocated += gross
        net = gross * (Decimal("1") - commission_rate)
        balance = db.query(HostBalance).filter(HostBalance.host_id == host_id).with_for_update().first()
        if not balance:
            balance = HostBalance(host_id=host_id, pending_balance=0, available_balance=0, total_earned=0)
            db.add(balance)
        balance.pending_balance = Decimal(str(balance.pending_balance or 0)) + net
        balance.total_earned = Decimal(str(balance.total_earned or 0)) + net
    last_host = host_ids[-1]
    gross = amount - allocated
    net = gross * (Decimal("1") - commission_rate)
    balance = db.query(HostBalance).filter(HostBalance.host_id == last_host).with_for_update().first()
    if not balance:
        balance = HostBalance(host_id=last_host, pending_balance=0, available_balance=0, total_earned=0)
        db.add(balance)
    balance.pending_balance = Decimal(str(balance.pending_balance or 0)) + net
    balance.total_earned = Decimal(str(balance.total_earned or 0)) + net

@router.post("/initiate")
def initiate_payment(payload: PaymentInitiate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="رزرو یافت نشد")
    if booking.guest_id != current_user.id:
        raise HTTPException(status_code=403, detail="دسترسی ندارید")

    # Idempotency: اگر همین کلید قبلاً استفاده شده، همان پرداخت را برگردان
    if payload.idempotency_key:
        existing = db.query(Payment).filter(Payment.idempotency_key == payload.idempotency_key).first()
        if existing:
            return {"payment_id": existing.id, "authority": existing.authority, "payment_url": f"/payment/result?authority={existing.authority}", "status": existing.status.value}

    if payload.payment_type == "prepayment":
        amount = booking.prepayment_amount or Decimal("0")
        if booking.status != BookingStatus.pending_payment or (booking.paid_amount or 0) > 0:
            raise HTTPException(status_code=400, detail="رزرو در وضعیت قابل پرداخت بیعانه نیست")
        if not booking.holds or not all(h.is_active and as_utc(h.expires_at) > datetime.now(timezone.utc) for h in booking.holds):
            booking.status = BookingStatus.expired
            for hold in booking.holds:
                hold.is_active = False
            db.commit()
            raise HTTPException(status_code=400, detail="مهلت رزرو موقت به پایان رسیده است؛ لطفاً دوباره رزرو کنید")
    elif payload.payment_type == "remaining":
        amount = booking.remaining_amount or Decimal("0")
        if booking.status != BookingStatus.confirmed:
            raise HTTPException(status_code=400, detail="فقط رزرو تأییدشده می‌تواند باقیمانده را پرداخت کند")
    elif payload.payment_type == "full":
        if booking.status != BookingStatus.pending_payment or (booking.paid_amount or 0) > 0:
            raise HTTPException(status_code=400, detail="رزرو در وضعیت پرداخت کامل نیست")
        amount = booking.total_amount or Decimal("0")
    else:
        raise HTTPException(status_code=400, detail="نوع پرداخت نامعتبر است")

    if amount <= 0:
        raise HTTPException(status_code=400, detail="مبلغ قابل پرداخت صفر است")

    gateway = get_gateway(payload.gateway)
    result = gateway.request_payment(int(amount), callback_url="/payment/result", description=f"پرداخت رزرو {booking.booking_code}")

    payment = Payment(
        booking_id=booking.id, user_id=current_user.id,
        amount=amount, payment_type=PaymentType(payload.payment_type),
        status=PaymentStatus.pending, gateway=Gateway(payload.gateway) if payload.gateway in ["zarinpal", "idpay", "mock"] else Gateway.mock,
        authority=result["authority"], idempotency_key=payload.idempotency_key or str(uuid.uuid4()),
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "payment_id": payment.id,
        "authority": result["authority"],
        "payment_url": result["payment_url"],
        "amount": float(amount),
        "gateway": payload.gateway,
    }

@router.post("/verify")
def verify_payment(payload: PaymentVerify, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.authority == payload.authority).first()
    if not payment:
        raise HTTPException(status_code=404, detail="پرداخت یافت نشد")
    if payment.status == PaymentStatus.success:
        return {"message": "پرداخت قبلاً تأیید شده است", "status": "success"}

    gateway = get_gateway(payload.gateway)
    result = gateway.verify_payment(payload.authority, int(payment.amount))
    if not result["success"]:
        payment.status = PaymentStatus.failed
        db.commit()
        raise HTTPException(status_code=400, detail="پرداخت ناموفق بود")

    payment.status = PaymentStatus.success
    payment.gateway_ref_id = result["ref_id"]
    payment.tracking_code = result["tracking_code"]
    payment.paid_at = datetime.now(timezone.utc)

    booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
    booking.paid_amount = (booking.paid_amount or Decimal("0")) + payment.amount

    if payment.payment_type == PaymentType.prepayment:
        booking.status = BookingStatus.confirmed
        booking.confirmed_at = datetime.now(timezone.utc)
        # تبدیل Hold به رزرو واقعی: غیرفعال کردن Holdها (تقویم قفل می‌ماند چون رزرو confirmed است)
        for hold in booking.holds:
            hold.is_active = False
        # کمیسیون و موجودی میزبان
        _record_booking_commissions(db, booking)
        # اعلان‌ها
        db.add(Notification(user_id=booking.guest_id, type="payment_success", title="پرداخت موفق", body=f"بیعانه رزرو {booking.booking_code} پرداخت شد. واچر صادر شد.", data={"booking_id": booking.id}))
        for unit in booking.units:
            acc = unit.accommodation
            if acc:
                db.add(Notification(user_id=acc.host_id, type="payment_received", title="پرداخت دریافت شد", body=f"بیعانه رزرو {booking.booking_code} دریافت شد.", data={"booking_id": booking.id}))

    elif payment.payment_type == PaymentType.remaining:
        booking.remaining_amount = Decimal("0")
        db.add(Notification(user_id=booking.guest_id, type="payment_success", title="تسویه کامل", body=f"باقیمانده رزرو {booking.booking_code} پرداخت شد.", data={"booking_id": booking.id}))

    elif payment.payment_type == PaymentType.full:
        booking.status = BookingStatus.confirmed
        booking.confirmed_at = datetime.now(timezone.utc)
        booking.remaining_amount = Decimal("0")
        for hold in booking.holds:
            hold.is_active = False
        _record_booking_commissions(db, booking)
        db.add(Notification(user_id=booking.guest_id, type="payment_success", title="پرداخت کامل موفق", body=f"رزرو {booking.booking_code} قطعی شد.", data={"booking_id": booking.id}))

    _credit_hosts_for_payment(db, booking, Decimal(str(payment.amount)))
    db.add(AuditLog(user_id=booking.guest_id, action="payment_success", entity_type="payment", entity_id=payment.id, details={"amount": float(payment.amount), "ref": result["ref_id"]}))
    db.commit()

    return {
        "message": "پرداخت با موفقیت انجام شد",
        "status": "success",
        "booking_id": booking.id,
        "booking_code": booking.booking_code,
        "booking_status": booking.status.value,
        "tracking_code": result["tracking_code"],
        "voucher_code": booking.booking_code,
    }

@router.get("/{payment_id}")
def get_payment(payment_id: str, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="پرداخت یافت نشد")
    if payment.user_id != current_user.id and current_user.role.value not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="دسترسی ندارید")
    return {
        "id": payment.id, "booking_id": payment.booking_id, "amount": float(payment.amount),
        "payment_type": payment.payment_type.value, "status": payment.status.value,
        "gateway": payment.gateway.value, "tracking_code": payment.tracking_code,
        "paid_at": payment.paid_at.isoformat() if payment.paid_at else None,
    }
