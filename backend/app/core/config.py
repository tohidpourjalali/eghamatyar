from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "EghamatYar API"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./eghamatyar.db"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "dev-secret-change-in-production-32chars!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    OTP_EXPIRE_MINUTES: int = 5
    OTP_LENGTH: int = 5
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RATE_LIMIT_PER_HOUR: int = 10
    HOLD_TTL_MINUTES: int = 20
    COMMISSION_PERCENT: float = 10.0
    DEFAULT_PREPAYMENT_PERCENT: int = 30
    REMAINING_PAYMENT_DAYS_BEFORE_CHECKIN: int = 3
    KAVENEGAR_API_KEY: str = "mock"
    KAVENEGAR_SENDER: str = "1000000000"
    ZARINPAL_MERCHANT_ID: str = "mock-merchant"
    IDPAY_API_KEY: str = "mock-idpay"
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin123"
    S3_BUCKET: str = "eghamatyar"
    MAP_PROVIDER: str = "neshan"  # neshan | mapir | google
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache
def get_settings():
    return Settings()

settings = get_settings()
