"""
نقشه — Neshan / Map.ir / Google (fallback)
در Mock فقط لینک نقشه برمی‌گردانیم.
"""
from app.core.config import settings

def get_map_url(lat: float, lng: float, provider: str = None) -> str:
    provider = provider or settings.MAP_PROVIDER
    if provider == "neshan":
        return f"https://neshan.org/maps/place/{lat},{lng}"
    elif provider == "mapir":
        return f"https://map.ir/map?lat={lat}&lng={lng}"
    else:
        return f"https://www.google.com/maps?q={lat},{lng}"

def geocode_mock(address: str):
    # Mock: مختصات تهران
    return {"lat": 35.6892, "lng": 51.3890, "address": address}
