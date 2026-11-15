import uuid
import secrets
import string
from datetime import date, timedelta, datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_host
from app.core.config import settings
from app.core.cancellation import calculate_refund, get_policy_snapshot
from app.core.time import as_utc
from app.models.accommodation import Accommodation, NightlyPrice
from app.models.booking import Booking, BookingUnit, BookingSnapshot, BookingHold, BookingStatus
from app.models.payment import Payment, PaymentType, PaymentStatus, Commission, HostBalance
from app.models.misc import Notification, AuditLog, DiscountCode, DiscountUsage
from app.services.payment_gateway import get_gateway
from app.schemas import BookingCreate, BookingCancel

router = APIRouter(prefix="/bookings", tags=["رزروها"])

def gen_booking_code() -> str:
    return "EY-" + "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))

def create_notification(db: Session, user_id: str, type_: str, title: str, body: str = None, data: dict = None):
    db.add(Notification(user_id=user_id, type=type_, title=title, body=body, data=data))

@router.post("")
def create_booking(payload: BookingCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    nights = (payload.check_out - payload.check_in).days
    if nights <= 0:
        raise HTTPException(status_code=400, detail="تاریخ خروج باید بعد از ورود باشد")

    if len(set(payload.accommodation_ids)) != len(payload.accommodation_ids):
        raise HTTPException(status_code=400, detail="یک واحد را نمی‌توان بیش از یک‌بار به رزرو افزود")

    # Lock accommodation rows in a stable order to serialize concurrent bookings
    # on PostgreSQL; the active-hold unique index provides a second DB-level guard.
    by_id = {}
    for acc_id in sorted(payload.accommodation_ids):
        acc = db.query(Accommodation).filter(Accommodation.id == acc_id).with_for_update().first()
        if not acc:
            raise HTTPException(status_code=404, detail=f"اقامتگاه {acc_id} یافت نشد")
        from app.models.accommodation import AccommodationStatus
        if acc.status != AccommodationStatus.published:
            raise HTTPException(status_code=400, detail=f"اقامتگاه «{acc.title}» منتشر نشده است")
        if nights < acc.min_nights or nights > acc.max_nights:
            raise HTTPException(status_code=400, detail=f"تعداد شب برای «{acc.title}» بین {acc.min_nights} تا {acc.max_nights} باید باشد")
        by_id[acc_id] = acc
    accommodations = [by_id[acc_id] for acc_id in payload.accommodation_ids]

    # تعیین وضعیت اولیه: درخواست رزرو برای میزبان تا ۲۴ ساعت hold می‌ماند؛
    # رزرو فوری تا پرداخت بیعانه و حداکثر ۲۰ دقیقه.
    all_instant = all(a.is_instant_booking for a in accommodations)
    now = datetime.now(timezone.utc)
    expires_at = now + (timedelta(minutes=settings.HOLD_TTL_MINUTES) if all_instant else timedelta(hours=24))
    booking_code = gen_booking_code()
    initial_status = BookingStatus.pending_payment if all_instant else BookingStatus.pending_host_approval

    booking = Booking(
        booking_code=booking_code,
        guest_id=current_user.id,
        status=initial_status,
        check_in_date=payload.check_in,
        check_out_date=payload.check_out,
        nights_count=nights,
        adults_count=payload.adults,
        children_count=payload.children,
        infants_count=payload.infants,
        discount_code=payload.discount_code,
        host_response_deadline=now + timedelta(hours=24) if not all_instant else None,
    )
    db.add(booking)
    db.flush()

    total_base = Decimal("0")
    total_cleaning = Decimal("0")
    total_extra = Decimal("0")
    snapshot_units = []

    for acc in accommodations:
        # Release expired calendar holds on these dates before attempting a new lock.
        db.query(BookingHold).filter(
            BookingHold.accommodation_id == acc.id,
            BookingHold.is_active == True,
            BookingHold.expires_at <= now,
            BookingHold.date >= payload.check_in,
            BookingHold.date < payload.check_out,
        ).update({BookingHold.is_active: False}, synchronize_session=False)

        # Confirmed bookings block by reservation dates; pending bookings block via live holds below.
        conflict = db.query(Booking).join(BookingUnit, BookingUnit.booking_id == Booking.id).filter(
            BookingUnit.accommodation_id == acc.id,
            Booking.status == BookingStatus.confirmed,
            Booking.check_in_date < payload.check_out,
            Booking.check_out_date > payload.check_in,
        ).first()
        if conflict:
            db.rollback()
            raise HTTPException(status_code=409, detail=f"اقامتگاه «{acc.title}» در این بازه در دسترس نیست (رزرو {conflict.booking_code})")

        # چک Hold فعال دیگران
        active_hold = db.query(BookingHold).filter(
            BookingHold.accommodation_id == acc.id,
            BookingHold.is_active == True,
            BookingHold.expires_at > datetime.now(timezone.utc),
            BookingHold.date >= payload.check_in,
            BookingHold.date < payload.check_out,
        ).first()
        if active_hold:
            db.rollback()
            raise HTTPException(status_code=409, detail=f"اقامتگاه «{acc.title}» در حال رزرو توسط کاربر دیگری است. لطفاً چند دقیقه دیگر تلاش کنید.")

        # محاسبه قیمت روزانه
        unit_base = Decimal("0")
        daily = []
        current = payload.check_in
        for _ in range(nights):
            np = db.query(NightlyPrice).filter(NightlyPrice.accommodation_id == acc.id, NightlyPrice.date == current).first()
            if np and not np.is_available:
                db.rollback()
                raise HTTPException(status_code=400, detail=f"تاریخ {current} برای «{acc.title}» مسدود است")
            price = np.price if np else (acc.base_price or Decimal("0"))
            daily.append({"date": str(current), "price": float(price)})
            unit_base += price
            current += timedelta(days=1)

        cleaning = acc.cleaning_fee or Decimal("0")
        total_guests = payload.adults + payload.children
        extra_guests = max(0, total_guests - (acc.standard_capacity or 2))
        extra = extra_guests * (acc.extra_guest_fee or Decimal("0")) * nights
        unit_total = unit_base + cleaning + extra

        total_base += unit_base
        total_cleaning += cleaning
        total_extra += extra

        # ساخت واحد رزرو
        db.add(BookingUnit(
            booking_id=booking.id, accommodation_id=acc.id,
            base_amount=unit_base, cleaning_fee_amount=cleaning,
            extra_guest_amount=extra, total_amount=unit_total,
        ))

        # ساخت Hold برای هر شب
        current = payload.check_in
        for _ in range(nights):
            db.add(BookingHold(
                booking_id=booking.id, accommodation_id=acc.id,
                date=current, expires_at=expires_at, is_active=True,
            ))
            current += timedelta(days=1)

        snapshot_units.append({
            "accommodation_id": acc.id,
            "title": acc.title,
            "slug": acc.slug,
            "description": acc.description,
            "address": acc.address,
            "city": acc.city.name if acc.city else None,
            "base_price": float(acc.base_price or 0),
            "cleaning_fee": float(acc.cleaning_fee or 0),
            "extra_guest_fee": float(acc.extra_guest_fee or 0),
            "prepayment_percent": acc.prepayment_percent,
            "cancellation_policy": acc.cancellation_policy.value if hasattr(acc.cancellation_policy, "value") else str(acc.cancellation_policy),
            "check_in_time": acc.check_in_time,
            "check_out_time": acc.check_out_time,
            "daily_prices": daily,
            "unit_base": float(unit_base),
            "unit_total": float(unit_total),
            "images": [i.file_url for i in acc.images],
            "amenities": [r.amenity.name for r in acc.amenities_rel if r.amenity],
            "host_id": acc.host_id,
        })

    # تخفیف
    discount_amount = Decimal("0")
    if payload.discount_code:
        dc = db.query(DiscountCode).filter(DiscountCode.code == payload.discount_code, DiscountCode.is_active == True).first()
        if dc:
            subtotal_before = total_base + total_cleaning + total_extra
            if dc.discount_type == "percent":
                discount_amount = subtotal_before * (dc.discount_value / Decimal("100"))
            else:
                discount_amount = min(dc.discount_value, subtotal_before)
            db.add(DiscountUsage(discount_code_id=dc.id, booking_id=booking.id, user_id=current_user.id, amount=discount_amount))
            dc.used_count = (dc.used_count or 0) + 1

    subtotal = total_base + total_cleaning + total_extra - discount_amount
    commission = subtotal * Decimal(str(settings.COMMISSION_PERCENT)) / Decimal("100")
    # درصد بیعانه از اولین واحد (در چندواحدی می‌توان میانگین گرفت؛ اینجا از اولین واحد)
    prepayment_percent = accommodations[0].prepayment_percent or settings.DEFAULT_PREPAYMENT_PERCENT
    prepayment = subtotal * Decimal(prepayment_percent) / Decimal("100")
    remaining = subtotal - prepayment

    booking.base_amount = total_base
    booking.cleaning_fee_amount = total_cleaning
    booking.extra_guest_amount = total_extra
    booking.discount_amount = discount_amount
    booking.commission_amount = commission
    booking.total_amount = subtotal
    booking.prepayment_amount = prepayment
    booking.remaining_amount = remaining
    booking.prepayment_percent = prepayment_percent
    booking.cancellation_policy = accommodations[0].cancellation_policy.value if hasattr(accommodations[0].cancellation_policy, "value") else str(accommodations[0].cancellation_policy)

    # اسنپ‌شات کامل
    db.add(BookingSnapshot(booking_id=booking.id, full_snapshot={
        "booking_code": booking_code,
        "check_in": str(payload.check_in),
        "check_out": str(payload.check_out),
        "nights": nights,
        "guests": {"adults": payload.adults, "children": payload.children, "infants": payload.infants},
        "units": snapshot_units,
        "financial": {
            "base_amount": float(total_base), "cleaning_fee": float(total_cleaning),
            "extra_guest_amount": float(total_extra), "discount_amount": float(discount_amount),
            "commission_amount": float(commission), "total_amount": float(subtotal),
            "prepayment_amount": float(prepayment), "remaining_amount": float(remaining),
            "prepayment_percent": prepayment_percent,
        },
        "cancellation_policy": booking.cancellation_policy,
        "cancellation_policy_details": get_policy_snapshot(booking.cancellation_policy),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }))

    # اعلان به میزبان‌ها
    host_ids = set(u["host_id"] for u in snapshot_units)
    for hid in host_ids:
        create_notification(db, hid, "booking_request", "درخواست رزرو جدید", f"رزرو {booking_code} نیاز به بررسی دارد", {"booking_id": booking.id})

    db.add(AuditLog(user_id=current_user.id, action="booking_created", entity_type="booking", entity_id=booking.id, details={"code": booking_code}))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="این تاریخ هم‌زمان توسط کاربر دیگری رزرو شد. لطفاً تاریخ دیگری انتخاب کنید.")
    db.refresh(booking)

    return {
        "id": booking.id, "booking_code": booking.booking_code, "status": booking.status.value,
        "total_amount": float(booking.total_amount), "prepayment_amount": float(booking.prepayment_amount),
        "remaining_amount": float(booking.remaining_amount), "prepayment_percent": booking.prepayment_percent,
        "check_in": str(booking.check_in_date), "check_out": str(booking.check_out_date),
        "nights": booking.nights_count, "is_instant": all_instant,
        "message": "رزرو با موفقیت ثبت شد. در انتظار پرداخت بیعانه." if all_instant else "درخواست رزرو ثبت شد. در انتظار تأیید میزبان (حداکثر ۲۴ ساعت).",
    }

