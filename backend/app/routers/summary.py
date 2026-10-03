from datetime import datetime

from fastapi import APIRouter

from app.models.schemas import TripSummary
from app.services.memories import compute_core_memories, compute_travel_dna
from app.supabase_client import get_supabase

router = APIRouter(prefix="/trips/{trip_id}", tags=["summary"])


@router.get("/summary", response_model=TripSummary)
def get_trip_summary(trip_id: str):
    sb = get_supabase()

    checkpoints = sb.table("checkpoints").select("*").eq("trip_id", trip_id).order("order_index").execute().data

    all_categories = []
    for cp in checkpoints:
        photos = sb.table("photos").select("*").eq("checkpoint_id", cp["id"]).execute().data
        cp["photos"] = photos
        cp["category_counts"] = {}
        for p in photos:
            all_categories.append(p["category"])
            cp["category_counts"][p["category"]] = cp["category_counts"].get(p["category"], 0) + 1
        cp["duration_minutes"] = (
            (datetime.fromisoformat(cp["left_at"]) - datetime.fromisoformat(cp["arrived_at"])).total_seconds() / 60
            if cp.get("arrived_at") and cp.get("left_at")
            else 0
        )
        cp["date"] = cp["arrived_at"][:10] if cp.get("arrived_at") else None

    travel_dna = compute_travel_dna(all_categories)
    core_memories = compute_core_memories(checkpoints)

    sb.table("trip_stats").upsert(
        {
            "trip_id": trip_id,
            "travel_dna": travel_dna.model_dump(),
            "core_memories": [m.model_dump() for m in core_memories],
        }
    ).execute()

    return TripSummary(trip_id=trip_id, travel_dna=travel_dna, core_memories=core_memories)
