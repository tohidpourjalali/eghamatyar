# اقامت‌یار | EghamatYar — سامانه رزرو آنلاین اقامتگاه (ایران)

پلتفرم دوطرفه رزرو اقامتگاه (شبیه Airbnb) برای بازار ایران — فارسی، RTL، موبایل‌فرست، تومان (IRT).

**نسخه:** ۲.۱ | **وضعیت:** MVP کامل (Mock/Dev برای سرویس‌های خارجی)

## معماری

```
eghamatyar/
├── backend/          # FastAPI + SQLAlchemy 2.0 + PostgreSQL + Redis + Celery
│   ├── app/
│   │   ├── core/     # config, database, security, cancellation, dependencies
│   │   ├── models/   # user, accommodation, booking, payment, misc
│   │   ├── api/v1/   # auth, accommodations, bookings, payments, host, admin
│   │   ├── services/ # sms (Kavenegar Mock), payment (Zarinpal/IDPay Mock), storage, map
│   │   └── tasks/    # Celery: expire_holds, sms
│   ├── alembic/      # مایگریشن‌ها
│   ├── seed.py       # سید کامل
│   └── requirements.txt
├── frontend/         # Next.js 16 App Router + TypeScript + Tailwind + React Query
│   ├── app/          # صفحات: /, /search, /accommodations/[id], /login, /checkout, /profile, /host, /admin
│   ├── components/   # Header, Footer, AccommodationCard, SearchBar
│   └── lib/          # api (axios + JWT refresh), persian (تومان/جلالی), types
└── docker-compose.yml
```

## راه‌اندازی سریع (بدون Docker — حالت Dev با SQLite)

```bash
# بک‌اند
cd backend
pip install -r requirements.txt
alembic upgrade head
python seed.py  # داده آزمایشی فقط برای توسعه
uvicorn app.main:app --reload --port 8000

# فرانت‌اند (ترمینال دیگر)
cd frontend
npm install
npm run dev
```

- بک‌اند: http://localhost:8000/docs
- فرانت‌اند: http://localhost:3000

## راه‌اندازی با Docker (پروداکشن)

```bash
cp backend/.env.example backend/.env
# مقدار SECRET_KEY، رمز دیتابیس و کلیدهای سرویس واقعی را پیش از استقرار تغییر دهید.
docker compose up --build
```

در Compose، بک‌اند پیش از بالا آمدن، `alembic upgrade head` را اجرا می‌کند؛ Worker و زمان‌بند Celery پس از health-check بک‌اند بالا می‌آیند. برای دیتابیس تازه، داده دمو را جداگانه با `docker compose exec backend python seed.py` وارد کنید.

## استقرار فرانت‌اند روی Netlify

این monorepo دو بخش دارد: Netlify فقط Next.js در `frontend/` را میزبانی می‌کند؛ FastAPI، PostgreSQL، Redis، Worker/Scheduler و ذخیره‌سازی فایل باید روی یک سرویس بک‌اند/دیتابیس جداگانه اجرا شوند. تنظیمات پایهٔ Netlify در `netlify.toml` آمده است.

1. کل مخزن را در GitHub قرار دهید و در Netlify از **Add new project → Import an existing project** همان repository را انتخاب کنید.
2. Netlify باید Next.js را تشخیص دهد؛ تنظیمات این پروژه: base directory برابر `frontend` و build command برابر `npm run build` است. publish directory را برای Next.js دستی به خروجی استاتیک تغییر ندهید؛ آداپتر Netlify پشتیبانی Next.js را تنظیم می‌کند.
3. ابتدا بک‌اند را جداگانه Deploy کنید و URL عمومی آن را بسازید. در Netlify environment variables، `API_INTERNAL_URL` را برابر origin بک‌اند بگذارید، مانند `https://api.example.com` (بدون `/api` و بدون slash انتهایی). مقدار `NEXT_PUBLIC_API_URL` را تنظیم نکنید؛ درخواست‌های فرانت از rewrite نسبی `/api/v1` عبور می‌کنند.
4. در بک‌اند `FRONTEND_URL` و `CORS_ORIGINS` را برای دامنهٔ Netlify/دامنهٔ سفارشی تنظیم کنید؛ `DEBUG=False` و `SECRET_KEY` تصادفی و امن بگذارید. URL و کلیدهای دیتابیس، Redis، S3، پیامک و پرداخت را فقط در تنظیمات امن سرویس بک‌اند ثبت کنید.
5. بعد از افزودن environment variables یک deploy تازه اجرا کنید؛ سپس مسیر `/api/v1`، ورود OTP، پروفایل و رزرو را آزمایش کنید.

