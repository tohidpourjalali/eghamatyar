"""
سید داده کامل — شهرها، امکانات، اقامتگاه نمونه، کاربر تست
اجرا: python seed.py
"""
import uuid
from datetime import date, timedelta
from decimal import Decimal
from app.core.database import SessionLocal, engine, Base
from app.models.user import User, UserProfile, UserRole
from app.models.accommodation import City, AccommodationType, Amenity, Accommodation, AccommodationImage, AccommodationAmenity, NightlyPrice, AccommodationStatus, CancellationPolicy
from app.models.misc import DiscountCode

Base.metadata.create_all(bind=engine)
db = SessionLocal()

def get_or_create(model, defaults=None, **kwargs):
    obj = db.query(model).filter_by(**kwargs).first()
    if obj:
        return obj
    obj = model(**kwargs)
    db.add(obj)
    db.flush()
    return obj

# شهرها
cities_data = [
    ("تهران", "tehran", "تهران"), ("مشهد", "mashhad", "خراسان رضوی"), ("اصفهان", "isfahan", "اصفهان"),
    ("شیراز", "shiraz", "فارس"), ("تبریز", "tabriz", "آذربایجان شرقی"), ("رشت", "rasht", "گیلان"),
    ("کیش", "kish", "هرمزگان"), ("قشم", "qeshm", "هرمزگان"), ("یزد", "yazd", "یزد"),
    ("کرمان", "kerman", "کرمان"), ("بابلسر", "babolsar", "مازندران"), ("چالوس", "chalus", "مازندران"),
    ("کاشان", "kashan", "اصفهان"),
]
cities = {}
for name, slug, province in cities_data:
    c = get_or_create(City, name=name, slug=slug, province=province, image_url=f"https://picsum.photos/seed/{slug}/800/600")
    cities[slug] = c

# انواع اقامتگاه
types_data = [("ویلا", "villa"), ("آپارتمان", "apartment"), ("سوئیت", "suite"), ("اقامتگاه بوم‌گردی", "eco-lodge"), ("هتل‌آپارتمان", "hotel-apartment")]
types = {}
for name, slug in types_data:
    t = get_or_create(AccommodationType, name=name, slug=slug)
    types[slug] = t

# امکانات
amenities_data = ["وای‌فای", "پارکینگ", "استخر", "جکوزی", "آشپزخانه", "تلویزیون", "کولر", "بخاری", "بالکن", "حیاط", "باربیکیو", "ماشین لباسشویی"]
amenities = []
for name in amenities_data:
    a = get_or_create(Amenity, name=name)
    amenities.append(a)

# کاربر تست
def create_user(mobile, role, first, last):
    user = db.query(User).filter(User.mobile == mobile).first()
    if user:
        return user
    user = User(mobile=mobile, role=role, is_verified=True, is_host_approved=(role in [UserRole.host, UserRole.admin, UserRole.super_admin]))
    db.add(user)
    db.flush()
    db.add(UserProfile(user_id=user.id, first_name=first, last_name=last, national_code="0012345678"))
    return user

guest = create_user("09120000001", UserRole.guest, "علی", "رضایی")
host = create_user("09120000002", UserRole.host, "سارا", "محمدی")
admin = create_user("09120000003", UserRole.admin, "مدیر", "سیستم")
super_admin = create_user("09120000004", UserRole.super_admin, "سوپر", "ادمین")

