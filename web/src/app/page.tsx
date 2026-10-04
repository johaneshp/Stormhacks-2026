'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import exifr from 'exifr';
import { uploadPhotos } from '@/api/client';
import type { Checkpoint } from '@/types';

const RouteMap = dynamic(() => import('@/components/RouteMap'), { ssr: false });
const DEMO_TRIP_ID = '53f04cd9-70db-4b0e-83c6-2e4a82300346';

export default function RoutePage() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [selected, setSelected] = useState<Checkpoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const gpsResults = await Promise.all(files.map((file) => exifr.gps(file).catch(() => null)));
    const missing = gpsResults.filter((gps) => gps === null).length;
    setWarning(missing > 0 ? `${missing} of ${files.length} photo(s) have no GPS data. Upload original camera files — screenshots and re-saved/edited copies usually strip location data.` : null);
    setLoading(true);
    setError(null);
    try {
      const created = await uploadPhotos(DEMO_TRIP_ID, files);
      setCheckpoints(created.sort((a, b) => a.order_index - b.order_index));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <div className="page-shell wide">
      <p className="eyebrow">A little trip scrapbook</p>
      <h1 className="page-heading">Your journey,<br />mapped in moments.</h1>
      <p className="page-intro">Drop in your travel photos and watch the places you visited come together into a route.</p>
      <div className="stack">
        <label className="panel block">
          <span className="field-label">Start with your photos</span>
          <input type="file" accept="image/*" multiple onChange={handleFiles} className="upload-input" />
        </label>
        {loading && <p className="muted">Gathering your moments into a route…</p>}
        {error && <p className="notice" role="alert">{error}</p>}
        {warning && <p className="notice">{warning}</p>}
        <div className="map-frame"><RouteMap checkpoints={checkpoints} onSelect={setSelected} /></div>
        {checkpoints.length > 0 && <ul className="checkpoint-list">
          {checkpoints.map((c) => <li key={c.id}><button className="checkpoint-row" onClick={() => setSelected(c)}>
            <p>{c.place_name}</p><p className="muted">{c.summary}</p>
          </button></li>)}
        </ul>}
      </div>
      {selected && <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
        <div className="panel max-h-[80vh] w-full max-w-lg overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <h2 className="panel-title">{selected.place_name}</h2>
          <p className="muted">{selected.summary}</p>
          <div className="grid grid-cols-3 gap-2">
            {selected.photos.map((p) => <img key={p.id} src={p.file_url} alt="" className="aspect-square w-full rounded-lg object-cover" />)}
          </div>
          <button className="quiet-button mt-4" onClick={() => setSelected(null)}>Close</button>
        </div>
      </div>}
    </div>
  );
}
