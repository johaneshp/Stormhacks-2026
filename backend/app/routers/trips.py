from fastapi import APIRouter, HTTPException

from app.models.schemas import Trip, TripCreate
from app.supabase_client import get_supabase

router = APIRouter(prefix="/trips", tags=["trips"])


@router.post("", response_model=Trip)
def create_trip(trip: TripCreate):
    sb = get_supabase()
    result = sb.table("trips").insert(trip.model_dump(mode="json")).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create trip")
    return result.data[0]


@router.get("/{trip_id}", response_model=Trip)
def get_trip(trip_id: str):
    sb = get_supabase()
    result = sb.table("trips").select("*").eq("id", trip_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Trip not found")
    return result.data


@router.get("", response_model=list[Trip])
def list_trips(user_id: str):
    sb = get_supabase()
    result = sb.table("trips").select("*").eq("user_id", user_id).order("start_time").execute()
    return result.data
