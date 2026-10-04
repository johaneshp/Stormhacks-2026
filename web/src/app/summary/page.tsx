'use client';

import { useEffect, useState } from 'react';

import { getTripSummary } from '@/api/client';
import type { TripSummary } from '@/types';

const DEMO_TRIP_ID = '761a013b-b3e7-4996-9891-30960bcbd2f0';

const DNA_LABELS: { key: keyof TripSummary['travel_dna']; label: string }[] = [
  { key: 'food', label: 'Food' },
  { key: 'sightseeing', label: 'Sightseeing' },
  { key: 'group_photo', label: 'Group photos' },
  { key: 'selfie', label: 'Selfies' },
  { key: 'street_view', label: 'Street views' },
];

export default function SummaryPage() {
  const [summary, setSummary] = useState<TripSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTripSummary(DEMO_TRIP_ID)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6 text-gray-500">Loading…</p>;
  if (!summary) {
    return <p className="p-6 text-gray-500">No trip summary yet. Upload some photos first.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <section>
        <h1 className="mb-3 text-2xl font-bold">Your Travel DNA</h1>
        <div className="space-y-2">
          {DNA_LABELS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-28 text-sm">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-gray-100">
                <div className="h-2 bg-blue-500" style={{ width: `${summary.travel_dna[key]}%` }} />
              </div>
              <span className="w-12 text-right text-sm">{summary.travel_dna[key]}%</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold">Core Memories</h2>
        <div className="space-y-4">
          {summary.core_memories.map((memory) => (
            <div key={`${memory.checkpoint_id}-${memory.title}`} className="rounded-xl bg-gray-50 p-4">
              {memory.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element -- remote, unconfigured domains
                <img src={memory.photo_url} alt="" className="mb-3 h-40 w-full rounded-lg object-cover" />
              )}
              <p className="font-bold">{memory.title}</p>
              <p className="mb-1 text-sm text-gray-500">
                {memory.place_name}
                {memory.date ? ` · ${memory.date}` : ''}
              </p>
              <p className="text-gray-800">{memory.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
