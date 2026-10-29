// Estimation des émissions de CO₂e d'un trajet, comparées à la voiture ou, sur les longues distances, à l'avion.
//
// Facteurs d'émission (g CO₂e par voyageur-km) : src/lib/carbonFactors.json, mis à jour une fois par an par
// scripts/update-carbon-factors.py (sources, méthode et dates dans ce script). Toujours avec le mix électrique du
// pays, périmètre exploitation (énergie consommée par les trains), du plus précis au plus général :
//   1. par type de train : compagnies britanniques (ORR), catégories SNCF, Eurostar ;
//   2. par pays et catégorie : France (SNCF), Allemagne (UBA), Royaume-Uni (moyenne ORR) ;
//   3. ailleurs : énergie de traction par voyageur-km × intensité carbone de l'électricité du pays (Ember).
// Distance : longueur sur les voies entre deux arrêts quand le tracé existe (public/traces/), sinon vol d'oiseau majoré.
import type { Journey, StopTime } from '../types/api';
import { isTrainLeg } from '../types/api';
import factors from './carbonFactors.json';
import { segmentKm } from './traces';

type SourceId = keyof typeof factors.sources;
type Category = 'highSpeed' | 'longDistance' | 'regional';
interface Factor {
  g: number;
  sources: SourceId[];
}

/** Distance directe (km) à partir de laquelle le trajet est comparé à l'avion plutôt qu'à la voiture. */
const PLANE_FROM_KM = 700;

// Sans tracé, la distance à vol d'oiseau est majorée : 1,15 est l'écart moyen mesuré sur les tracés de public/traces/
// (longueur sur les voies / vol d'oiseau, pondérée par la distance). Route : la voiture ne va pas tout droit non plus.
const RAIL_DETOUR = 1.15;
const ROAD_DETOUR = 1.2;

const COACH = /\b(car|bus|autocar)\b/i;
const HIGH_SPEED = /tgv|ouigo|eurostar|thalys|lyria|\bice\b|db sncf|railjet|\bave\b|avlo|alvia|avant|euromed|freccia|italo|alfa pendular/i;
const REGIONAL = /\bter\b|r[eé]gional|proximidad|media distancia|s-bahn|urbano|metropolitano|tram|navette|\bsfm\b|metropolexpress/i;

const trainTypes: Record<string, { g: number; source: string } | undefined> = factors.trainTypes;
const countries: Record<string, Record<Category, number> & { source: string } | undefined> = factors.countries;
const grid: Record<string, number | undefined> = factors.model.gridIntensity;

function category(trainType: string): Category {
  if (HIGH_SPEED.test(trainType)) return 'highSpeed';
  if (REGIONAL.test(trainType)) return 'regional';
  return 'longDistance';
}

/** Facteur d'un train sur un tronçon situé dans `country`. */
function factorFor(trainType: string, country: string): Factor {
  if (COACH.test(trainType)) return { g: factors.coach.g, sources: [factors.coach.source as SourceId] };
  const byType = trainTypes[trainType];
  if (byType) return { g: byType.g, sources: [byType.source as SourceId] };
  const byCountry = countries[country];
  if (byCountry) return { g: byCountry[category(trainType)], sources: [byCountry.source as SourceId] };
  // Pays sans donnée publiée : modèle, avec la moyenne de l'Union européenne pour un pays absent d'Ember
  const intensity = grid[country] ?? grid.EU ?? 0;
  return { g: factors.model.kwhPerPkm * intensity, sources: ['ember', 'sbb'] };
}

/** Distance à vol d'oiseau entre deux points, en kilomètres. */
function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Tronçons d'arrêt en arrêt de chaque train emprunté (`train` : rang du train dans le trajet). */
function segments(journey: Journey): { a: StopTime; b: StopTime; trainType: string; train: number }[] {
  return journey.legs.filter(isTrainLeg).flatMap((leg, train) => {
    const stops: StopTime[] =
      leg.stops?.length >= 2 ? leg.stops : [{ ...leg.from, departure: leg.departure }, { ...leg.to, arrival: leg.arrival }];
    return stops.slice(1).map((b, i) => ({ a: stops[i], b, trainType: leg.train_type, train }));
  });
}

