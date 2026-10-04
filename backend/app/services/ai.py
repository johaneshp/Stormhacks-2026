import collections
import json
import threading
import time

import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted

from app.config import settings

PHOTO_CATEGORIES = ["food", "sightseeing", "group_photo", "selfie", "street_view"]

_configured = False


class _RateLimiter:
    """Caps calls to at most `max_calls` per rolling `window_seconds`, blocking
    the caller until there's room instead of firing bursts and hoping for the
    best. A concurrency cap alone doesn't bound throughput — fast calls can
    still cycle through far more than the per-minute quota even with only a
    few in flight at once.
    """

    def __init__(self, max_calls: int, window_seconds: float):
        self._max_calls = max_calls
        self._window = window_seconds
        self._calls: collections.deque[float] = collections.deque()
        self._lock = threading.Lock()

    def acquire(self) -> None:
        while True:
            with self._lock:
                now = time.monotonic()
                while self._calls and now - self._calls[0] >= self._window:
                    self._calls.popleft()
                if len(self._calls) < self._max_calls:
                    self._calls.append(now)
                    return
                wait = self._window - (now - self._calls[0])
            time.sleep(max(wait, 0.05))


# The free tier caps this model at 15 requests/minute; stay under that with
# some margin since timing isn't perfectly exact across threads.
_gemini_rate_limiter = _RateLimiter(max_calls=12, window_seconds=60)


def _ensure_configured():
    global _configured
    if not _configured:
        genai.configure(api_key=settings.gemini_api_key)
        _configured = True


def _generate_with_retry(model: genai.GenerativeModel, *args, max_attempts: int = 6, **kwargs):
    for attempt in range(max_attempts):
        _gemini_rate_limiter.acquire()
        try:
            return model.generate_content(*args, **kwargs)
        except ResourceExhausted as e:
            if attempt == max_attempts - 1:
                raise
            delay = getattr(getattr(e, "retry_delay", None), "seconds", None) or 15
            time.sleep(delay + 1)


def categorize_photo(image_bytes: bytes) -> str:
    """Asks Gemini to label a single photo thumbnail into one of PHOTO_CATEGORIES."""
    _ensure_configured()
    model = genai.GenerativeModel("gemini-flash-lite-latest")
    prompt = (
        "Classify this travel photo into exactly one category: "
        f"{', '.join(PHOTO_CATEGORIES)}. Reply with only the category name."
    )
    response = _generate_with_retry(
        model, [prompt, {"mime_type": "image/jpeg", "data": image_bytes}]
    )
    label = response.text.strip().lower().replace(" ", "_")
    return label if label in PHOTO_CATEGORIES else "sightseeing"


def summarize_checkpoint(
    place_name: str,
    photo_count: int,
    duration_minutes: float,
    image_bytes: bytes | None = None,
) -> str:
    _ensure_configured()
    model = genai.GenerativeModel("gemini-flash-lite-latest")
    prompt = (
        f"Write 2-3 sentences for a trip journal about a stop at {place_name}. "
        f"The traveler spent about {duration_minutes:.0f} minutes here and took {photo_count} photo(s). "
        "Start by plainly naming the place (e.g. \"Stopped at <place>\"), then describe specific, "
        "concrete details you can actually see in the photo below — scenery, weather, lighting, "
        "notable features like a sunset, landscape, food, or activity. "
        "Do not use vague hype phrases like 'absolute breeze', 'totally amazing', or 'hidden gem' — "
        "be specific and grounded in what's actually visible, not generic enthusiasm."
        if image_bytes
        else (
            f"Write 1-2 sentences for a trip journal about a stop at {place_name}. "
            f"The traveler spent about {duration_minutes:.0f} minutes here and took {photo_count} photo(s). "
            "Plainly name the place and mention the time/photo count naturally. No image is available, "
            "so don't invent visual details — avoid vague hype phrases like 'absolute breeze' or "
            "'hidden gem' and keep it factual."
        )
    )
    content = [prompt, {"mime_type": "image/jpeg", "data": image_bytes}] if image_bytes else prompt
    response = _generate_with_retry(model, content)
    return response.text.strip()


def generate_trip_plan(
    destination: str,
    start_date: str,
    end_date: str,
    arrival_time: str | None,
    departure_time: str | None,
    past_travel_dna: dict,
    favorite_place_types: list[str],
) -> dict:
    _ensure_configured()
    model = genai.GenerativeModel(
        "gemini-flash-lite-latest",
        generation_config={"response_mime_type": "application/json"},
    )
    prompt = f"""
You are a trip planner. Build a day-by-day itinerary as JSON.

Destination: {destination}
Dates: {start_date} to {end_date}
Arrival time: {arrival_time or "unspecified"}
Departure time: {departure_time or "unspecified"}
Traveler's historical Travel DNA (percent of past photos by type): {json.dumps(past_travel_dna)}
Traveler's favorite place types: {", ".join(favorite_place_types) or "none recorded yet"}

Return JSON of the shape:
{{"destination": "...", "days": [{{"date": "YYYY-MM-DD", "stops": [{{"time": "HH:MM", "place_name": "...", "reason": "..."}}]}}]}}
"""
    response = _generate_with_retry(model, prompt)
    return json.loads(response.text)
