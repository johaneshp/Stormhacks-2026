from fastapi import APIRouter, HTTPException, UploadFile

from app.models.schemas import Checkpoint
from app.services.ai import categorize_photo, summarize_checkpoint
from app.services.clustering import checkpoint_center, cluster_into_checkpoints
from app.services.exif import extract_photo_metadata
from app.supabase_client import get_supabase

router = APIRouter(prefix="/trips/{trip_id}", tags=["checkpoints"])

PHOTO_BUCKET = "trip-photos"


@router.post("/photos")
async def upload_photos(trip_id: str, files: list[UploadFile]):
    """Uploads photos for a trip, extracts EXIF time/GPS, clusters into checkpoints,
    categorizes each photo with Gemini, and writes checkpoints + photos to Supabase.
    """
    sb = get_supabase()

    photos: list[dict] = []
    for file in files:
        raw = await file.read()
        meta = extract_photo_metadata(raw)
        path = f"{trip_id}/{file.filename}"
        sb.storage.from_(PHOTO_BUCKET).upload(path, raw, {"upsert": "true"})
        file_url = sb.storage.from_(PHOTO_BUCKET).get_public_url(path)
        category = categorize_photo(raw)
        photos.append(
            {
                "trip_id": trip_id,
                "file_url": file_url,
                "taken_at": meta["taken_at"],
                "lat": meta["lat"],
                "lon": meta["lon"],
                "category": category,
            }
        )

    photos.sort(key=lambda p: p["taken_at"] or "")
    groups = cluster_into_checkpoints(photos)

    created_checkpoints = []
    for order_index, group in enumerate(groups):
        lat, lon = checkpoint_center(group)
        times = [p["taken_at"] for p in group if p["taken_at"]]
        arrived_at = min(times) if times else None
        left_at = max(times) if times else None
        duration_minutes = (
            (left_at - arrived_at).total_seconds() / 60 if arrived_at and left_at else 0
        )
        summary = summarize_checkpoint(f"stop #{order_index + 1}", len(group), duration_minutes)

        checkpoint_row = (
            sb.table("checkpoints")
            .insert(
                {
                    "trip_id": trip_id,
                    "place_name": f"Stop {order_index + 1}",
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

        for photo in group:
            photo["checkpoint_id"] = checkpoint_row["id"]
            if photo["taken_at"]:
                photo["taken_at"] = photo["taken_at"].isoformat()
        sb.table("photos").insert(group).execute()

        checkpoint_row["photos"] = group
        created_checkpoints.append(checkpoint_row)

    return created_checkpoints


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
