'use client';

import { useState } from 'react';

import { generatePlan } from '@/api/client';
import type { PlannerResponse } from '@/types';

const DEMO_USER_ID = '87f6283e-4d29-4dc4-b3e6-7f2403504ca9';

export default function PlannerPage() {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [plan, setPlan] = useState<PlannerResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await generatePlan({
        userId: DEMO_USER_ID,
        destination,
        startDate,
        endDate,
        arrivalTime: arrivalTime || undefined,
        departureTime: departureTime || undefined,
      });
      setPlan(result);
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = destination && startDate && endDate && !loading;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Travel Planner</h1>

      <div>
        <label className="mb-1 block text-sm font-medium">Destination</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Tokyo, Japan"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Start date</label>
          <input
            type="date"
            className="w-full rounded border px-3 py-2"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">End date</label>
          <input
            type="date"
            className="w-full rounded border px-3 py-2"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Arrival time (optional)</label>
          <input
            type="time"
            className="w-full rounded border px-3 py-2"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Departure time (optional)</label>
          <input
            type="time"
            className="w-full rounded border px-3 py-2"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
          />
        </div>
      </div>

      <button
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        disabled={!canGenerate}
        onClick={handleGenerate}
      >
        {loading ? 'Generating…' : 'Generate plan'}
      </button>

      {plan?.days.map((day) => (
        <div key={day.date} className="rounded-xl bg-gray-50 p-4">
          <p className="mb-2 font-bold">{day.date}</p>
          <div className="space-y-2">
            {day.stops.map((stop, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-16 shrink-0 font-semibold">{stop.time}</span>
                <div>
                  <p className="font-semibold">{stop.place_name}</p>
                  <p className="text-sm text-gray-600">{stop.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
