// ─── Domain types ─────────────────────────────────────────────────────────────

import type { ExplorerDestination } from './api';
import { formatDuration } from '../lib/format';

/** Destination renvoyée par /explorer : ville (ou gare isolée) + trajet le plus court. */
export type Destination = ExplorerDestination;

export { formatDuration, formatTime } from '../lib/format';

export interface OriginCoords {
  lat: number;
  lon: number;
}

// ─── Duration color scale ─────────────────────────────────────────────────────
// L'échelle est relative à la durée maximale choisie avec le curseur de l'explorateur
// (`scaleMax`, en minutes) : cette durée est découpée en tranches égales, du vert (proche)
// au rouge (loin). Avec un curseur à 12 h : < 2h, 2h–4h, … 10h–12h.

export const DURATION_COLORS = ['#22c55e', '#84cc16', '#facc15', '#fb923c', '#f97316', '#ef4444'];

/** Index de la tranche de couleur (0 = la plus proche) ; au-delà de scaleMax, la dernière. */
export function durationBucket(minutes: number, scaleMax: number): number {
  if (scaleMax <= 0) return 0;
  const bucket = Math.ceil((minutes / scaleMax) * DURATION_COLORS.length) - 1;
  return Math.min(DURATION_COLORS.length - 1, Math.max(0, bucket));
}

export function getDurationColor(minutes: number, scaleMax: number): string {
  return DURATION_COLORS[durationBucket(minutes, scaleMax)];
}

export function getDurationLabel(minutes: number, scaleMax: number): string {
  if (minutes > scaleMax) return `> ${formatBound(scaleMax)}`;
  return durationLegend(scaleMax)[durationBucket(minutes, scaleMax)].label;
}

/** Borne d'une tranche : "2h" pour une heure ronde, sinon "1h10". */
const formatBound = (minutes: number) => (minutes % 60 === 0 ? `${minutes / 60}h` : formatDuration(minutes));

/** Tranches de la légende pour une durée maximale donnée. `upTo` : borne haute, formatée. */
export function durationLegend(scaleMax: number): { color: string; label: string; upTo: string }[] {
  const step = scaleMax / DURATION_COLORS.length;
  return DURATION_COLORS.map((color, i) => ({
    color,
    label: i === 0 ? `< ${formatBound(step)}` : `${formatBound(i * step)}–${formatBound((i + 1) * step)}`,
    upTo: formatBound((i + 1) * step),
  }));
}

/** Heures entières : "12 h" plutôt que "12h00" (valeur du curseur). */
export function formatHours(minutes: number): string {
  return `${Math.round(minutes / 60)} h`;
}

/**
 * Durée maximale proposée par défaut : couvre 90 % des destinations, arrondie à l'heure.
 * Les quelques trajets de plus de 24 h n'écrasent ainsi pas l'échelle de couleurs.
 */
export function defaultMaxDuration(destinations: Destination[]): number {
  if (destinations.length === 0) return 0;
  const sorted = destinations.map((d) => d.duration_min).sort((a, b) => a - b);
  const p90 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))];
  return Math.max(60, Math.ceil(p90 / 60) * 60);
}

/** Borne haute du curseur : la plus longue durée, arrondie à l'heure supérieure. */
export function maxDurationLimit(destinations: Destination[]): number {
  const longest = destinations.reduce((m, d) => Math.max(m, d.duration_min), 0);
  return Math.ceil(longest / 60) * 60;
}
