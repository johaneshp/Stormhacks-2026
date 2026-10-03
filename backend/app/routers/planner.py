from collections import Counter

from fastapi import APIRouter

from app.models.schemas import PlannerRequest, PlannerResponse
from app.services.ai import generate_trip_plan
from app.supabase_client import get_supabase

router = APIRouter(prefix="/planner", tags=["planner"])


@router.post("", response_model=PlannerResponse)
def create_plan(req: PlannerRequest):
    sb = get_supabase()

    past_trips = sb.table("trips").select("id").eq("user_id", req.user_id).execute().data
    trip_ids = [t["id"] for t in past_trips]

    travel_dna_totals: Counter = Counter()
    place_names: Counter = Counter()
    if trip_ids:
        stats = sb.table("trip_stats").select("*").in_("trip_id", trip_ids).execute().data
        for s in stats:
            for key, value in (s.get("travel_dna") or {}).items():
                travel_dna_totals[key] += value

        checkpoints = sb.table("checkpoints").select("place_name").in_("trip_id", trip_ids).execute().data
        for cp in checkpoints:
            place_names[cp["place_name"]] += 1

    avg_dna = {k: round(v / len(trip_ids), 1) for k, v in travel_dna_totals.items()} if trip_ids else {}
    favorite_place_types = [name for name, _ in place_names.most_common(5)]

    plan = generate_trip_plan(
        destination=req.destination,
        start_date=req.start_date.date().isoformat(),
        end_date=req.end_date.date().isoformat(),
        arrival_time=req.arrival_time,
        departure_time=req.departure_time,
        past_travel_dna=avg_dna,
        favorite_place_types=favorite_place_types,
    )
    return plan
