// Types des réponses de l'API de routage (voir Backend/Europe/API.md).
// Les heures sont des chaînes ISO 8601 en heure locale de la gare, avec décalage :
// "2026-09-17T09:31:00+01:00".

export type PlaceType = 'city' | 'station';

/** Ville (toutes ses gares) ou gare, renvoyée par /stations et utilisée en origine / destination. */
export interface Place {
  type: PlaceType;
  /** "city:Q90" ou "station:8727100" : à renvoyer tel quel à /search et /explorer */
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
  /** Temps réel (API Europe, SNCF) : heures réelles, arrêt non desservi */
  real_arrival?: string;
  real_departure?: string;
  skipped?: boolean;
}

/**
 * Temps réel d'un train (API Europe avec REALTIME_SNCF=1). Absent : pas d'information (autre compagnie, train qui ne
 * circule pas encore : la SNCF publie un train environ 1 h avant son départ).
 */
export interface LegRealtime {
  status: 'on_time' | 'delayed' | 'cancelled' | 'stop_skipped';
  departure?: string;
  arrival?: string;
  delay_departure_min: number;
  delay_arrival_min: number;
  messages?: string[];
}

export interface JourneyRealtime {
  status: 'on_time' | 'delayed' | 'connection_at_risk' | 'disrupted';
  departure?: string;
  arrival?: string;
  delay_departure_min: number;
  delay_arrival_min: number;
}

/** État du temps réel côté API (`realtime` de /search, /realtime et /health) */
export interface RealtimeInfo {
  operators: string[];
  updated?: string;
  fresh?: boolean;
  trains?: number;
  error?: string;
}

/** GET /realtime?trains=SNCF:8593:2026-11-07,… : état de trains enregistrés */
export interface RealtimeTrain {
  operator: string;
  train_number: string;
  date: string;
  status: 'unknown' | 'on_time' | 'delayed' | 'cancelled';
  delay_max_min: number;
  messages?: string[];
  stops?: {
    station: StopRef;
    scheduled_arrival?: string;
    real_arrival?: string;
    scheduled_departure?: string;
    real_departure?: string;
    delay_min: number;
    skipped?: boolean;
    /** Position dans le trajet (Eurostar : arrêts sans gare ni heure) */
    sequence?: number;
  }[];
}

export interface RealtimeResponse {
  realtime: RealtimeInfo;
  trains: RealtimeTrain[];
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
  realtime?: LegRealtime;
  /** Position de la gare de montée dans le trajet du train (1 = départ) : retrouve les arrêts du temps réel Eurostar */
  board_sequence?: number;
}

/**
 * same_station : changement de quai · walk : gares proches à pied · city : traversée de ville ·
 * seat_change : (TGVmax) on reste dans le même train et on change de place pour le billet suivant
 */
export type TransferKind = 'same_station' | 'walk' | 'city' | 'seat_change';

export interface TransferLeg {
  type: 'transfer';
  from: StopRef;
  to: StopRef;
  duration_min: number;
  transfer_kind: TransferKind;
  min_transfer_min?: number;
  /** Temps total entre l'arrivée et le départ suivant */
  wait_min?: number;
  /** Temps réel : avec les retards, il ne reste plus le temps de changer (ou un des trains est supprimé) */
  connection_at_risk?: boolean;
}

export type Leg = TrainLeg | TransferLeg;

export interface Journey {
  id: string;
  departure: string;
  arrival: string;
  duration_min: number;
  transfers: number;
  /** Parmi les correspondances, changements de siège dans le même train (TGVmax) */
  seat_changes?: number;
  from: StopRef;
  to: StopRef;
  operators: string[];
  train_types: string[];
  /** Au moins un train à grande vitesse (API Europe) */
  high_speed?: boolean;
  /** Plus de 5 h d'attente en correspondance : nuit en gare */
  long_wait?: boolean;
  legs: Leg[];
  realtime?: JourneyRealtime;
}

export interface TrainTypeInfo {
  name: string;
  high_speed: boolean;
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
  /** Types de train desservant le départ et l'arrivée : choix possibles pour le filtre train_types */
  available_train_types?: TrainTypeInfo[];
  /** Présent quand l'API a le temps réel activé */
  realtime?: RealtimeInfo;
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

/** GET /featured (TGVmax) : trajets tirés au sort chaque jour parmi les départs des prochains jours */
export interface FeaturedResponse {
  date: string;
  built_at: string;
  count: number;
  journeys: Journey[];
  /** Nombre de trains avec au moins une place MAX, pour chacun des prochains jours */
  days?: { date: string; trains: number }[];
}

export interface ApiErrorBody {
  error: string;
  detail?: string;
}

export const isTrainLeg = (leg: Leg): leg is TrainLeg => leg.type === 'train';

export const isSeatChange = (leg?: Leg): leg is TransferLeg =>
  leg?.type === 'transfer' && leg.transfer_kind === 'seat_change';