# اقامتگاه نمونه
samples = [
    {"title": "ویلای ساحلی لوکس در کیش با استخر خصوصی", "city": "kish", "type": "villa", "price": 3500000, "cleaning": 300000, "extra": 200000, "instant": True, "policy": "moderate", "bedrooms": 3, "beds": 5, "baths": 2, "max": 8},
    {"title": "آپارتمان دنج در قلب تهران — نزدیک مترو", "city": "tehran", "type": "apartment", "price": 1200000, "cleaning": 100000, "extra": 80000, "instant": False, "policy": "flexible", "bedrooms": 2, "beds": 3, "baths": 1, "max": 5},
    {"title": "سوئیت رمانتیک در اصفهان با چشم‌انداز زاینده‌رود", "city": "isfahan", "type": "suite", "price": 1800000, "cleaning": 150000, "extra": 100000, "instant": True, "policy": "strict", "bedrooms": 1, "beds": 2, "baths": 1, "max": 3},
    {"title": "اقامتگاه بوم‌گردی در رشت — باغ و طبیعت", "city": "rasht", "type": "eco-lodge", "price": 900000, "cleaning": 50000, "extra": 50000, "instant": False, "policy": "moderate", "bedrooms": 2, "beds": 4, "baths": 1, "max": 6},
    {"title": "ویلای جنگلی در چالوس — نزدیک دریا", "city": "chalus", "type": "villa", "price": 2500000, "cleaning": 200000, "extra": 150000, "instant": False, "policy": "moderate", "bedrooms": 3, "beds": 6, "baths": 2, "max": 10},
    {"title": "آپارتمان مدرن در مشهد — نزدیک حرم", "city": "mashhad", "type": "apartment", "price": 1500000, "cleaning": 120000, "extra": 90000, "instant": True, "policy": "flexible", "bedrooms": 2, "beds": 4, "baths": 1, "max": 6},
    {"title": "خانهٔ حیاط‌دار سنتی در یزد", "city": "yazd", "type": "eco-lodge", "price": 1100000, "cleaning": 80000, "extra": 70000, "instant": False, "policy": "flexible", "bedrooms": 2, "beds": 3, "baths": 1, "max": 5},
    {"title": "آپارتمان خانوادگی حوالی باغ ارم شیراز", "city": "shiraz", "type": "apartment", "price": 1700000, "cleaning": 120000, "extra": 100000, "instant": True, "policy": "moderate", "bedrooms": 2, "beds": 4, "baths": 1, "max": 6},
    {"title": "اقامتگاه بوم‌گردی در جزیرهٔ قشم", "city": "qeshm", "type": "eco-lodge", "price": 1300000, "cleaning": 90000, "extra": 80000, "instant": False, "policy": "moderate", "bedrooms": 2, "beds": 4, "baths": 1, "max": 6},
    {"title": "کلبهٔ چوبی نزدیک ساحل بابلسر", "city": "babolsar", "type": "villa", "price": 2100000, "cleaning": 180000, "extra": 120000, "instant": True, "policy": "strict", "bedrooms": 2, "beds": 4, "baths": 1, "max": 7},
    {"title": "خانهٔ تاریخی با حیاط مرکزی در کاشان", "city": "kashan", "type": "eco-lodge", "price": 1600000, "cleaning": 100000, "extra": 90000, "instant": False, "policy": "flexible", "bedrooms": 2, "beds": 3, "baths": 1, "max": 5},
    {"title": "آپارتمان دنج نزدیک ائل‌گلی تبریز", "city": "tabriz", "type": "apartment", "price": 1400000, "cleaning": 100000, "extra": 80000, "instant": True, "policy": "moderate", "bedrooms": 2, "beds": 3, "baths": 1, "max": 5},
]

for sample_index, s in enumerate(samples, start=1):
    existing = db.query(Accommodation).filter(Accommodation.host_id == host.id, Accommodation.title == s["title"]).first()
    if existing:
        continue  # seed is safe to rerun without duplicating demo inventory
    slug = f"demo-{s['city']}-{sample_index:02d}"
    acc = Accommodation(
        host_id=host.id, city_id=cities[s["city"]].id, accommodation_type_id=types[s["type"]].id,
        title=s["title"], slug=slug, description=f"{s['title']} — اقامتگاهی زیبا و مجهز برای تجربه‌ای به‌یادماندنی در {cities[s['city']].name}.",
        status=AccommodationStatus.published, is_instant_booking=s["instant"],
        cancellation_policy=CancellationPolicy(s["policy"]),
        standard_capacity=2, max_capacity=s["max"], bedrooms_count=s["bedrooms"], beds_count=s["beds"], bathrooms_count=s["baths"],
        base_price=Decimal(s["price"]), cleaning_fee=Decimal(s["cleaning"]), extra_guest_fee=Decimal(s["extra"]),
        prepayment_percent=30, min_nights=1, max_nights=30,
        address=f"شهر {cities[s['city']].name}", latitude=Decimal("35.6892"), longitude=Decimal("51.3890"),
        rating_avg=Decimal("4.8"), reviews_count=12,
    )
    db.add(acc)
    db.flush()
    for i in range(4):
        db.add(AccommodationImage(accommodation_id=acc.id, file_url=f"https://picsum.photos/seed/{slug}{i}/1200/800", sort_order=i, is_cover=(i == 0)))
    for am in amenities[:6]:
        db.add(AccommodationAmenity(accommodation_id=acc.id, amenity_id=am.id))
    # قیمت ۹۰ روز آینده
    for d in range(90):
        dt = date.today() + timedelta(days=d)
        price = Decimal(s["price"]) * (Decimal("1.2") if dt.weekday() >= 4 else Decimal("1.0"))
        db.add(NightlyPrice(accommodation_id=acc.id, date=dt, price=price, is_available=True))

# کد تخفیف
if not db.query(DiscountCode).filter(DiscountCode.code == "WELCOME10").first():
    db.add(DiscountCode(code="WELCOME10", discount_type="percent", discount_value=Decimal("10"), max_uses=1000, is_active=True))

db.commit()
print("✅ سید داده با موفقیت ساخته شد")
print(f"   مهمان تست: 09120000001 | میزبان: 09120000002 | ادمین: 09120000003")
print(f"   کد OTP در حالت dev: 12345")
print(f"   کد تخفیف: WELCOME10")
db.close()
