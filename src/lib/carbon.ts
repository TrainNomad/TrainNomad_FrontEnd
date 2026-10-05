// Estimation des émissions de CO₂e d'un trajet, comparées à la voiture ou, sur les longues distances, à l'avion.
//
// Facteurs d'émission : ADEME, via l'API Impact CO2 (https://impactco2.fr/api/v1/transport,
// construction des véhicules et des infrastructures incluse), relevés en octobre 2026.
// Ce sont des valeurs fixes par kilomètre : elles sont recopiées ici plutôt que demandées à l'API
// à chaque recherche (aucun appel à un tiers, aucun délai). À relever de temps en temps.
// Ces facteurs décrivent les trains français ; ils sont appliqués par catégorie aux trains des autres pays.
import type { Journey, StopRef } from '../types/api';
import { isTrainLeg } from '../types/api';

/** kg CO₂e par kilomètre et par voyageur */
const FACTORS = {
  highSpeed: 0.00293, // TGV
  longDistance: 0.00898, // Intercités
  regional: 0.02769, // TER
  coach: 0.03756, // Autocar thermique
  car: 0.14225, // Voiture thermique, une personne à bord
  planeShort: 0.22457, // Avion trajet court (moins de 1 000 km), effet des traînées compris
  planeMedium: 0.18466, // Avion trajet moyen
};

/** Distance directe (km) à partir de laquelle le trajet est comparé à l'avion plutôt qu'à la voiture. */
const PLANE_FROM_KM = 700;
/** Limite du « trajet court » de l'ADEME pour l'avion. */
const PLANE_SHORT_MAX_KM = 1000;

// Les distances sont calculées à vol d'oiseau, puis majorées : la voie ferrée et la route ne vont pas tout droit.
// Réglage vérifié sur Paris → Marseille (environ 750 km en train, 775 km par la route).
const RAIL_DETOUR = 1.1;
const ROAD_DETOUR = 1.2;

const COACH = /\b(car|bus|autocar)\b/i;
const HIGH_SPEED = /tgv|ouigo|eurostar|thalys|lyria|\bice\b|\bave\b|avlo|alvia|avant|euromed|freccia|italo|alfa pendular/i;
const REGIONAL = /\bter\b|r[eé]gional|proximidad|media distancia|s-bahn|urbano|metropolitano|tram|navette|\bsfm\b/i;

function factorFor(trainType: string): number {
  if (COACH.test(trainType)) return FACTORS.coach;
  if (HIGH_SPEED.test(trainType)) return FACTORS.highSpeed;
  if (REGIONAL.test(trainType)) return FACTORS.regional;
  return FACTORS.longDistance;
}

/** Distance à vol d'oiseau entre deux points, en kilomètres. */
function distanceKm(a: StopRef, b: StopRef): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export interface CarbonEstimate {
  /** kg CO₂e du trajet en train */
  trainKg: number;
  /** Mode de comparaison : voiture thermique avec une personne à bord, ou avion au-delà de 700 km */
  other: 'car' | 'plane';
  /** kg CO₂e du même déplacement avec ce mode */
  otherKg: number;
}

/**
 * Train : distance cumulée d'arrêt en arrêt sur chaque train emprunté (majorée pour le tracé de la voie),
 * multipliée par le facteur de sa catégorie.
 * Voiture : distance directe entre le départ et l'arrivée, majorée pour la route.
 * Avion : distance directe.
 */
export function estimateCarbon(journey: Journey): CarbonEstimate | null {
  let trainKg = 0;
  for (const leg of journey.legs) {
    if (!isTrainLeg(leg)) continue;
    const stops: StopRef[] = leg.stops?.length >= 2 ? leg.stops : [leg.from, leg.to];
    let km = 0;
    for (let i = 1; i < stops.length; i++) km += distanceKm(stops[i - 1], stops[i]);
    trainKg += km * RAIL_DETOUR * factorFor(leg.train_type);
  }
  const direct = distanceKm(journey.from, journey.to);
  if (!(trainKg > 0) || !(direct > 0)) return null;
  if (direct >= PLANE_FROM_KM) {
    const factor = direct < PLANE_SHORT_MAX_KM ? FACTORS.planeShort : FACTORS.planeMedium;
    return { trainKg, other: 'plane', otherKg: direct * factor };
  }
  return { trainKg, other: 'car', otherKg: direct * ROAD_DETOUR * FACTORS.car };
}

/** 2.93 -> "2,9 kg", 81.4 -> "81 kg" */
export function formatKg(kg: number): string {
  return `${kg.toLocaleString('fr-FR', { maximumFractionDigits: kg < 10 ? 1 : 0 })} kg`;
}