**مهم:** فایل‌های واقعی `.env`، رمزها و کلیدها را commit نکنید. `backend/.env.example` فقط نمونه است. در Production از `seed.py` استفاده نکنید؛ این فایل کاربران و اقامتگاه‌های آزمایشی ایجاد می‌کند. ابتدا `alembic upgrade head` را برای migration اجرا کنید.

## کاربرهای تست (سید)

| نقش | موبایل | کد OTP (dev) |
|---|---|---|
| مهمان | 09120000001 | 12345 |
| میزبان | 09120000002 | 12345 |
| ادمین | 09120000003 | 12345 |
| سوپر ادمین | 09120000004 | 12345 |

کد تخفیف: `WELCOME10` (۱۰٪)

## جریان‌های کلیدی پیاده‌سازی‌شده

- **احراز هویت OTP** با Kavenegar (Mock در dev) + JWT Access/Refresh + Rate Limit؛ بازگشت پس از ورود به مسیر درخواستی
- **دسترسی مسیرها:** جستجو، خانه، راهنما و اقامتگاه عمومی‌اند؛ پروفایل، سفر/پرداخت نیازمند ورود؛ پنل میزبان و مدیریت علاوه بر ورود، نقش متناسب می‌خواهند. پس از OTP، مهمان به پنل کاربری، میزبان تأییدشده به پنل میزبان و مدیر به پنل مدیریت می‌رود. مسیر درخواستی فقط وقتی نقش کاربر اجازه دهد حفظ می‌شود؛ مهمانی که از ثبت‌نام میزبان وارد شده باشد به‌جای حلقهٔ ورود/ثبت‌نام، به پنل کاربری هدایت می‌شود. API نیز دسترسی را سمت سرور کنترل می‌کند.
- **KYC میزبان:** ۳ مدرک (کارت ملی، شناسنامه، کارت بانکی) + حساب شبا → تأیید ادمین → نقش host
- **اقامتگاه + مجموعه (Complex) + واحدهای مستقل** با تقویم و قیمت روزانه (`nightly_prices`)
- **جستجو** با فیلتر شهر/قیمت/نوع/رزرو فوری/ظرفیت + مرتب‌سازی؛ انتخاب تاریخ با تقویم شمسی و ارسال تاریخ استاندارد میلادی به API
- **رزرو دو مدلی:** رزرو فوری (instant) و درخواست رزرو (پیش‌فرض، تأیید میزبان تا ۲۴ ساعت)
- **قفل تقویم (Booking Holds):** TTL ۲۰ دقیقه، جلوگیری از رزرو همزمان (Double Booking)
- **اسنپ‌شات کامل** (`booking_snapshots` JSONB): قیمت‌ها، قوانین، سیاست کنسلیشن در زمان رزرو فریز می‌شود
- **پرداخت چنددرگاهی:** زرین‌پال + آیدی‌پی + Mock، Idempotency Key، بیعانه ۳۰٪ + باقیمانده (قانون ۳ روز)
- **کمیسیون ۱۰٪** شفاف در تفکیک قیمت
- **کنسلیشن با سیاست فریز‌شده** (`app/core/cancellation.py` — جدول استاندارد Airbnb، قابل پیکربندی)
- **پنل‌های مهمان / میزبان / ادمین** + اعلان درون‌برنامه‌ای + لاگ حسابرسی

## اتصال به سرویس‌های واقعی

در `backend/app/services/` آداپترها آماده‌اند؛ کافی است کلیدها را در `.env` بگذارید:
- `KAVENEGAR_API_KEY` → پیامک واقعی
- `ZARINPAL_MERCHANT_ID` / `IDPAY_API_KEY` → درگاه واقعی
- `S3_ENDPOINT` → MinIO / لیارا / ابرآروان
- `MAP_PROVIDER` → neshan | mapir | google

## خارج از MVP (طبق SRS)

Property Manager، کیف پول، چت، علاقه‌مندی‌های پیشرفته، ارجاع/وفاداری، اپ موبایل، iCal، هوش مصنوعی، رزرو گروهی/سازمانی.
