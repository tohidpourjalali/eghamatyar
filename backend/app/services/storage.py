"""
ذخیره‌سازی فایل — MinIO / S3-compatible با حالت Mock (URL محلی)
"""
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.endpoint = settings.S3_ENDPOINT
        self.bucket = settings.S3_BUCKET

    def get_upload_url(self, filename: str, folder: str = "uploads") -> str:
        # در Mock فقط URL برمی‌گردانیم؛ در پروداکشن presigned URL از MinIO
        return f"{self.endpoint}/{self.bucket}/{folder}/{filename}"

    def get_public_url(self, key: str) -> str:
        return f"{self.endpoint}/{self.bucket}/{key}"

storage_service = StorageService()
