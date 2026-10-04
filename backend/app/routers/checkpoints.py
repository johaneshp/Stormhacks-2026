import asyncio
import uuid
from pathlib import PurePosixPath

from fastapi import APIRouter, HTTPException, UploadFile

from app.models.schemas import Checkpoint
from app.services.ai import categorize_photo, summarize_checkpoint
from app.services.clustering import checkpoint_center, cluster_into_checkpoints
from app.services.exif import extract_photo_metadata
from app.services.geocode import reverse_geocode
from app.supabase_client import get_supabase

router = APIRouter(prefix="/trips/{trip_id}", tags=["checkpoints"])

PHOTO_BUCKET = "trip-photos"


def _upload_and_categorize(path: str, raw: bytes) -> tuple[str, str]:
    sb = get_supabase()
    sb.storage.from_(PHOTO_BUCKET).upload(path, raw, {"upsert": "true"})
    file_url = sb.storage.from_(PHOTO_BUCKET).get_public_url(path)
    category = categorize_photo(raw)
    return file_url, category


async def _process_photo(trip_id: str, file: UploadFile) -> dict | None:
    raw = await file.read()
    meta = extract_photo_metadata(raw)
    # Real filenames can contain spaces, parentheses, colons, etc., which breaks
    # as a raw storage object key. Use a random name and keep only the extension.
    suffix = PurePosixPath(file.filename or "").suffix
    path = f"{trip_id}/{uuid.uuid4().hex}{suffix}"

    # Supabase storage upload + the Gemini categorization call are both blocking
    # network calls; offload to a thread so photos process concurrently instead
    # of one full round-trip at a time. One flaky upload shouldn't take down the
    # whole batch, so retry once and otherwise skip this photo.
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            file_url, category = await asyncio.to_thread(_upload_and_categorize, path, raw)
            return {
                "trip_id": trip_id,
                "file_url": file_url,
                "taken_at": meta["taken_at"],
                "lat": meta["lat"],
                "lon": meta["lon"],
                "category": category,
                # kept only to pick a representative photo for the checkpoint
                # summary below; stripped before anything reaches the database.
                "_raw": raw,
            }
        except Exception as e:  # noqa: BLE001 - deliberately broad, see comment above
            last_error = e

    print(f"Skipping photo {file.filename!r} after repeated failures: {last_error}")
    return None


def _summarize_and_save(trip_id: str, order_index: int, group: list[dict]) -> dict:
    sb = get_supabase()
    lat, lon = checkpoint_center(group)
    times = [p["taken_at"] for p in group if p["taken_at"]]
    arrived_at = min(times) if times else None
    left_at = max(times) if times else None
    duration_minutes = (
        (left_at - arrived_at).total_seconds() / 60 if arrived_at and left_at else 0
    )

    place_name = reverse_geocode(lat, lon) or f"Stop {order_index + 1}"
    # Prefer a scenic/food/street shot over a selfie or group photo as the
    # representative image, since those tend to show the actual surroundings.
    representative = next(
        (p for p in group if p.get("category") not in ("selfie", "group_photo")), group[0]
    )
    summary = summarize_checkpoint(
        place_name, len(group), duration_minutes, representative.get("_raw")
    )

    checkpoint_row = (
        sb.table("checkpoints")
        .insert(
            {
                "trip_id": trip_id,
                "place_name": place_name,
                "lat": lat,
                "lon": lon,
                "arrived_at": arrived_at.isoformat() if arrived_at else None,
                "left_at": left_at.isoformat() if left_at else None,
                "order_index": order_index,
                "summary": summary,
            }
        )
        .execute()
    ).data[0]

    photo_rows = [{k: v for k, v in photo.items() if k != "_raw"} for photo in group]
    for photo in photo_rows:
        photo["checkpoint_id"] = checkpoint_row["id"]
        if photo["taken_at"]:
            photo["taken_at"] = photo["taken_at"].isoformat()
    inserted_photos = sb.table("photos").insert(photo_rows).execute().data

    checkpoint_row["photos"] = inserted_photos
    return checkpoint_row


@router.post("/photos")
async def upload_photos(trip_id: str, files: list[UploadFile]):
    """Uploads photos for a trip, extracts EXIF time/GPS, clusters into checkpoints,
    categorizes each photo with Gemini, and writes checkpoints + photos to Supabase.
    """
    results = await asyncio.gather(*(_process_photo(trip_id, file) for file in files))
    photos = [p for p in results if p is not None]
    if not photos:
        raise HTTPException(500, "All photo uploads failed")
    photos.sort(key=lambda p: p["taken_at"] or "")
    groups = cluster_into_checkpoints(photos)

    created_checkpoints = await asyncio.gather(
        *(
            asyncio.to_thread(_summarize_and_save, trip_id, order_index, group)
            for order_index, group in enumerate(groups)
        )
    )
    return list(created_checkpoints)


@router.get("/checkpoints", response_model=list[Checkpoint])
def list_checkpoints(trip_id: str):
    sb = get_supabase()
    checkpoints = sb.table("checkpoints").select("*").eq("trip_id", trip_id).order("order_index").execute().data
    for cp in checkpoints:
        cp["photos"] = sb.table("photos").select("*").eq("checkpoint_id", cp["id"]).execute().data
    return checkpoints


@router.get("/checkpoints/{checkpoint_id}", response_model=Checkpoint)
def get_checkpoint(trip_id: str, checkpoint_id: str):
    sb = get_supabase()
    cp = sb.table("checkpoints").select("*").eq("id", checkpoint_id).single().execute().data
    if not cp:
        raise HTTPException(404, "Checkpoint not found")
    cp["photos"] = sb.table("photos").select("*").eq("checkpoint_id", checkpoint_id).execute().data
    return cp
