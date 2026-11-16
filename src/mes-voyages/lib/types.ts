// Données de l'espace « Mes voyages », telles que stockées dans la base (supabase/migrations).
import type { Journey } from '../../types/api';
import type { NetworkId } from '../../network/networks';

export type TripStatus = 'planned' | 'booked' | 'completed' | 'cancelled';

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  planned: 'En préparation',
  booked: 'Billets pris',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

/** Paramètres de l'API /search gardés avec une recherche (mêmes noms que l'adresse de la page Trajets). */
export interface SearchFilters {
  max_transfers?: string;
  train_types?: string;
  long_wait?: string;
}

export interface SavedSearch {
  id: string;
  label: string | null;
  network: NetworkId;
  origin_id: string;
  origin_name: string;
  destination_id: string;
  destination_name: string;
  /** AAAA-MM-JJ */
  travel_date: string | null;
  return_date: string | null;
  /** HH:MM:SS */
  departure_time_preference: string | null;
  filters: SearchFilters;
  created_at: string;
  updated_at: string;
}

export type SavedSearchInput = Omit<SavedSearch, 'id' | 'created_at' | 'updated_at'>;

export interface Trip {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  status: TripStatus;
  notes: string | null;
  /** Prix du pass Interrail envisagé (euros), pour comparer avec la somme des billets */
  pass_price_amount: number | null;
  /** Réservations obligatoires à payer en plus du pass (euros) */
  pass_reservations_amount: number | null;
  /** Jeton du lien de partage en lecture seule (null : voyage non partagé) */
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

export type TripInput = Pick<Trip, 'title' | 'start_date' | 'end_date' | 'status' | 'notes'>;
export type TripPassInput = Pick<Trip, 'pass_price_amount' | 'pass_reservations_amount'>;

/** Paramètres pour relancer la recherche d'une étape sur la page Trajets */
export interface LegSearchParams {
  departure: string;
  departure_name: string;
  arrival: string;
  arrival_name: string;
  date: string;
  departure_time?: string;
}

export interface TripLeg {
  id: string;
  trip_id: string;
  position: number;
  network: NetworkId | null;
  origin_id: string | null;
  origin_name: string;
  destination_id: string | null;
  destination_name: string;
  scheduled_departure_at: string | null;
  scheduled_arrival_at: string | null;
  departure_timezone: string | null;
  arrival_timezone: string | null;
  /** Heure locale de la gare, telle qu'affichée par l'API ou saisie ("2026-09-17T09:31:00+01:00" / "2026-09-17T09:31") */
  departure_local: string | null;
  arrival_local: string | null;
  operator_name: string | null;
  train_number: string | null;
  notes: string | null;
  /** Prix du billet (euros), saisi par l'utilisateur */
  price_amount: number | null;
  price_kind: 'paid' | 'estimated' | null;
  /** Devise du prix (EUR par défaut) */
  price_currency: string;
  source: 'search' | 'manual';
  source_fetched_at: string | null;
  search_params: LegSearchParams | null;
  itinerary_snapshot: Journey | null;
  created_at: string;
  updated_at: string;
}

export type TripLegInput = Omit<TripLeg, 'id' | 'created_at' | 'updated_at'>;

/** Voyage vu par le lien de partage : ni notes, ni prix, ni propriétaire */
export interface SharedTrip {
  title: string;
  start_date: string;
  end_date: string | null;
  legs: Array<
    Pick<
      TripLeg,
      | 'id' | 'position' | 'network' | 'origin_id' | 'origin_name' | 'destination_id' | 'destination_name'
      | 'scheduled_departure_at' | 'scheduled_arrival_at' | 'departure_local' | 'arrival_local' | 'operator_name'
      | 'train_number' | 'source' | 'source_fetched_at' | 'search_params' | 'itinerary_snapshot'
    >
  >;
}

export interface TripWithDetails extends Trip {
  legs: TripLeg[];
}

/** Trajet dans la liste « Mes voyages » (sans la photographie complète) */
export type LegSummary = Pick<
  TripLeg,
  'id' | 'position' | 'origin_name' | 'destination_name' | 'departure_local' | 'arrival_local' | 'scheduled_departure_at' | 'scheduled_arrival_at' | 'source' | 'source_fetched_at' | 'price_amount' | 'price_currency'
> & { transfers: number | null };

/** Voyage de la liste, avec le résumé de ses trajets */
export interface TripSummary extends Trip {
  legs: LegSummary[];
}
