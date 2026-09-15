// ─── Domain types ─────────────────────────────────────────────────────────────

import type { ExplorerDestination } from './api';

/** Destination renvoyée par /explorer : ville (ou gare isolée) + trajet le plus court. */
export type Destination = ExplorerDestination;

export { formatDuration, formatTime } from '../lib/format';

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

// ─── Legend items (static, used by MapLegend) ─────────────────────────────────

export const LEGEND_ITEMS: { color: string; label: string }[] = [
  { color: '#22c55e', label: '< 30 min' },
  { color: '#84cc16', label: '30–60 min' },
  { color: '#facc15', label: '1h–2h' },
  { color: '#fb923c', label: '2h–3h' },
  { color: '#f97316', label: '3h–5h' },
  { color: '#ef4444', label: '> 5h' },
];