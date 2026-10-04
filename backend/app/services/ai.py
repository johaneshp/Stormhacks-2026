import json

import google.generativeai as genai

from app.config import settings

PHOTO_CATEGORIES = ["food", "sightseeing", "group_photo", "selfie", "street_view"]

_configured = False


def _ensure_configured():
    global _configured
    if not _configured:
        genai.configure(api_key=settings.gemini_api_key)
        _configured = True


def categorize_photo(image_bytes: bytes) -> str:
    """Asks Gemini to label a single photo thumbnail into one of PHOTO_CATEGORIES."""
    _ensure_configured()
    model = genai.GenerativeModel("gemini-flash-latest")
    prompt = (
        "Classify this travel photo into exactly one category: "
        f"{', '.join(PHOTO_CATEGORIES)}. Reply with only the category name."
    )
    response = model.generate_content(
        [prompt, {"mime_type": "image/jpeg", "data": image_bytes}]
    )
    label = response.text.strip().lower().replace(" ", "_")
    return label if label in PHOTO_CATEGORIES else "sightseeing"


def summarize_checkpoint(place_name: str, photo_count: int, duration_minutes: float) -> str:
    _ensure_configured()
    model = genai.GenerativeModel("gemini-flash-latest")
    prompt = (
        f"Write a one-sentence, upbeat trip-journal note about a stop at {place_name}, "
        f"where the traveler took {photo_count} photos over {duration_minutes:.0f} minutes."
    )
    response = model.generate_content(prompt)
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
        "gemini-flash-latest",
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
    response = model.generate_content(prompt)
    return json.loads(response.text)
