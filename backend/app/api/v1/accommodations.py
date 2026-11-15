import uuid
import secrets
import string
from datetime import date, timedelta, datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_host, get_current_user_optional
from app.models.accommodation import Accommodation, AccommodationImage, AccommodationAmenity, NightlyPrice, AccommodationStatus, City
from app.models.booking import BookingHold
from app.models.misc import Favorite, Review
from app.models.user import UserProfile
from app.schemas import AccommodationCreate, AccommodationUpdate, CalendarBulkUpdate, PriceQuoteRequest, SearchParams
from app.models.misc import DiscountCode

router = APIRouter(tags=["اقامتگاه‌ها"])

def gen_slug(title: str) -> str:
    suffix = "".join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(6))
    return f"{title[:30]}-{suffix}"

def accommodation_to_dict(acc: Accommodation, db: Session = None):
    cover = next((i for i in acc.images if i.is_cover), acc.images[0] if acc.images else None)
    amenities = [rel.amenity.name for rel in acc.amenities_rel if rel.amenity]
    return {
        "id": acc.id,
        "title": acc.title,
        "slug": acc.slug,
        "description": acc.description,
        "status": acc.status.value if hasattr(acc.status, "value") else acc.status,
        "is_instant_booking": acc.is_instant_booking,
        "cancellation_policy": acc.cancellation_policy.value if hasattr(acc.cancellation_policy, "value") else acc.cancellation_policy,
        "standard_capacity": acc.standard_capacity,
        "max_capacity": acc.max_capacity,
        "bedrooms_count": acc.bedrooms_count,
        "beds_count": acc.beds_count,
        "bathrooms_count": acc.bathrooms_count,
        "base_price": float(acc.base_price or 0),
        "cleaning_fee": float(acc.cleaning_fee or 0),
        "extra_guest_fee": float(acc.extra_guest_fee or 0),
        "prepayment_percent": acc.prepayment_percent,
        "min_nights": acc.min_nights,
        "max_nights": acc.max_nights,
        "check_in_time": acc.check_in_time,
        "check_out_time": acc.check_out_time,
        "allow_pets": acc.allow_pets,
        "allow_parties": acc.allow_parties,
        "smoking_allowed": acc.smoking_allowed,
        "address": acc.address,
        "latitude": float(acc.latitude) if acc.latitude else None,
        "longitude": float(acc.longitude) if acc.longitude else None,
        "rating_avg": float(acc.rating_avg or 0),
        "reviews_count": acc.reviews_count or 0,
        "city": {"id": acc.city.id, "name": acc.city.name, "slug": acc.city.slug} if acc.city else None,
        "type": {"id": acc.accommodation_type.id, "name": acc.accommodation_type.name} if acc.accommodation_type else None,
        "cover_image": cover.file_url if cover else None,
        "images": [{"id": i.id, "url": i.file_url, "is_cover": i.is_cover} for i in acc.images],
        "amenities": amenities,
        "host_id": acc.host_id,
    }

# ---------- جستجو ----------
@router.get("/accommodations")
def search_accommodations(
    city_slug: str = Query(None),
    city_id: str = Query(None),
    check_in: date = Query(None),
    check_out: date = Query(None),
    adults: int = Query(2),
    min_price: float = Query(None),
    max_price: float = Query(None),
    accommodation_type_id: str = Query(None),
    is_instant_booking: bool = Query(None),
    min_bedrooms: int = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort: str = Query("recommended"),
    db: Session = Depends(get_db),
):
    query = db.query(Accommodation).filter(Accommodation.status == AccommodationStatus.published)

    if city_slug:
        city = db.query(City).filter(City.slug == city_slug).first()
        if city:
            query = query.filter(Accommodation.city_id == city.id)
    if city_id:
        query = query.filter(Accommodation.city_id == city_id)
    if accommodation_type_id:
        query = query.filter(Accommodation.accommodation_type_id == accommodation_type_id)
    if is_instant_booking is not None:
        query = query.filter(Accommodation.is_instant_booking == is_instant_booking)
    if min_bedrooms:
        query = query.filter(Accommodation.bedrooms_count >= min_bedrooms)
    if min_price:
        query = query.filter(Accommodation.base_price >= min_price)
    if max_price:
        query = query.filter(Accommodation.base_price <= max_price)
    if adults:
        query = query.filter(Accommodation.max_capacity >= adults)

    # مرتب‌سازی
    if sort == "price_asc":
        query = query.order_by(Accommodation.base_price.asc())
    elif sort == "price_desc":
        query = query.order_by(Accommodation.base_price.desc())
    elif sort == "rating":
        query = query.order_by(Accommodation.rating_avg.desc())
    else:
        query = query.order_by(Accommodation.created_at.desc())

    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()

    # اگر تاریخ داده شده، در دسترس بودن را چک کن (ساده‌سازی: فقط برگردان)
    result = []
    for acc in items:
        d = accommodation_to_dict(acc)
        if check_in and check_out:
            # محاسبه قیمت تقریبی
            nights = (check_out - check_in).days
            d["nights"] = nights
            d["estimated_total"] = float(acc.base_price or 0) * nights + float(acc.cleaning_fee or 0)
        result.append(d)

    return {"items": result, "total": total, "page": page, "size": size}

