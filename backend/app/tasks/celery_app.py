from celery import Celery
from app.core.config import settings

celery_app = Celery("eghamatyar", broker=settings.REDIS_URL, backend=settings.REDIS_URL)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Tehran",
    enable_utc=True,
    beat_schedule={
        "expire-booking-holds-every-5-minutes": {
            "task": "app.tasks.celery_app.expire_holds",
            "schedule": 300.0,
        },
        "settle-completed-stays-daily": {
            "task": "app.tasks.celery_app.settle_completed_stays",
            "schedule": 86400.0,
        },
    },
)


@celery_app.task
def expire_holds():
    """Expire held dates and release bookings that missed host/payment deadlines."""
    from datetime import datetime, timezone
    from app.core.database import SessionLocal
    from app.models.booking import Booking, BookingHold, BookingStatus
    from app.core.time import as_utc

    now = datetime.now(timezone.utc)
    db = SessionLocal()
    try:
        expired_holds = db.query(BookingHold).filter(
            BookingHold.is_active.is_(True), BookingHold.expires_at <= now
        ).all()
        expired_booking_ids = {h.booking_id for h in expired_holds if h.booking_id}
        for hold in expired_holds:
            hold.is_active = False

        expired_count = 0
        pending_payment = db.query(Booking).filter(Booking.status == BookingStatus.pending_payment).all()
        for booking in pending_payment:
            if not any(h.is_active and as_utc(h.expires_at) > now for h in booking.holds):
                booking.status = BookingStatus.expired
                booking.cancelled_at = now
                booking.cancelled_by = "system"
                expired_count += 1

        host_deadline_expired = db.query(Booking).filter(
            Booking.status == BookingStatus.pending_host_approval,
            Booking.host_response_deadline <= now,
        ).all()
        for booking in host_deadline_expired:
            booking.status = BookingStatus.expired
            booking.cancelled_at = now
            booking.cancelled_by = "system"
            for hold in booking.holds:
                hold.is_active = False
            expired_count += 1

        db.commit()
        return f"Expired {len(expired_holds)} holds and {expired_count} bookings"
    finally:
        db.close()


@celery_app.task
def settle_completed_stays():
    """Release host earnings after fully paid stays have ended."""
    from datetime import datetime
    from decimal import Decimal
    from zoneinfo import ZoneInfo
    from app.core.database import SessionLocal
    from app.core.config import settings
    from app.models.booking import Booking, BookingUnit, BookingStatus
    from app.models.payment import HostBalance, Commission

    local_today = datetime.now(ZoneInfo("Asia/Tehran")).date()
    db = SessionLocal()
    completed_count = 0
    try:
        candidates = db.query(Booking).filter(
            Booking.status == BookingStatus.confirmed,
            Booking.check_out_date < local_today,
            Booking.remaining_amount <= 0,
        ).all()
        for booking in candidates:
            host_gross: dict[str, Decimal] = {}
            for unit in booking.units:
                host_id = unit.accommodation.host_id if unit.accommodation else None
                if host_id:
                    host_gross[host_id] = host_gross.get(host_id, Decimal("0")) + Decimal(str(unit.total_amount or 0))
            gross_total = sum(host_gross.values(), Decimal("0"))
            paid = Decimal(str(booking.paid_amount or 0))
            commission_rate = Decimal(str(settings.COMMISSION_PERCENT)) / Decimal("100")
            if gross_total > 0:
                host_ids = list(host_gross)
                allocated = Decimal("0")
                for host_id in host_ids:
                    gross_share = (paid * host_gross[host_id] / gross_total).quantize(Decimal("1"))
                    if host_id == host_ids[-1]:
                        gross_share = paid - allocated
                    else:
                        allocated += gross_share
                    net = gross_share * (Decimal("1") - commission_rate)
                    balance = db.query(HostBalance).filter(HostBalance.host_id == host_id).with_for_update().first()
                    if balance:
                        balance.pending_balance = max(Decimal("0"), Decimal(str(balance.pending_balance or 0)) - net)
                        balance.available_balance = Decimal(str(balance.available_balance or 0)) + net
            db.query(Commission).filter(Commission.booking_id == booking.id, Commission.status == "pending").update({"status": "settled"}, synchronize_session=False)
            booking.status = BookingStatus.completed
            completed_count += 1
        db.commit()
        return f"Settled {completed_count} completed stays"
    finally:
        db.close()


@celery_app.task
def send_sms_notification(mobile: str, message: str):
    from app.services.sms import sms_service
    return sms_service.send_notification(mobile, message)
