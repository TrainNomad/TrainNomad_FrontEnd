// Tracés des trains sur les voies ferrées (OpenStreetMap), calculés par Backend/gtfs/traces/build_traces.py
// et copiés dans public/traces/ : un fichier par gare, avec les tracés vers ses gares voisines d'identifiant
// supérieur. Entre deux arrêts il peut y avoir deux variantes (ligne à grande vitesse / ligne classique) :
// on retient la plus concordante avec l'horaire. Sans tracé (pays non couvert, car…), trait droit.
import type { StopTime, TrainLeg } from '../types/api';

export type LatLng = [number, number];

/** Pays dont les tracés sont dans public/traces/ (ailleurs, aucun fichier à demander). */
export const TRACED_COUNTRIES = new Set(['AT', 'BE', 'CH', 'CZ', 'DE', 'DK', 'ES', 'FR', 'GB', 'IT', 'LU', 'NL', 'PL', 'PT']);

interface Variant {
  km: number;
  km_lgv: number;
  /** Temps de parcours minimal théorique, à la vitesse maximale des voies */
  min: number;
  /** « Encoded polyline », précision 5 */
  pts: string;
}

/** { gare d'arrivée: { variante: tracé } } */
type StationTraces = Record<string, Record<string, Variant>>;

/** Un horaire arrondi à la minute peut être 2 % sous le temps théorique (comme build_traces.py). */
const SCHEDULE_TOLERANCE = 1.02;
/** Un train met au moins 15 % de plus que le temps théorique à vitesse maximale (comme build_traces.py). */
const MIN_OVERHEAD = 1.15;

const cache = new Map<string, Promise<StationTraces>>();

/** "station:8814001" -> "TN8814001" (identifiant de la gare dans le référentiel). */
function gareId(stopId: string): string {
  const id = stopId.replace(/^station:/, '');
  return /^\d+$/.test(id) ? `TN${id}` : id;
}

function loadStation(id: string): Promise<StationTraces> {
  let pending = cache.get(id);
  if (!pending) {
    pending = fetch(`/traces/${encodeURIComponent(id)}.json`)
      .then((res) => {
        // Fichier absent : l'hébergeur renvoie la page d'accueil (HTML) avec un code 200
        const isJson = (res.headers.get('content-type') || '').includes('json');
        return res.ok && isJson ? (res.json() as Promise<StationTraces>) : {};
      })
      .catch(() => ({}));
    cache.set(id, pending);
  }
  return pending;
}

export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let i = 0;
  let lat = 0;
  let lon = 0;
  while (i < encoded.length) {
    for (const axis of [0, 1]) {
      let result = 0;
      let shift = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(i++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += delta;
      else lon += delta;
    }
    points.push([lat / 1e5, lon / 1e5]);
  }
  return points;
}

/** Parmi les variantes réalisables dans la durée de l'horaire, la plus proche ; sinon la plus rapide. */
function pickVariant(variants: Record<string, Variant>, durationMin: number): Variant | null {
  const all = Object.values(variants);
  if (all.length === 0) return null;
  const feasible = all.filter((v) => v.min * MIN_OVERHEAD <= durationMin * SCHEDULE_TOLERANCE);
  if (feasible.length > 0) return feasible.reduce((a, b) => (b.min > a.min ? b : a));
  return all.reduce((a, b) => (b.min < a.min ? b : a));
}

const minutesBetween = (from?: string, to?: string) =>
  from && to ? (new Date(to).getTime() - new Date(from).getTime()) / 60000 : Infinity;

/** Variante retenue entre deux arrêts consécutifs d'un train, et sens de parcours du tracé ; null sans tracé. */
async function variantBetween(a: StopTime, b: StopTime): Promise<{ variant: Variant; forward: boolean } | null> {
  if (!TRACED_COUNTRIES.has(a.country) || !TRACED_COUNTRIES.has(b.country)) return null;
  const ida = gareId(a.id);
  const idb = gareId(b.id);
  const [first, second] = ida < idb ? [ida, idb] : [idb, ida];
  const variants = (await loadStation(first))[second];
  if (!variants) return null;
  const variant = pickVariant(variants, minutesBetween(a.departure ?? a.arrival, b.arrival ?? b.departure));
  return variant && { variant, forward: ida < idb };
}

/** Tracé entre deux arrêts consécutifs d'un train, ou null (trait droit). */
async function segment(a: StopTime, b: StopTime): Promise<LatLng[] | null> {
  const found = await variantBetween(a, b);
  if (!found) return null;
  const points = decodePolyline(found.variant.pts);
  return found.forward ? points : points.reverse();
}

/** Longueur sur les voies (km) entre deux arrêts consécutifs d'un train, ou null sans tracé. */
export async function segmentKm(a: StopTime, b: StopTime): Promise<number | null> {
  return (await variantBetween(a, b))?.variant.km ?? null;
}

export interface LegPath {
  points: LatLng[];
  /** Arrêts placés sur la ligne (ceux qui ont des coordonnées) et position de chacun dans `points` */
  stops: StopTime[];
  stopIndex: number[];
  /** Nombre de tronçons entre arrêts tracés sur les voies, sur le total */
  traced: number;
  total: number;
}

/** Ligne d'un train par tous ses arrêts : sur les voies là où un tracé existe, en trait droit sinon. */
export async function legPath(leg: TrainLeg): Promise<LegPath> {
  const stops = leg.stops.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon) && (s.lat !== 0 || s.lon !== 0));
  const segments = await Promise.all(stops.slice(1).map((stop, i) => segment(stops[i], stop)));
  const points: LatLng[] = [];
  const stopIndex: number[] = [];
  stops.forEach((stop, i) => {
    stopIndex.push(points.length);
    points.push([stop.lat, stop.lon]);
    const seg = segments[i];
    if (seg) points.push(...seg);
  });
  return { points, stops, stopIndex, traced: segments.filter(Boolean).length, total: segments.length };
}