@router.get("")
def list_my_bookings(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(Booking.guest_id == current_user.id).order_by(Booking.created_at.desc()).all()
    return {"items": [booking_to_dict(b) for b in bookings], "total": len(bookings)}

@router.get("/{booking_id}")
def get_booking(booking_id: str, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="رزرو یافت نشد")
    # دسترسی: مهمان، میزبان واحدها، یا ادمین
    if booking.guest_id != current_user.id and current_user.role.value not in ["admin", "super_admin"]:
        unit_acc_ids = [u.accommodation_id for u in booking.units]
        from app.models.accommodation import Accommodation
        is_host = db.query(Accommodation).filter(Accommodation.id.in_(unit_acc_ids), Accommodation.host_id == current_user.id).first()
        if not is_host:
            raise HTTPException(status_code=403, detail="دسترسی ندارید")
    return booking_to_dict(booking, include_snapshot=True)

def booking_to_dict(b: Booking, include_snapshot: bool = False):
    d = {
        "id": b.id, "booking_code": b.booking_code, "status": b.status.value,
        "check_in": str(b.check_in_date), "check_out": str(b.check_out_date), "nights": b.nights_count,
        "adults": b.adults_count, "children": b.children_count, "infants": b.infants_count,
        "base_amount": float(b.base_amount or 0), "cleaning_fee": float(b.cleaning_fee_amount or 0),
        "extra_guest_amount": float(b.extra_guest_amount or 0), "discount_amount": float(b.discount_amount or 0),
        "commission_amount": float(b.commission_amount or 0), "total_amount": float(b.total_amount or 0),
        "prepayment_amount": float(b.prepayment_amount or 0), "remaining_amount": float(b.remaining_amount or 0),
        "paid_amount": float(b.paid_amount or 0), "refunded_amount": float(b.refunded_amount or 0),
        "prepayment_percent": b.prepayment_percent, "cancellation_policy": b.cancellation_policy,
        "discount_code": b.discount_code,
        "confirmed_at": b.confirmed_at.isoformat() if b.confirmed_at else None,
        "cancelled_at": b.cancelled_at.isoformat() if b.cancelled_at else None,
        "cancelled_by": b.cancelled_by, "cancellation_reason": b.cancellation_reason,
        "created_at": b.created_at.isoformat() if b.created_at else None,
        "units": [{"id": u.id, "accommodation_id": u.accommodation_id, "total_amount": float(u.total_amount or 0)} for u in b.units],
    }
    if include_snapshot and b.snapshot:
        d["snapshot"] = b.snapshot.full_snapshot
    return d

@router.post("/{booking_id}/accept")
def accept_booking(booking_id: str, current_user = Depends(require_host), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="رزرو یافت نشد")
    if booking.status != BookingStatus.pending_host_approval:
        raise HTTPException(status_code=400, detail="این رزرو در وضعیت قابل قبول نیست")
    # بررسی مالکیت میزبان
    from app.models.accommodation import Accommodation
    unit_acc_ids = [u.accommodation_id for u in booking.units]
    is_host = db.query(Accommodation).filter(Accommodation.id.in_(unit_acc_ids), Accommodation.host_id == current_user.id).first()
    if not is_host and current_user.role.value not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="شما میزبان این رزرو نیستید")

    now = datetime.now(timezone.utc)
    if booking.host_response_deadline and as_utc(booking.host_response_deadline) <= now:
        booking.status = BookingStatus.expired
        for hold in booking.holds:
            hold.is_active = False
        db.commit()
        raise HTTPException(status_code=400, detail="مهلت پاسخ به این درخواست به پایان رسیده است")
    booking.status = BookingStatus.pending_payment
    booking.host_response_deadline = None
    for hold in booking.holds:
        if hold.is_active:
            hold.expires_at = now + timedelta(minutes=settings.HOLD_TTL_MINUTES)
    create_notification(db, booking.guest_id, "booking_accepted", "رزرو شما تأیید شد", f"رزرو {booking.booking_code} تأیید شد. لطفاً بیعانه را پرداخت کنید.", {"booking_id": booking.id})
    db.commit()
    return {"message": "رزرو پذیرفته شد و در انتظار پرداخت است", "status": booking.status.value}

