'use client';

import { useState } from 'react';

import { generatePlan } from '@/api/client';
import type { PlannerResponse } from '@/types';

const DEMO_USER_ID = 'edad5ef7-3460-4591-b913-5d7091a312a9';

export default function PlannerPage() {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [plan, setPlan] = useState<PlannerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate the plan. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = destination && startDate && endDate && !loading;

  return (
    <div className="page-shell">
      <p className="eyebrow">A slower kind of planning</p>
      <h1 className="page-heading">Somewhere<br />wonderful awaits.</h1>
      <p className="page-intro">Tell us when and where. We’ll sketch out a thoughtful first itinerary for you.</p>

      <div className="panel stack">
        <div>
        <label className="field-label">Destination</label>
        <input
          className="field-input"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Tokyo, Japan"
        />
        </div>

      <div className="grid-two">
        <div>
          <label className="field-label">Start date</label>
          <input
            type="date"
            className="field-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">End date</label>
          <input
            type="date"
            className="field-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Arrival time · optional</label>
          <input
            type="time"
            className="field-input"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Departure time · optional</label>
          <input
            type="time"
            className="field-input"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
          />
        </div>
      </div>

      <button
        className="primary-button"
        disabled={!canGenerate}
        onClick={handleGenerate}
      >
        {loading ? 'Generating…' : 'Generate plan'}
      </button>
      {error && <p className="notice" role="alert">{error}</p>}

      </div>

      {plan?.days.map((day) => (
        <div key={day.date} className="plan-day mt-6">
          <h2>{day.date}</h2>
          <div>
            {day.stops.map((stop, i) => (
              <div key={i} className="plan-stop">
                <span className="plan-time">{stop.time}</span>
                <div>
                  <p>{stop.place_name}</p>
                  <p className="muted">{stop.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
