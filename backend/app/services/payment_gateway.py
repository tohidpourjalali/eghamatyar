"""
درگاه‌های پرداخت — آداپترهای Zarinpal / IDPay با حالت Mock
"""
import uuid
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class PaymentGateway:
    def __init__(self, name: str):
        self.name = name
        self.is_mock = True  # در dev همیشه mock

    def request_payment(self, amount: int, callback_url: str, description: str = "") -> dict:
        authority = f"mock-{self.name}-{uuid.uuid4().hex[:12]}"
        payment_url = f"{settings.FRONTEND_URL}/payment/result?authority={authority}&gateway={self.name}&mock=1"
        logger.info(f"[MOCK {self.name}] Request {amount} Toman -> {authority}")
        return {"authority": authority, "payment_url": payment_url, "gateway": self.name}

    def verify_payment(self, authority: str, amount: int) -> dict:
        ref_id = f"mock-ref-{uuid.uuid4().hex[:10]}"
        return {"success": True, "ref_id": ref_id, "tracking_code": ref_id, "authority": authority}

    def refund(self, ref_id: str, amount: int) -> bool:
        logger.info(f"[MOCK {self.name}] Refund {amount} ref={ref_id}")
        return True

class ZarinpalGateway(PaymentGateway):
    def __init__(self):
        super().__init__("zarinpal")
        self.merchant_id = settings.ZARINPAL_MERCHANT_ID

class IDPayGateway(PaymentGateway):
    def __init__(self):
        super().__init__("idpay")
        self.api_key = settings.IDPAY_API_KEY

GATEWAYS = {
    "zarinpal": ZarinpalGateway(),
    "idpay": IDPayGateway(),
    "mock": PaymentGateway("mock"),
}

def get_gateway(name: str = "mock") -> PaymentGateway:
    return GATEWAYS.get(name, GATEWAYS["mock"])