@router.get("/accommodations/reviews/featured")
def featured_reviews(db: Session = Depends(get_db)):
    rows = db.query(Review, Accommodation, UserProfile).join(
        Accommodation, Accommodation.id == Review.accommodation_id
    ).outerjoin(UserProfile, UserProfile.user_id == Review.guest_id).filter(
        Review.is_published == True
    ).order_by(Review.created_at.desc()).limit(6).all()
    return [{
        "id": review.id,
        "rating": review.rating,
        "comment": review.comment,
        "guest_name": (profile.first_name if profile and profile.first_name else "مسافر اقامت‌یار"),
        "accommodation_title": accommodation.title,
        "created_at": review.created_at.isoformat() if review.created_at else None,
    } for review, accommodation, profile in rows]


@router.get("/accommodations/{accommodation_id}/reviews")
def accommodation_reviews(accommodation_id: str, db: Session = Depends(get_db)):
    acc = db.query(Accommodation).filter(Accommodation.id == accommodation_id).first()
    if not acc:
        acc = db.query(Accommodation).filter(Accommodation.slug == accommodation_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="اقامتگاه یافت نشد")
    rows = db.query(Review, UserProfile).outerjoin(
        UserProfile, UserProfile.user_id == Review.guest_id
    ).filter(Review.accommodation_id == acc.id, Review.is_published == True).order_by(Review.created_at.desc()).limit(50).all()
    return [{
        "id": review.id,
        "rating": review.rating,
        "comment": review.comment,
        "host_reply": review.host_reply,
        "guest_name": (profile.first_name if profile and profile.first_name else "مسافر اقامت‌یار"),
        "created_at": review.created_at.isoformat() if review.created_at else None,
    } for review, profile in rows]


@router.get("/accommodations/{accommodation_id}")
def get_accommodation(accommodation_id: str, db: Session = Depends(get_db)):
    acc = db.query(Accommodation).filter(Accommodation.id == accommodation_id).first()
    if not acc:
        # تلاش با slug
        acc = db.query(Accommodation).filter(Accommodation.slug == accommodation_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="اقامتگاه یافت نشد")
    return accommodation_to_dict(acc)