/** « Office of Rail and Road 2024-25 », « SNCF Voyageurs 2025 » */
function sourceLabel(id: SourceId): string {
  const s = factors.sources[id];
  return `${s.label} ${/^\d{4}-\d{2}-\d{2}$/.test(s.period) ? s.period.slice(0, 4) : s.period}`;
}

export interface CarbonEstimate {
  /** kg CO₂e du trajet en train */
  trainKg: number;
  /** Mode de comparaison : voiture thermique avec une personne à bord, ou avion au-delà de 700 km */
  other: 'car' | 'plane';
  /** kg CO₂e du même déplacement avec ce mode */
  otherKg: number;
  /** Part de la distance en train mesurée sur les voies (0 à 1), le reste à vol d'oiseau majoré */
  onTracks: number;
  /** Détail par train emprunté : compagnie ou type de train, émissions et source de son facteur */
  trains: { name: string; kg: number; sources: string[] }[];
  /** Source des facteurs de la voiture et de l'avion */
  comparisonSource: string;
}

function estimate(journey: Journey, trackKm: (number | null)[]): CarbonEstimate | null {
  let km = 0;
  let measuredKm = 0;
  const trains: { name: string; kg: number; sources: Set<SourceId> }[] = [];
  segments(journey).forEach(({ a, b, trainType, train }, i) => {
    const measured = trackKm[i];
    const d = measured ?? distanceKm(a, b) * RAIL_DETOUR;
    const factor = factorFor(trainType, a.country);
    trains[train] ??= { name: trainType, kg: 0, sources: new Set() };
    trains[train].kg += (d * factor.g) / 1000;
    factor.sources.forEach((s) => trains[train].sources.add(s));
    km += d;
    if (measured != null) measuredKm += d;
  });
  const trainKg = trains.reduce((sum, t) => sum + t.kg, 0);
  const direct = distanceKm(journey.from, journey.to);
  if (!(trainKg > 0) || !(direct > 0)) return null;
  const base = {
    trainKg,
    onTracks: measuredKm / km,
    trains: trains.filter(Boolean).map((t) => ({ name: t.name, kg: t.kg, sources: [...t.sources].map(sourceLabel) })),
    comparisonSource: sourceLabel(factors.comparison.source as SourceId),
  };
  if (direct >= PLANE_FROM_KM) return { ...base, other: 'plane', otherKg: (direct * factors.comparison.plane) / 1000 };
  return { ...base, other: 'car', otherKg: (direct * ROAD_DETOUR * factors.comparison.car) / 1000 };
}

/**
 * Estimation immédiate, à vol d'oiseau majoré. Train : facteur de chaque tronçon selon le type de train et le pays.
 * Voiture : distance directe majorée pour la route. Avion : distance directe.
 */
export function estimateCarbon(journey: Journey): CarbonEstimate | null {
  return estimate(journey, []);
}

/** Même estimation avec la longueur sur les voies des tronçons tracés (chargement des tracés des gares). */
export async function estimateCarbonOnTracks(journey: Journey): Promise<CarbonEstimate | null> {
  const trackKm = await Promise.all(segments(journey).map(({ a, b }) => segmentKm(a, b)));
  return estimate(journey, trackKm);
}

/** 0.04 -> "< 0,1 kg", 2.93 -> "2,9 kg", 81.4 -> "81 kg" */
export function formatKg(kg: number): string {
  if (kg < 0.05) return '< 0,1 kg';
  return `${kg.toLocaleString('fr-FR', { maximumFractionDigits: kg < 10 ? 1 : 0 })} kg`;
}
