import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Numeric, Date, Enum as SQLEnum, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

def gen_uuid():
    return str(uuid.uuid4())

class AccommodationStatus(str, enum.Enum):
    draft = "draft"
    pending_review = "pending_review"
    published = "published"
    rejected = "rejected"
    suspended = "suspended"
    archived = "archived"

class CancellationPolicy(str, enum.Enum):
    flexible = "flexible"
    moderate = "moderate"
    strict = "strict"
    non_refundable = "non_refundable"

class City(Base):
    __tablename__ = "cities"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False, unique=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    province = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    accommodations = relationship("Accommodation", back_populates="city")

class AccommodationType(Base):
    __tablename__ = "accommodation_types"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False, unique=True)
    icon = Column(String(100), nullable=True)
    accommodations = relationship("Accommodation", back_populates="accommodation_type")

class AccommodationComplex(Base):
    __tablename__ = "accommodation_complexes"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    host_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    city_id = Column(String(36), ForeignKey("cities.id"), nullable=True)
    address = Column(Text, nullable=True)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    status = Column(String(20), default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    units = relationship("Accommodation", back_populates="complex")

class Accommodation(Base):
    __tablename__ = "accommodations"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    complex_id = Column(String(36), ForeignKey("accommodation_complexes.id"), nullable=True, index=True)
    host_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    city_id = Column(String(36), ForeignKey("cities.id"), nullable=True, index=True)
    accommodation_type_id = Column(String(36), ForeignKey("accommodation_types.id"), nullable=True)
    title = Column(String(300), nullable=False)
    slug = Column(String(300), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(AccommodationStatus), default=AccommodationStatus.draft, nullable=False, index=True)
    is_instant_booking = Column(Boolean, default=False)
    cancellation_policy = Column(SQLEnum(CancellationPolicy), default=CancellationPolicy.moderate, nullable=False)
    standard_capacity = Column(Integer, default=2)
    max_capacity = Column(Integer, default=4)
    bedrooms_count = Column(Integer, default=1)
    beds_count = Column(Integer, default=2)
    bathrooms_count = Column(Integer, default=1)
    base_price = Column(Numeric(15, 0), default=0)  # تومان
    cleaning_fee = Column(Numeric(15, 0), default=0)
    extra_guest_fee = Column(Numeric(15, 0), default=0)
    prepayment_percent = Column(Integer, default=30)
    min_nights = Column(Integer, default=1)
    max_nights = Column(Integer, default=30)
    check_in_time = Column(String(10), default="14:00")
    check_out_time = Column(String(10), default="12:00")
    allow_pets = Column(Boolean, default=False)
    allow_parties = Column(Boolean, default=False)
    smoking_allowed = Column(Boolean, default=False)
    address = Column(Text, nullable=True)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    rating_avg = Column(Numeric(3, 2), default=0)
    reviews_count = Column(Integer, default=0)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    host = relationship("User", back_populates="accommodations", foreign_keys=[host_id])
    complex = relationship("AccommodationComplex", back_populates="units")
    city = relationship("City", back_populates="accommodations")
    accommodation_type = relationship("AccommodationType", back_populates="accommodations")
    images = relationship("AccommodationImage", back_populates="accommodation", cascade="all, delete-orphan", order_by="AccommodationImage.sort_order")
    amenities_rel = relationship("AccommodationAmenity", back_populates="accommodation", cascade="all, delete-orphan")
    nightly_prices = relationship("NightlyPrice", back_populates="accommodation", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_accommodations_status_city", "status", "city_id", postgresql_where="status = 'published'"),
    )

class AccommodationImage(Base):
    __tablename__ = "accommodation_images"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    accommodation_id = Column(String(36), ForeignKey("accommodations.id", ondelete="CASCADE"), nullable=False, index=True)
    file_url = Column(String(500), nullable=False)
    sort_order = Column(Integer, default=0)
    is_cover = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    accommodation = relationship("Accommodation", back_populates="images")

class Amenity(Base):
    __tablename__ = "amenities"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False, unique=True)
    icon = Column(String(100), nullable=True)
    category = Column(String(50), nullable=True)
    accommodations = relationship("AccommodationAmenity", back_populates="amenity")

class AccommodationAmenity(Base):
    __tablename__ = "accommodation_amenities"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    accommodation_id = Column(String(36), ForeignKey("accommodations.id", ondelete="CASCADE"), nullable=False)
    amenity_id = Column(String(36), ForeignKey("amenities.id", ondelete="CASCADE"), nullable=False)
    accommodation = relationship("Accommodation", back_populates="amenities_rel")
    amenity = relationship("Amenity", back_populates="accommodations")
    __table_args__ = (UniqueConstraint("accommodation_id", "amenity_id", name="uq_acc_amenity"),)

class NightlyPrice(Base):
    __tablename__ = "nightly_prices"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    accommodation_id = Column(String(36), ForeignKey("accommodations.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    price = Column(Numeric(15, 0), nullable=False)
    is_available = Column(Boolean, default=True)
    min_nights = Column(Integer, nullable=True)
    note = Column(String(300), nullable=True)
    accommodation = relationship("Accommodation", back_populates="nightly_prices")
    __table_args__ = (
        UniqueConstraint("accommodation_id", "date", name="uq_acc_date"),
        Index("idx_nightly_prices_acc_date", "accommodation_id", "date"),
        Index("idx_nightly_prices_date_available", "date", "is_available"),
    )
