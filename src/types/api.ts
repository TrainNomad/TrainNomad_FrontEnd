// Types des réponses de l'API de routage (voir Backend/Europe/API.md).
// Les heures sont des chaînes ISO 8601 en heure locale de la gare, avec décalage :
// "2026-09-17T09:31:00+01:00".

export type PlaceType = 'city' | 'station';

/** Ville (toutes ses gares) ou gare, renvoyée par /stations et utilisée en origine / destination. */
export interface Place {
  type: PlaceType;
  /** "city:TL4916" ou "station:8727100" : à renvoyer tel quel à /search et /explorer */
  id: string;
  name: string;
  /** Ville de rattachement (gares uniquement) */
  city?: string;
  country: string;
  lat: number;
  lon: number;
  /** Nombre de gares (villes uniquement) */
  stations?: number;
}

export interface StopRef {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export interface StopTime extends StopRef {
  arrival?: string;
  departure?: string;
}

export interface TrainLeg {
  type: 'train';
  from: StopRef;
  to: StopRef;
  departure: string;
  arrival: string;
  duration_min: number;
  operator: string;
  operator_name: string;
  train_type: string;
  train_number: string;
  headsign: string;
  /** Fermeture de l'enregistrement avant le départ (Eurostar vers/depuis Londres) */
  checkin_min?: number;
  /** Tous les arrêts, de la montée à la descente incluses */
  stops: StopTime[];
}

/** same_station : changement de quai · walk : gares proches à pied · city : traversée de ville */
export type TransferKind = 'same_station' | 'walk' | 'city';

export interface TransferLeg {
  type: 'transfer';
  from: StopRef;
  to: StopRef;
  duration_min: number;
  transfer_kind: TransferKind;
  min_transfer_min?: number;
  /** Temps total entre l'arrivée et le départ suivant */
  wait_min?: number;
}

export type Leg = TrainLeg | TransferLeg;

export interface Journey {
  id: string;
  departure: string;
  arrival: string;
  duration_min: number;
  transfers: number;
  from: StopRef;
  to: StopRef;
  operators: string[];
  train_types: string[];
  legs: Leg[];
}

export interface SearchResponse {
  from: Place;
  to: Place;
  date: string;
  time: string;
  count: number;
  /** Paramètres à renvoyer pour obtenir les trajets suivants */
  next: { date: string; time: string } | null;
  compute_ms: number;
  journeys: Journey[];
}

export interface ExplorerDestination {
  place: Place;
  duration_min: number;
  transfers: number;
  departure: string;
  arrival: string;
  direct: { duration_min: number; departure: string; arrival: string } | null;
}

export interface ExplorerResponse {
  from: Place;
  date: string;
  time: string;
  max_transfers: number;
  count: number;
  compute_ms: number;
  destinations: ExplorerDestination[];
}

export interface ApiErrorBody {
  error: string;
  detail?: string;
}

export const isTrainLeg = (leg: Leg): leg is TrainLeg => leg.type === 'train';