@router.post("/accommodations/{accommodation_id}/price-quote")
def price_quote(accommodation_id: str, payload: PriceQuoteRequest, db: Session = Depends(get_db)):
    acc = db.query(Accommodation).filter(Accommodation.id == accommodation_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="اقامتگاه یافت نشد")

    nights = (payload.check_out - payload.check_in).days
    if nights <= 0:
        raise HTTPException(status_code=400, detail="تاریخ خروج باید بعد از ورود باشد")
    if nights < acc.min_nights:
        raise HTTPException(status_code=400, detail=f"حداقل {acc.min_nights} شب لازم است")
    if nights > acc.max_nights:
        raise HTTPException(status_code=400, detail=f"حداکثر {acc.max_nights} شب مجاز است")

    # قیمت‌های روزانه
    daily_prices = []
    total_base = Decimal("0")
    current = payload.check_in
    for _ in range(nights):
        np = db.query(NightlyPrice).filter(
            NightlyPrice.accommodation_id == acc.id,
            NightlyPrice.date == current,
        ).first()
        if np:
            if not np.is_available:
                raise HTTPException(status_code=400, detail=f"تاریخ {current} در دسترس نیست")
            price = np.price
        else:
            price = acc.base_price or Decimal("0")
        daily_prices.append({"date": str(current), "price": float(price)})
        total_base += price
        current += timedelta(days=1)

    # چک تداخل رزرو تأییدشده
    from app.models.booking import Booking, BookingStatus
    conflict = db.query(Booking).join(
        __import__("app.models.booking", fromlist=["BookingUnit"]).BookingUnit,
        __import__("app.models.booking", fromlist=["BookingUnit"]).BookingUnit.booking_id == Booking.id,
    ).filter(
        __import__("app.models.booking", fromlist=["BookingUnit"]).BookingUnit.accommodation_id == acc.id,
        Booking.status.in_([BookingStatus.confirmed, BookingStatus.pending_payment, BookingStatus.pending_host_approval]),
        Booking.check_in_date < payload.check_out,
        Booking.check_out_date > payload.check_in,
    ).first()
    if conflict:
        raise HTTPException(status_code=409, detail="این بازه زمانی قبلاً رزرو شده است")

    cleaning = acc.cleaning_fee or Decimal("0")
    total_guests = payload.adults + payload.children
    extra_guests = max(0, total_guests - (acc.standard_capacity or 2))
    extra_amount = extra_guests * (acc.extra_guest_fee or Decimal("0")) * nights

    discount_amount = Decimal("0")
    if payload.discount_code:
        dc = db.query(DiscountCode).filter(DiscountCode.code == payload.discount_code, DiscountCode.is_active == True).first()
        if dc:
            if dc.discount_type == "percent":
                discount_amount = (total_base + cleaning + extra_amount) * (dc.discount_value / Decimal("100"))
            else:
                discount_amount = dc.discount_value

    subtotal = total_base + cleaning + extra_amount - discount_amount
    commission = subtotal * Decimal("10") / Decimal("100")
    prepayment = subtotal * Decimal(acc.prepayment_percent or 30) / Decimal("100")
    remaining = subtotal - prepayment

    return {
        "nights": nights,
        "daily_prices": daily_prices,
        "base_amount": float(total_base),
        "cleaning_fee": float(cleaning),
        "extra_guest_amount": float(extra_amount),
        "discount_amount": float(discount_amount),
        "subtotal": float(subtotal),
        "commission_amount": float(commission),
        "total_amount": float(subtotal),
        "prepayment_amount": float(prepayment),
        "remaining_amount": float(remaining),
        "prepayment_percent": acc.prepayment_percent,
        "cancellation_policy": acc.cancellation_policy.value if hasattr(acc.cancellation_policy, "value") else acc.cancellation_policy,
        "is_instant_booking": acc.is_instant_booking,
    }

# ---------- میزبان: CRUD ----------
@router.post("/host/accommodations")
def create_accommodation(payload: AccommodationCreate, current_user = Depends(require_host), db: Session = Depends(get_db)):
    acc = Accommodation(
        host_id=current_user.id,
        title=payload.title,
        slug=gen_slug(payload.title),
        description=payload.description,
        city_id=payload.city_id,
        accommodation_type_id=payload.accommodation_type_id,
        complex_id=payload.complex_id,
        is_instant_booking=payload.is_instant_booking,
        cancellation_policy=payload.cancellation_policy,
        standard_capacity=payload.standard_capacity,
        max_capacity=payload.max_capacity,
        bedrooms_count=payload.bedrooms_count,
        beds_count=payload.beds_count,
        bathrooms_count=payload.bathrooms_count,
        base_price=payload.base_price,
        cleaning_fee=payload.cleaning_fee,
        extra_guest_fee=payload.extra_guest_fee,
        prepayment_percent=payload.prepayment_percent,
        min_nights=payload.min_nights,
        max_nights=payload.max_nights,
        check_in_time=payload.check_in_time,
        check_out_time=payload.check_out_time,
        allow_pets=payload.allow_pets,
        allow_parties=payload.allow_parties,
        smoking_allowed=payload.smoking_allowed,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        status=AccommodationStatus.draft,
    )
    db.add(acc)
    db.flush()

    for amenity_id in payload.amenity_ids:
        db.add(AccommodationAmenity(accommodation_id=acc.id, amenity_id=amenity_id))

    for idx, url in enumerate(payload.image_urls):
        db.add(AccommodationImage(accommodation_id=acc.id, file_url=url, sort_order=idx, is_cover=(idx == 0)))

    db.commit()
    db.refresh(acc)
    return accommodation_to_dict(acc)

@router.get("/host/accommodations")
def list_host_accommodations(current_user = Depends(require_host), db: Session = Depends(get_db)):
    items = db.query(Accommodation).filter(Accommodation.host_id == current_user.id).order_by(Accommodation.created_at.desc()).all()
    return {"items": [accommodation_to_dict(a) for a in items], "total": len(items)}

