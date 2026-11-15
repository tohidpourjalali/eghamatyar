import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer, Numeric, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

def gen_uuid():
    return str(uuid.uuid4())

class Review(Base):
    __tablename__ = "reviews"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    booking_id = Column(String(36), ForeignKey("bookings.id"), nullable=False, unique=True)
    accommodation_id = Column(String(36), ForeignKey("accommodations.id"), nullable=False, index=True)
    guest_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    host_reply = Column(Text, nullable=True)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # booking_accepted, payment_success, etc.
    title = Column(String(200), nullable=False)
    body = Column(Text, nullable=True)
    data = Column(JSON, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SupportTicket(Base):
    __tablename__ = "support_tickets"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    subject = Column(String(300), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), default="open")  # open | in_progress | resolved | closed
    priority = Column(String(20), default="normal")
    assigned_to = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String(36), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DiscountCode(Base):
    __tablename__ = "discount_codes"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    code = Column(String(50), unique=True, nullable=False, index=True)
    discount_type = Column(String(20), default="percent")  # percent | fixed
    discount_value = Column(Numeric(15, 0), nullable=False)
    max_uses = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0)
    min_amount = Column(Numeric(15, 0), default=0)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DiscountUsage(Base):
    __tablename__ = "discount_usages"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    discount_code_id = Column(String(36), ForeignKey("discount_codes.id"), nullable=False)
    booking_id = Column(String(36), ForeignKey("bookings.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(15, 0), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Favorite(Base):
    __tablename__ = "favorites"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    accommodation_id = Column(String(36), ForeignKey("accommodations.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
