import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class UserRole(str, enum.Enum):
    guest = "guest"
    host = "host"
    support = "support"
    finance = "finance"
    content_manager = "content_manager"
    admin = "admin"
    super_admin = "super_admin"

class DocumentType(str, enum.Enum):
    national_card = "national_card"
    birth_certificate = "birth_certificate"
    bank_card = "bank_card"

class DocumentStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    mobile = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.guest, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_host_approved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    documents = relationship("IdentityDocument", back_populates="user", foreign_keys="IdentityDocument.user_id", cascade="all, delete-orphan")
    bank_accounts = relationship("BankAccount", back_populates="user", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="guest", foreign_keys="Booking.guest_id")
    accommodations = relationship("Accommodation", back_populates="host", foreign_keys="Accommodation.host_id")

class UserProfile(Base):
    __tablename__ = "user_profiles"
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    national_code = Column(String(20), nullable=True, index=True)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    user = relationship("User", back_populates="profile")

class IdentityDocument(Base):
    __tablename__ = "identity_documents"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(SQLEnum(DocumentType), nullable=False)
    file_url = Column(String(500), nullable=False)
    status = Column(SQLEnum(DocumentStatus), default=DocumentStatus.pending, nullable=False)
    reviewed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    user = relationship("User", back_populates="documents", foreign_keys=[user_id])

class BankAccount(Base):
    __tablename__ = "bank_accounts"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    bank_name = Column(String(100), nullable=False)
    sheba_number = Column(String(26), nullable=False)  # IR...
    card_number_masked = Column(String(20), nullable=True)
    owner_name = Column(String(200), nullable=False)
    is_verified = Column(Boolean, default=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", back_populates="bank_accounts")

class OTPCode(Base):
    __tablename__ = "otp_codes"
    id = Column(String(36), primary_key=True, default=gen_uuid)
    mobile = Column(String(20), nullable=False, index=True)
    code_hash = Column(String(255), nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