@router.post("/{booking_id}/reject")
def reject_booking(booking_id: str, current_user = Depends(require_host), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="رزرو یافت نشد")
    if booking.status != BookingStatus.pending_host_approval:
        raise HTTPException(status_code=400, detail="این رزرو در وضعیت قابل رد نیست")
    booking.status = BookingStatus.cancelled
    booking.cancelled_at = datetime.now(timezone.utc)
    booking.cancelled_by = "host"
    booking.cancellation_reason = "رد توسط میزبان"
    # آزادسازی Holdها
    for hold in booking.holds:
        hold.is_active = False
    create_notification(db, booking.guest_id, "booking_rejected", "رزرو رد شد", f"رزرو {booking.booking_code} توسط میزبان رد شد.", {"booking_id": booking.id})
    db.commit()
    return {"message": "رزرو رد شد"}

@router.post("/{booking_id}/cancel")
def cancel_booking(booking_id: str, payload: BookingCancel, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).with_for_update().first()
    if not booking:
        raise HTTPException(status_code=404, detail="رزرو یافت نشد")
    if booking.guest_id != current_user.id and current_user.role.value not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="دسترسی ندارید")
    if booking.status in [BookingStatus.cancelled, BookingStatus.completed, BookingStatus.refunded]:
        raise HTTPException(status_code=400, detail="این رزرو قابل کنسلیشن نیست")

    from zoneinfo import ZoneInfo
    today = datetime.now(ZoneInfo("Asia/Tehran")).date()
    snapshot = booking.snapshot.full_snapshot if booking.snapshot and booking.snapshot.full_snapshot else {}
    calculated_refund, refund_percent, days_before = calculate_refund(
        booking.cancellation_policy,
        booking.check_in_date,
        today,
        int(booking.total_amount or 0),
        int(booking.cleaning_fee_amount or 0),
        paid_amount=int(booking.paid_amount or 0),
        policy_snapshot=snapshot.get("cancellation_policy_details"),
    )

    # Send actual refunds through the original payment gateway and persist a ledger row.
    refund = 0
    refund_left = calculated_refund
    refundable_payments = db.query(Payment).filter(
        Payment.booking_id == booking.id,
        Payment.status == PaymentStatus.success,
        Payment.payment_type != PaymentType.refund,
    ).order_by(Payment.paid_at.desc()).with_for_update().all()
    for original in refundable_payments:
        if refund_left <= 0:
            break
        portion = min(refund_left, int(original.amount or 0))
        if not portion or not original.gateway_ref_id:
            continue
        gateway = get_gateway(original.gateway.value)
        if gateway.refund(original.gateway_ref_id, portion):
            refund += portion
            refund_left -= portion
            db.add(Payment(
                booking_id=booking.id,
                user_id=current_user.id,
                amount=portion,
                payment_type=PaymentType.refund,
                status=PaymentStatus.refunded,
                gateway=original.gateway,
                gateway_ref_id=original.gateway_ref_id,
                idempotency_key=f"refund-{booking.id}-{original.id}",
                paid_at=datetime.now(timezone.utc),
            ))
            if portion >= int(original.amount or 0):
                original.status = PaymentStatus.refunded

    booking.status = BookingStatus.cancelled
    booking.cancelled_at = datetime.now(timezone.utc)
    booking.cancelled_by = "guest"
    booking.cancellation_reason = payload.reason
    booking.refunded_amount = Decimal(refund)
    if refund > 0:
        host_unit_totals = {}
        for unit in booking.units:
            if unit.accommodation:
                hid = unit.accommodation.host_id
                host_unit_totals[hid] = host_unit_totals.get(hid, Decimal("0")) + Decimal(str(unit.total_amount or 0))
        units_total = sum(host_unit_totals.values(), Decimal("0"))
        if units_total > 0:
            host_ids = list(host_unit_totals)
            allocated_refund = Decimal("0")
            allocated_commission = Decimal("0")
            rate = Decimal(str(settings.COMMISSION_PERCENT)) / Decimal("100")
            commission_rows = db.query(Commission).filter(Commission.booking_id == booking.id).with_for_update().all()
            commission_by_host = {row.host_id: row for row in commission_rows}
            for hid in host_ids:
                share = Decimal(refund) - allocated_refund if hid == host_ids[-1] else (Decimal(refund) * host_unit_totals[hid] / units_total).quantize(Decimal("1"))
                if hid != host_ids[-1]:
                    allocated_refund += share
                host_net = share * (Decimal("1") - rate)
                balance = db.query(HostBalance).filter(HostBalance.host_id == hid).with_for_update().first()
                if balance:
                    balance.pending_balance = Decimal(str(balance.pending_balance or 0)) - host_net
                    balance.total_earned = Decimal(str(balance.total_earned or 0)) - host_net
                commission_share = Decimal(refund) * rate - allocated_commission if hid == host_ids[-1] else (Decimal(refund) * rate * host_unit_totals[hid] / units_total).quantize(Decimal("1"))
                if hid != host_ids[-1]:
                    allocated_commission += commission_share
                commission_row = commission_by_host.get(hid)
                if commission_row:
                    commission_row.amount = max(Decimal("0"), Decimal(str(commission_row.amount or 0)) - commission_share)
                    if commission_row.amount == 0:
                        commission_row.status = "refunded"

    for hold in booking.holds:
        hold.is_active = False

    # اعلان به میزبان
    for unit in booking.units:
        from app.models.accommodation import Accommodation
        acc = db.query(Accommodation).filter(Accommodation.id == unit.accommodation_id).first()
        if acc:
            create_notification(db, acc.host_id, "booking_cancelled", "رزرو کنسل شد", f"رزرو {booking.booking_code} کنسل شد. استرداد: {refund:,} تومان", {"booking_id": booking.id})

    db.add(AuditLog(user_id=current_user.id, action="booking_cancelled", entity_type="booking", entity_id=booking.id, details={"refund": refund, "policy": booking.cancellation_policy}))
    db.commit()

    return {
        "message": "رزرو کنسل شد",
        "refund_amount": refund,
        "calculated_refund_amount": calculated_refund,
        "refund_pending": refund_left > 0,
        "refund_percent": refund_percent,
        "days_before_checkin": days_before,
        "policy": booking.cancellation_policy,
    }

@router.get("/host/bookings")
def host_bookings(current_user = Depends(require_host), db: Session = Depends(get_db)):
    from app.models.accommodation import Accommodation
    my_acc_ids = [a.id for a in db.query(Accommodation).filter(Accommodation.host_id == current_user.id).all()]
    bookings = db.query(Booking).join(BookingUnit, BookingUnit.booking_id == Booking.id).filter(
        BookingUnit.accommodation_id.in_(my_acc_ids)
    ).distinct().order_by(Booking.created_at.desc()).all()
    return {"items": [booking_to_dict(b) for b in bookings], "total": len(bookings)}
