'use client';

import { useEffect, useState } from 'react';
import { getTripSummary } from '@/api/client';
import type { TripSummary } from '@/types';

const DEMO_TRIP_ID = '407bd7db-57b5-4195-a732-3421b5d44958';
const DNA_LABELS: { key: keyof TripSummary['travel_dna']; label: string }[] = [
  { key: 'food', label: 'Food' }, { key: 'sightseeing', label: 'Sightseeing' },
  { key: 'group_photo', label: 'Group photos' }, { key: 'selfie', label: 'Selfies' },
  { key: 'street_view', label: 'Street views' },
];

export default function SummaryPage() {
  const [summary, setSummary] = useState<TripSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    getTripSummary(DEMO_TRIP_ID)
      .then(setSummary)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load your trip summary.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="page-shell muted">Gathering your travel memories…</p>;
  if (!summary) return <div className="page-shell">{error ? <p className="notice" role="alert">{error}</p> : <><p className="eyebrow">Your travel story</p><h1 className="page-heading">Memories are<br />on their way.</h1><p className="page-intro">Upload a few trip photos to see the little details that make your travels yours.</p></>}</div>;

  return (
    <div className="page-shell wide stack">
      <header>
        <p className="eyebrow">The places and things you love</p>
        <h1 className="page-heading">Your travel DNA.</h1>
        <p className="page-intro">A small portrait of the way you like to see the world.</p>
      </header>
      <section className="panel">
        <h2 className="panel-title">What draws you in</h2>
        {DNA_LABELS.map(({ key, label }) => (
          <div key={key} className="dna-row">
            <span>{label}</span>
            <div className="dna-track"><div className="dna-fill" style={{ width: `${summary.travel_dna[key]}%` }} /></div>
            <span className="muted">{summary.travel_dna[key]}%</span>
          </div>
        ))}
      </section>
      <section>
        <p className="eyebrow">Little moments, kept close</p>
        <h2 className="page-heading mb-8">Core memories.</h2>
        <div className="memory-grid">
          {summary.core_memories.map((memory) => (
            <article key={`${memory.checkpoint_id}-${memory.title}`} className="memory-card">
              {memory.photo_url && <>
                {/* eslint-disable-next-line @next/next/no-img-element -- remote image host is not configured */}
                <img src={memory.photo_url} alt="" className="memory-photo" />
              </>}
              <h3>{memory.title}</h3>
              <p className="muted">{memory.place_name}{memory.date ? ` · ${memory.date}` : ''}</p>
              <p>{memory.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
