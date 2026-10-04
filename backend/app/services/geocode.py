import threading
import time

import httpx

# Nominatim's public endpoint usage policy caps requests at 1/sec and requires
# a descriptive User-Agent.
_MIN_INTERVAL_SECONDS = 1.0
_lock = threading.Lock()
_last_call_at = 0.0


def reverse_geocode(lat: float, lon: float) -> str | None:
    """Resolves coordinates to a short place name like "Cannon Beach, Oregon", via
    OpenStreetMap's Nominatim. Returns None if the lookup fails for any reason.
    """
    global _last_call_at
    with _lock:
        wait = _MIN_INTERVAL_SECONDS - (time.monotonic() - _last_call_at)
        if wait > 0:
            time.sleep(wait)
        _last_call_at = time.monotonic()

    try:
        resp = httpx.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"format": "jsonv2", "lat": lat, "lon": lon, "zoom": 16, "accept-language": "en"},
            headers={"User-Agent": "trip-tracker-hackathon-app"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        return None

    address = data.get("address", {})
    # A named tourism/natural/leisure feature (e.g. a beach, park, landmark) is
    # worth calling out specifically; a bare street/building name isn't, so it's
    # a lower-priority fallback than the town/city itself.
    feature = (
        address.get("attraction")
        or address.get("tourism")
        or address.get("natural")
        or address.get("leisure")
    )
    locality = (
        address.get("city")
        or address.get("town")
        or address.get("village")
        or address.get("suburb")
        or address.get("hamlet")
    )

    if feature and locality and feature != locality:
        return f"{feature}, {locality}"
    if locality:
        return locality
    return data.get("name") or address.get("road") or data.get("display_name")
