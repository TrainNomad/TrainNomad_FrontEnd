// Pages par liaison (/train/paris-londres/) : les trains d'une journée type entre deux villes, résumés
// (trajet le plus rapide, trains directs, premier et dernier départ, types de train).
// Module commun au navigateur et aux scripts de build (scripts/seo-pages.mjs, prerender.mjs, lancés avec
// node --experimental-strip-types) : les modules importés le sont avec leur extension .ts, et seulement s'ils
// n'importent rien eux-mêmes.
import type { Journey, SearchResponse } from '../types/api';
import { formatDuration } from './format.ts';

/** Un train d'un trajet, sans la liste de ses arrêts. */
export interface LiaisonTrain {
  type: string;
  number: string;
  operator: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
}

export interface LiaisonJourney {
  id: string;
  departure: string;
  arrival: string;
  duration_min: number;
  transfers: number;
  trains: LiaisonTrain[];
}

export interface LiaisonSummary {
  /** Durée du trajet le plus rapide de la journée */
  fastest_min: number;
  /** Nombre minimal de correspondances */
  min_transfers: number;
  /** Trajets sans correspondance dans la journée */
  direct: number;
  /** Trajets proposés dans la journée */
  count: number;
  /** Premier et dernier départ ("HH:MM") */
  first: string;
  last: string;
  /** Types de train (« Eurostar », « SNCF TGV INOUI »), des plus présents aux moins présents */
  train_types: string[];
}

/** Fichier public/liaisons/<slug>.json : la journée type d'une liaison. */
export interface LiaisonDay {
  /** Journée relevée ("AAAA-MM-JJ") */
  date: string;
  /** Date du relevé (ISO) */
  built_at: string;
  journeys: LiaisonJourney[];
  /** Trajet le plus rapide, complet (arrêts compris) : estimation du CO₂ */
  fastest: Journey | null;
}

/** Au-delà, la page recalcule la journée type dans le navigateur au lieu d'afficher le relevé du build. */
export const LIAISON_MAX_AGE_DAYS = 7;

/**
 * Journée type : le premier mardi au moins 7 jours après `from` (horaires de semaine, loin des
 * modifications de dernière minute). Format "AAAA-MM-JJ".
 */
export function typicalDay(from: Date): string {
  const d = new Date(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate() + 7));
  d.setUTCDate(d.getUTCDate() + ((2 - d.getUTCDay() + 7) % 7));
  return d.toISOString().slice(0, 10);
}

/** Tous les trajets d'une journée, page après page (l'API en renvoie au plus `limit` à la fois). */
export async function fetchDay(apiUrl: string, from: string, to: string, date: string, signal?: AbortSignal): Promise<Journey[]> {
  const byId = new Map<string, Journey>();
  let time = '00:00';
  // 8 pages suffisent pour une journée (Madrid → Barcelone : 32 trajets en une page de 50)
  for (let page = 0; page < 8; page++) {
    const query = new URLSearchParams({ from, to, date, time, limit: '50' });
    const res = await fetch(`${apiUrl}/search?${query}`, { signal });
    if (!res.ok) throw new Error(`/search ${from} → ${to} : HTTP ${res.status}`);
    const data = (await res.json()) as SearchResponse;
    const before = byId.size;
    for (const j of data.journeys) if (j.departure.slice(0, 10) === date) byId.set(j.id, j);
    if (!data.next || data.next.date !== date || data.next.time <= time || byId.size === before) break;
    time = data.next.time;
  }
  // Une nuit en gare n'est pas un trajet qu'on propose comme référence
  return [...byId.values()].filter((j) => !j.long_wait).sort((a, b) => a.departure.localeCompare(b.departure));
}

export function compactJourney(j: Journey): LiaisonJourney {
  return {
    id: j.id,
    departure: j.departure,
    arrival: j.arrival,
    duration_min: j.duration_min,
    transfers: j.transfers,
    trains: j.legs.flatMap((leg) =>
      leg.type === 'train'
        ? [{
            type: leg.train_type,
            number: leg.train_number,
            operator: leg.operator,
            from: leg.from.name,
            to: leg.to.name,
            departure: leg.departure,
            arrival: leg.arrival,
          }]
        : [],
    ),
  };
}

/** La journée type complète, prête à enregistrer ou à afficher. */
export function liaisonDay(journeys: Journey[], date: string, builtAt: string): LiaisonDay {
  const fastest = journeys.reduce<Journey | null>((best, j) => (!best || j.duration_min < best.duration_min ? j : best), null);
  return { date, built_at: builtAt, journeys: journeys.map(compactJourney), fastest };
}

/** Résumé d'une journée, ou null s'il n'y a aucun trajet. */
export function summarize(journeys: LiaisonJourney[]): LiaisonSummary | null {
  if (!journeys.length) return null;
  const count = new Map<string, number>();
  for (const j of journeys) for (const t of new Set(j.trains.map((t) => t.type))) count.set(t, (count.get(t) ?? 0) + 1);
  const hhmm = (iso: string) => iso.slice(11, 16);
  const departures = journeys.map((j) => hhmm(j.departure)).sort();
  return {
    fastest_min: Math.min(...journeys.map((j) => j.duration_min)),
    min_transfers: Math.min(...journeys.map((j) => j.transfers)),
    direct: journeys.filter((j) => j.transfers === 0).length,
    count: journeys.length,
    first: departures[0],
    last: departures[departures.length - 1],
    train_types: [...count.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name),
  };
}

/** « 14 trains directs par jour », « avec une correspondance » */
export function liaisonHow(s: LiaisonSummary): string {
  if (s.direct > 1) return `${s.direct} trains directs par jour`;
  if (s.direct === 1) return '1 train direct par jour';
  return s.min_transfers === 1 ? 'avec une correspondance' : `avec ${s.min_transfers} correspondances`;
}

/** Description de la page d'une liaison (balise meta et page générée pour les moteurs de recherche). */
export function liaisonDescription(from: string, to: string, s: LiaisonSummary): string {
  return (
    `${from} → ${to} en train : ${formatDuration(s.fastest_min)} au plus rapide, ${liaisonHow(s)}, ` +
    `premier départ à ${s.first.replace(':', 'h')}. Horaires d'une journée type, correspondances et empreinte carbone.`
  );
}

/** "Saint-Malo" -> "saint-malo", "Édimbourg" -> "edimbourg" */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
