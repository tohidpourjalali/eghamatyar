import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Numeric, Date, Enum as SQLEnum, JSON, Index, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

def gen_uuid():
    return str(uuid.uuid4())

class BookingStatus(str, enum.Enum):
    pending_host_approval = "pending_host_approval"
    pending_payment = "pending_payment"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"
    expired = "expired"
    refunded = "refunded"

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    booking_code = Column(String(20), unique=True, nullable=False, index=True)
    guest_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    status = Column(SQLEnum(BookingStatus), default=BookingStatus.pending_host_approval, nullable=False, index=True)
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    nights_count = Column(Integer, nullable=False)
    adults_count = Column(Integer, default=2)
    children_count = Column(Integer, default=0)
    infants_count = Column(Integer, default=0)
    # مالی (تومان)
    base_amount = Column(Numeric(15, 0), default=0)
    cleaning_fee_amount = Column(Numeric(15, 0), default=0)
    extra_guest_amount = Column(Numeric(15, 0), default=0)
    discount_amount = Column(Numeric(15, 0), default=0)
    commission_amount = Column(Numeric(15, 0), default=0)
    total_amount = Column(Numeric(15, 0), default=0)
    prepayment_amount = Column(Numeric(15, 0), default=0)
    remaining_amount = Column(Numeric(15, 0), default=0)
    paid_amount = Column(Numeric(15, 0), default=0)
    refunded_amount = Column(Numeric(15, 0), default=0)
    prepayment_percent = Column(Integer, default=30)  # snapshot
    cancellation_policy = Column(String(20), default="moderate")  # snapshot
    discount_code = Column(String(50), nullable=True)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_by = Column(String(20), nullable=True)  # guest | host | system | admin
    cancellation_reason = Column(Text, nullable=True)
    host_response_deadline = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    guest = relationship("User", back_populates="bookings", foreign_keys=[guest_id])
    units = relationship("BookingUnit", back_populates="booking", cascade="all, delete-orphan")
    snapshot = relationship("BookingSnapshot", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")
    holds = relationship("BookingHold", back_populates="booking", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_bookings_guest", "guest_id"),
        Index("idx_bookings_status", "status"),
        Index("idx_bookings_dates", "check_in_date", "check_out_date"),
    )

class BookingUnit(Base):
    __tablename__ = "booking_units"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    accommodation_id = Column(String(36), ForeignKey("accommodations.id"), nullable=False, index=True)
    # snapshot مالی هر واحد
    base_amount = Column(Numeric(15, 0), default=0)
    cleaning_fee_amount = Column(Numeric(15, 0), default=0)
    extra_guest_amount = Column(Numeric(15, 0), default=0)
    total_amount = Column(Numeric(15, 0), default=0)
    booking = relationship("Booking", back_populates="units")
    accommodation = relationship("Accommodation")

class BookingSnapshot(Base):
    __tablename__ = "booking_snapshots"
    booking_id = Column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), primary_key=True)
    full_snapshot = Column(JSON().with_variant(JSONB, "postgresql"), nullable=False)  # PostgreSQL JSONB; SQLite JSON for local tests
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    booking = relationship("Booking", back_populates="snapshot")

class BookingHold(Base):
    __tablename__ = "booking_holds"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=True, index=True)
    accommodation_id = Column(String(36), ForeignKey("accommodations.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    booking = relationship("Booking", back_populates="holds")
    __table_args__ = (
        Index("idx_booking_holds_acc_date", "accommodation_id", "date"),
        Index("idx_booking_holds_expires", "expires_at"),
        Index(
            "uq_booking_hold_active_date", "accommodation_id", "date", unique=True,
            postgresql_where=text("is_active = true"),
            sqlite_where=text("is_active = 1"),
        ),
    )
