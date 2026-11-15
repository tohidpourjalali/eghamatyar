from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

# ---------- Auth ----------
class OTPRequest(BaseModel):
    mobile: str = Field(..., pattern=r"^09\d{9}$", description="شماره موبایل ایران")

class OTPVerify(BaseModel):
    mobile: str
    code: str = Field(..., min_length=4, max_length=6)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserOut"

class RefreshRequest(BaseModel):
    refresh_token: str

class UserOut(BaseModel):
    id: str
    mobile: str
    email: Optional[str] = None
    role: str
    is_verified: bool
    is_host_approved: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    national_code: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

# ---------- Accommodation ----------
class AccommodationCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=300)
    description: Optional[str] = None
    city_id: Optional[str] = None
    accommodation_type_id: Optional[str] = None
    complex_id: Optional[str] = None
    is_instant_booking: bool = False
    cancellation_policy: str = "moderate"
    standard_capacity: int = 2
    max_capacity: int = 4
    bedrooms_count: int = 1
    beds_count: int = 2
    bathrooms_count: int = 1
    base_price: Decimal = 0
    cleaning_fee: Decimal = 0
    extra_guest_fee: Decimal = 0
    prepayment_percent: int = Field(default=30, ge=0, le=100)
    min_nights: int = 1
    max_nights: int = 30
    check_in_time: str = "14:00"
    check_out_time: str = "12:00"
    allow_pets: bool = False
    allow_parties: bool = False
    smoking_allowed: bool = False
    address: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    amenity_ids: List[str] = []
    image_urls: List[str] = []

class AccommodationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    city_id: Optional[str] = None
    accommodation_type_id: Optional[str] = None
    is_instant_booking: Optional[bool] = None
    cancellation_policy: Optional[str] = None
    standard_capacity: Optional[int] = None
    max_capacity: Optional[int] = None
    bedrooms_count: Optional[int] = None
    beds_count: Optional[int] = None
    bathrooms_count: Optional[int] = None
    base_price: Optional[Decimal] = None
    cleaning_fee: Optional[Decimal] = None
    extra_guest_fee: Optional[Decimal] = None
    prepayment_percent: Optional[int] = None
    min_nights: Optional[int] = None
    max_nights: Optional[int] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    allow_pets: Optional[bool] = None
    allow_parties: Optional[bool] = None
    smoking_allowed: Optional[bool] = None
    address: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    amenity_ids: Optional[List[str]] = None

class CalendarBulkUpdate(BaseModel):
    updates: List[dict]  # [{date, price, is_available, min_nights, note}]

class PriceQuoteRequest(BaseModel):
    check_in: date
    check_out: date
    adults: int = 2
    children: int = 0
    infants: int = 0
    discount_code: Optional[str] = None

# ---------- Booking ----------
class BookingCreate(BaseModel):
    accommodation_ids: List[str] = Field(..., min_length=1, description="لیست واحدها برای رزرو چندواحدی")
    check_in: date
    check_out: date
    adults: int = 2
    children: int = 0
    infants: int = 0
    discount_code: Optional[str] = None

class BookingCancel(BaseModel):
    reason: Optional[str] = None

# ---------- Payment ----------
class PaymentInitiate(BaseModel):
    booking_id: str
    payment_type: str = "prepayment"  # prepayment | remaining | full
    gateway: str = "mock"  # zarinpal | idpay | mock
    idempotency_key: Optional[str] = None

class PaymentVerify(BaseModel):
    authority: str
    gateway: str = "mock"
    booking_id: Optional[str] = None

# ---------- Host KYC ----------
class DocumentUpload(BaseModel):
    document_type: str  # national_card | birth_certificate | bank_card
    file_url: str

class BankAccountCreate(BaseModel):
    bank_name: str
    sheba_number: str = Field(..., pattern=r"^IR\d{24}$")
    card_number_masked: Optional[str] = None
    owner_name: str
    is_default: bool = False

class DocumentReview(BaseModel):
    action: str  # approve | reject
    rejection_reason: Optional[str] = None

class PayoutReview(BaseModel):
    action: str  # paid | reject
    tracking_code: Optional[str] = None
    rejection_reason: Optional[str] = None

# ---------- Common ----------
class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)

class SearchParams(BaseModel):
    city_id: Optional[str] = None
    city_slug: Optional[str] = None
    check_in: Optional[date] = None
    check_out: Optional[date] = None
    adults: int = 2
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    accommodation_type_id: Optional[str] = None
    amenity_ids: Optional[str] = None  # comma separated
    is_instant_booking: Optional[bool] = None
    min_bedrooms: Optional[int] = None
    page: int = 1
    size: int = 20
    sort: str = "recommended"  # recommended | price_asc | price_desc | rating
