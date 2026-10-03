export interface Photo {
  id: string;
  checkpoint_id?: string;
  trip_id: string;
  file_url: string;
  taken_at?: string;
  lat?: number;
  lon?: number;
  category?: 'food' | 'sightseeing' | 'group_photo' | 'selfie' | 'street_view';
}

export interface Checkpoint {
  id: string;
  trip_id: string;
  place_name?: string;
  lat: number;
  lon: number;
  arrived_at?: string;
  left_at?: string;
  order_index: number;
  summary?: string;
  photos: Photo[];
}

export interface TravelDNA {
  food: number;
  sightseeing: number;
  group_photo: number;
  selfie: number;
  street_view: number;
}

export interface CoreMemory {
  title: string;
  checkpoint_id: string;
  place_name: string;
  date?: string;
  detail: string;
  photo_url?: string;
}

export interface TripSummary {
  trip_id: string;
  travel_dna: TravelDNA;
  core_memories: CoreMemory[];
}

export interface PlannerDayStop {
  time: string;
  place_name: string;
  reason: string;
}

export interface PlannerDay {
  date: string;
  stops: PlannerDayStop[];
}

export interface PlannerResponse {
  destination: string;
  days: PlannerDay[];
}
