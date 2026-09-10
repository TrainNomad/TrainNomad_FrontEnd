// ─── Domain types ─────────────────────────────────────────────────────────────

export interface Destination {
  dest_name: string;
  dest_lat: number;
  dest_lon: number;
  duration: number; // minutes
  train1_dep: string;
  train2_arr: string;
  transfers: number;
  train1_no: string;
  train1_type: string;
  co2?: number;
  price_min?: number;
}

export interface OriginCoords {
  lat: number;
  lon: number;
}

// ─── Duration color scale ─────────────────────────────────────────────────────
//   ≤ 30 min  → vert vif
//   ≤ 1h      → vert-jaune
//   ≤ 2h      → jaune
//   ≤ 3h      → orange
//   ≤ 5h      → orange foncé
//   > 5h      → rouge

export function getDurationColor(minutes: number): string {
  if (minutes <= 30)  return '#22c55e';
  if (minutes <= 60)  return '#84cc16';
  if (minutes <= 120) return '#facc15';
  if (minutes <= 180) return '#fb923c';
  if (minutes <= 300) return '#f97316';
  return '#ef4444';
}

export function getDurationLabel(minutes: number): string {
  if (minutes <= 30)  return '< 30 min';
  if (minutes <= 60)  return '30–60 min';
  if (minutes <= 120) return '1h–2h';
  if (minutes <= 180) return '2h–3h';
  if (minutes <= 300) return '3h–5h';
  return '> 5h';
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m} min`;
}

export function formatTime(t: string): string {
  return t ? t.slice(0, 5) : '';
}

// ─── Legend items (static, used by MapLegend) ─────────────────────────────────

export const LEGEND_ITEMS: { color: string; label: string }[] = [
  { color: '#22c55e', label: '< 30 min' },
  { color: '#84cc16', label: '30–60 min' },
  { color: '#facc15', label: '1h–2h' },
  { color: '#fb923c', label: '2h–3h' },
  { color: '#f97316', label: '3h–5h' },
  { color: '#ef4444', label: '> 5h' },
];