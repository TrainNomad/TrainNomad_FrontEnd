// Pages « TGVmax depuis une ville » (/tgvmax/depuis/lyon/) : les destinations directes où il reste des places MAX
// dans les prochains jours, d'après l'exploration jour par jour de l'API TGVmax. Directes seulement : avec une
// correspondance, presque toutes les villes du réseau sont atteignables et la liste ne dit plus rien.
// Module commun au navigateur (calcul en direct, les places changent chaque matin) et au script de build
// scripts/seo-pages.mjs (relevé pour les moteurs de recherche) : aucune importation de valeur.
import type { ExplorerResponse } from '../types/api';

export interface MaxDestination {
  id: string;
  name: string;
  country: string;
  /** Jours avec au moins une place MAX ("AAAA-MM-JJ"), dans l'ordre */
  dates: string[];
  /** Trajet le plus court relevé sur ces jours */
  min_duration: number;
}

/** Fichier public/tgvmax-depuis/<slug>.json, et résultat du calcul en direct. */
export interface MaxFrom {
  built_at: string;
  /** Jours explorés, à partir de `start` */
  start: string;
  days: number;
  destinations: MaxDestination[];
}

export const MAX_DAYS = 30;

/** "2026-10-29" + 3 -> "2026-11-01" */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Explore les `days` jours à partir de `start` (6 requêtes à la fois) et regroupe les destinations.
 * Un jour en erreur est ignoré ; `onProgress` reçoit le nombre de jours traités.
 */
export async function fetchMaxFrom(
  apiUrl: string,
  from: string,
  start: string,
  days = MAX_DAYS,
  options: { signal?: AbortSignal; onProgress?: (done: number) => void } = {},
): Promise<MaxFrom> {
  const byId = new Map<string, MaxDestination>();
  const dates = Array.from({ length: days }, (_, i) => addDays(start, i));
  let done = 0;
  const explore = async (date: string) => {
    try {
      const res = await fetch(`${apiUrl}/explorer?${new URLSearchParams({ from, date, max_transfers: '0' })}`, { signal: options.signal });
      if (!res.ok) return;
      const data = (await res.json()) as ExplorerResponse;
      for (const d of data.destinations) {
        const dest = byId.get(d.place.id) ?? {
          id: d.place.id,
          name: d.place.name,
          country: d.place.country,
          dates: [],
          min_duration: d.duration_min,
        };
        dest.dates.push(date);
        dest.min_duration = Math.min(dest.min_duration, d.duration_min);
        byId.set(d.place.id, dest);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
    } finally {
      options.onProgress?.(++done);
    }
  };
  for (let i = 0; i < dates.length; i += 6) await Promise.all(dates.slice(i, i + 6).map(explore));
  const destinations = [...byId.values()];
  for (const d of destinations) d.dates.sort();
  // Les destinations les plus souvent disponibles d'abord, puis les plus proches
  destinations.sort((a, b) => b.dates.length - a.dates.length || a.min_duration - b.min_duration);
  return { built_at: new Date().toISOString(), start, days, destinations };
}
