import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Numeric, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

def gen_uuid():
    return str(uuid.uuid4())

class PaymentType(str, enum.Enum):
    prepayment = "prepayment"
    remaining = "remaining"
    full = "full"
    refund = "refund"

class PaymentStatus(str, enum.Enum):
    pending = "pending"
    success = "success"
    failed = "failed"
    refunded = "refunded"
    cancelled = "cancelled"

class Gateway(str, enum.Enum):
    zarinpal = "zarinpal"
    idpay = "idpay"
    mock = "mock"

class Payment(Base):
    __tablename__ = "payments"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(15, 0), nullable=False)
    payment_type = Column(SQLEnum(PaymentType), nullable=False)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.pending, nullable=False)
    gateway = Column(SQLEnum(Gateway), default=Gateway.mock, nullable=False)
    gateway_ref_id = Column(String(100), nullable=True, index=True)
    tracking_code = Column(String(50), nullable=True, unique=True, index=True)
    authority = Column(String(100), nullable=True)
    idempotency_key = Column(String(100), nullable=True, unique=True, index=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    booking = relationship("Booking", back_populates="payments")
    __table_args__ = (
        Index("idx_payments_booking", "booking_id"),
        Index("idx_payments_gateway_ref", "gateway_ref_id"),
    )

class Commission(Base):
    __tablename__ = "commissions"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.id"), nullable=False, index=True)
    host_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(15, 0), nullable=False)
    percent = Column(Numeric(5, 2), default=10)
    status = Column(String(20), default="pending")  # pending | settled | refunded
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class HostBalance(Base):
    __tablename__ = "host_balances"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    host_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    available_balance = Column(Numeric(15, 0), default=0)
    pending_balance = Column(Numeric(15, 0), default=0)
    total_earned = Column(Numeric(15, 0), default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class HostPayout(Base):
    __tablename__ = "host_payouts"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    host_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    bank_account_id = Column(String(36), ForeignKey("bank_accounts.id"), nullable=True)
    amount = Column(Numeric(15, 0), nullable=False)
    status = Column(String(20), default="pending")  # pending | approved | paid | rejected
    sheba_number = Column(String(26), nullable=True)
    tracking_code = Column(String(50), nullable=True)
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
