'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import exifr from 'exifr';

import { uploadPhotos } from '@/api/client';
import type { Checkpoint } from '@/types';

const RouteMap = dynamic(() => import('@/components/RouteMap'), { ssr: false });

// TODO: replace with a real trip id once trip creation is wired into the flow.
const DEMO_TRIP_ID = 'demo-trip';

export default function RoutePage() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [selected, setSelected] = useState<Checkpoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const gpsResults = await Promise.all(files.map((file) => exifr.gps(file).catch(() => null)));
    const missing = gpsResults.filter((gps) => gps === null).length;
    setWarning(
      missing > 0
        ? `${missing} of ${files.length} photo(s) have no GPS data. Upload original camera files — screenshots and re-saved/edited copies usually strip location data.`
        : null,
    );

    setLoading(true);
    try {
      const created = await uploadPhotos(DEMO_TRIP_ID, files);
      setCheckpoints(created.sort((a, b) => a.order_index - b.order_index));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Route &amp; Checkpoints</h1>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Upload trip photos</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
        />
      </label>

      {loading && <p className="text-sm text-gray-500">Uploading &amp; clustering into checkpoints…</p>}
      {warning && <p className="text-sm text-amber-600">{warning}</p>}

      <RouteMap checkpoints={checkpoints} onSelect={setSelected} />

      <ul className="divide-y rounded border">
        {checkpoints.map((c) => (
          <li key={c.id} className="cursor-pointer p-3 hover:bg-gray-50" onClick={() => setSelected(c)}>
            <p className="font-semibold">{c.place_name}</p>
            <p className="truncate text-sm text-gray-600">{c.summary}</p>
          </li>
        ))}
      </ul>

      {selected && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold">{selected.place_name}</h2>
            <p className="mb-3 text-gray-600">{selected.summary}</p>
            <div className="grid grid-cols-3 gap-1">
              {selected.photos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element -- remote, unconfigured domains
                <img key={p.id} src={p.file_url} alt="" className="aspect-square w-full object-cover" />
              ))}
            </div>
            <button
              className="mt-3 rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
