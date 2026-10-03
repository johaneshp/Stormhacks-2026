'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';

import type { Checkpoint } from '@/types';

// Default Leaflet marker icons reference image paths that don't survive bundling;
// point them at a CDN instead so markers render at all.
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function RouteMap({
  checkpoints,
  onSelect,
}: {
  checkpoints: Checkpoint[];
  onSelect: (checkpoint: Checkpoint) => void;
}) {
  if (checkpoints.length === 0) return null;

  const positions = checkpoints.map((c) => [c.lat, c.lon] as [number, number]);

  return (
    <MapContainer center={positions[0]} zoom={13} style={{ height: 320, width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Polyline positions={positions} />
      {checkpoints.map((c) => (
        <Marker key={c.id} position={[c.lat, c.lon]} eventHandlers={{ click: () => onSelect(c) }}>
          <Popup>{c.place_name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
