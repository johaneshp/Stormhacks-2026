from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TripCreate(BaseModel):
    user_id: str
    title: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class Trip(TripCreate):
    id: str


class PhotoOut(BaseModel):
    id: str
    checkpoint_id: Optional[str] = None
    trip_id: str
    file_url: str
    taken_at: Optional[datetime] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    category: Optional[str] = None


class Checkpoint(BaseModel):
    id: str
    trip_id: str
    place_name: Optional[str] = None
    lat: float
    lon: float
    arrived_at: Optional[datetime] = None
    left_at: Optional[datetime] = None
    order_index: int
    summary: Optional[str] = None
    photos: list[PhotoOut] = []


class TravelDNA(BaseModel):
    food: float = 0
    sightseeing: float = 0
    group_photo: float = 0
    selfie: float = 0
    street_view: float = 0


class CoreMemory(BaseModel):
    title: str
    checkpoint_id: str
    place_name: str
    date: Optional[str] = None
    detail: str
    photo_url: Optional[str] = None


class TripSummary(BaseModel):
    trip_id: str
    travel_dna: TravelDNA
    core_memories: list[CoreMemory]


class PlannerRequest(BaseModel):
    user_id: str
    destination: str
    start_date: datetime
    end_date: datetime
    arrival_time: Optional[str] = None
    departure_time: Optional[str] = None


class PlannerDayStop(BaseModel):
    time: str
    place_name: str
    reason: str


class PlannerDay(BaseModel):
    date: str
    stops: list[PlannerDayStop]


class PlannerResponse(BaseModel):
    destination: str
    days: list[PlannerDay]
