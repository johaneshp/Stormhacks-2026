import type { Checkpoint, PlannerResponse, TripSummary } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export function createTrip(userId: string, title: string) {
  return request<{ id: string }>('/trips', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, title }),
  });
}

export function uploadPhotos(tripId: string, files: File[]) {
  const form = new FormData();
  files.forEach((file) => form.append('files', file, file.name));
  return request<Checkpoint[]>(`/trips/${tripId}/photos`, { method: 'POST', body: form });
}

export function getCheckpoints(tripId: string) {
  return request<Checkpoint[]>(`/trips/${tripId}/checkpoints`);
}

export function getTripSummary(tripId: string) {
  return request<TripSummary>(`/trips/${tripId}/summary`);
}

export function generatePlan(params: {
  userId: string;
  destination: string;
  startDate: string;
  endDate: string;
  arrivalTime?: string;
  departureTime?: string;
}) {
  return request<PlannerResponse>('/planner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: params.userId,
      destination: params.destination,
      start_date: params.startDate,
      end_date: params.endDate,
      arrival_time: params.arrivalTime,
      departure_time: params.departureTime,
    }),
  });
}