@router.get("/host/accommodations/{accommodation_id}")
def get_host_accommodation(accommodation_id: str, current_user = Depends(require_host), db: Session = Depends(get_db)):
    acc = db.query(Accommodation).filter(Accommodation.id == accommodation_id, Accommodation.host_id == current_user.id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="اقامتگاه یافت نشد")
    return accommodation_to_dict(acc)

@router.put("/host/accommodations/{accommodation_id}")
def update_accommodation(accommodation_id: str, payload: AccommodationUpdate, current_user = Depends(require_host), db: Session = Depends(get_db)):
    acc = db.query(Accommodation).filter(Accommodation.id == accommodation_id, Accommodation.host_id == current_user.id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="اقامتگاه یافت نشد")
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "amenity_ids":
            db.query(AccommodationAmenity).filter(AccommodationAmenity.accommodation_id == acc.id).delete()
            for aid in value:
                db.add(AccommodationAmenity(accommodation_id=acc.id, amenity_id=aid))
        else:
            setattr(acc, field, value)
    db.commit()
    db.refresh(acc)
    return accommodation_to_dict(acc)

@router.post("/host/accommodations/{accommodation_id}/submit-review")
def submit_for_review(accommodation_id: str, current_user = Depends(require_host), db: Session = Depends(get_db)):
    acc = db.query(Accommodation).filter(Accommodation.id == accommodation_id, Accommodation.host_id == current_user.id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="اقامتگاه یافت نشد")
    if acc.status not in [AccommodationStatus.draft, AccommodationStatus.rejected]:
        raise HTTPException(status_code=400, detail="فقط اقامتگاه پیش‌نویس یا ردشده قابل ارسال است")
    acc.status = AccommodationStatus.pending_review
    db.commit()
    return {"message": "اقامتگاه برای بررسی ارسال شد"}

@router.get("/host/accommodations/{accommodation_id}/calendar")
def get_calendar(accommodation_id: str, start: date = Query(None), end: date = Query(None), current_user = Depends(require_host), db: Session = Depends(get_db)):
    acc = db.query(Accommodation).filter(Accommodation.id == accommodation_id, Accommodation.host_id == current_user.id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="اقامتگاه یافت نشد")
    if not start:
        start = date.today()
    if not end:
        end = start + timedelta(days=90)
    prices = db.query(NightlyPrice).filter(
        NightlyPrice.accommodation_id == acc.id,
        NightlyPrice.date >= start,
        NightlyPrice.date <= end,
    ).order_by(NightlyPrice.date).all()
    return {
        "accommodation_id": acc.id,
        "base_price": float(acc.base_price or 0),
        "items": [{"date": str(p.date), "price": float(p.price), "is_available": p.is_available, "min_nights": p.min_nights, "note": p.note} for p in prices],
    }

@router.put("/host/accommodations/{accommodation_id}/calendar")
def update_calendar(accommodation_id: str, payload: CalendarBulkUpdate, current_user = Depends(require_host), db: Session = Depends(get_db)):
    acc = db.query(Accommodation).filter(Accommodation.id == accommodation_id, Accommodation.host_id == current_user.id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="اقامتگاه یافت نشد")
    for item in payload.updates:
        d = date.fromisoformat(item["date"])
        existing = db.query(NightlyPrice).filter(NightlyPrice.accommodation_id == acc.id, NightlyPrice.date == d).first()
        if existing:
            existing.price = item.get("price", existing.price)
            existing.is_available = item.get("is_available", existing.is_available)
            existing.min_nights = item.get("min_nights", existing.min_nights)
            existing.note = item.get("note", existing.note)
        else:
            db.add(NightlyPrice(
                accommodation_id=acc.id, date=d,
                price=item.get("price", acc.base_price or 0),
                is_available=item.get("is_available", True),
                min_nights=item.get("min_nights"),
                note=item.get("note"),
            ))
    db.commit()
    return {"message": f"{len(payload.updates)} روز به‌روزرسانی شد"}

# ---------- علاقه‌مندی‌ها ----------
@router.post("/accommodations/{accommodation_id}/favorite")
def toggle_favorite(accommodation_id: str, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(Favorite).filter(Favorite.user_id == current_user.id, Favorite.accommodation_id == accommodation_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"is_favorite": False}
    db.add(Favorite(user_id=current_user.id, accommodation_id=accommodation_id))
    db.commit()
    return {"is_favorite": True}

@router.get("/cities")
def list_cities(db: Session = Depends(get_db)):
    cities = db.query(City).filter(City.is_active == True).all()
    return [{"id": c.id, "name": c.name, "slug": c.slug, "province": c.province, "image_url": c.image_url} for c in cities]
