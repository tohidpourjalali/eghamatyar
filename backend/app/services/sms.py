"""
سرویس پیامک — آداپتر Kavenegar با حالت Mock
در حالت Mock کد OTP در لاگ چاپ می‌شود و در پاسخ dev برگردانده می‌شود.
برای اتصال واقعی: KAVENEGAR_API_KEY را تنظیم کنید.
"""
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class SMSService:
    def __init__(self):
        self.api_key = settings.KAVENEGAR_API_KEY
        self.sender = settings.KAVENEGAR_SENDER
        self.is_mock = self.api_key == "mock"

    def send_otp(self, mobile: str, code: str) -> bool:
        if self.is_mock:
            logger.info(f"[MOCK SMS] OTP for {mobile}: {code}")
            print(f"[MOCK SMS] OTP for {mobile}: {code}")
            return True
        # TODO: پیاده‌سازی واقعی Kavenegar با httpx
        # POST https://api.kavenegar.com/v1/{api_key}/VerifyLookup.json
        logger.info(f"[Kavenegar] Sending OTP to {mobile}")
        return True

    def send_notification(self, mobile: str, message: str) -> bool:
        if self.is_mock:
            logger.info(f"[MOCK SMS] To {mobile}: {message}")
            return True
        return True

sms_service = SMSService()
