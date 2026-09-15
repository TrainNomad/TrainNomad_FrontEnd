// ─── Station / Autocomplete ───────────────────────────────────────────────────

import type { Place } from './api';

/**
 * Ville ou gare proposée par l'autocomplétion (format de l'API /stations).
 * `id` ("city:…" / "station:…") est la valeur à envoyer à /search et /explorer.
 */
export type Station = Place;

/** Pseudo-destination « N'importe où » : redirige vers la carte d'exploration. */
export const ANYWHERE_ID = 'anywhere';

export const ANYWHERE_STATION: Station = {
  type: 'city',
  id: ANYWHERE_ID,
  name: "N'importe où 🗺️",
  country: 'Inspiration & Explorations',
  lat: 0,
  lon: 0,
};

/** Valeur à envoyer à l'API : l'identifiant de la suggestion choisie, sinon le texte saisi. */
export function placeParam(selected: Station | null, typed: string): string {
  return selected && selected.id !== ANYWHERE_ID ? selected.id : typed.trim();
}

export interface SelectedStop {
  name: string;
  id: string;
  lat: number;
  lon: number;
}

export interface AutocompleteResult {
  results: Station[];
}

// ─── Search form ──────────────────────────────────────────────────────────────

export type TripType = 'oneway' | 'roundtrip';
export type ActiveTab = 'europe' | 'carte';

export interface SearchFormState {
  from: string;
  to: string;
  date: string;
  returnDate: string;
  tripType: TripType;
  activeTab: ActiveTab;
  selectedFrom: SelectedStop | null;
  selectedTo: SelectedStop | null;
}

// ─── Destination cards ────────────────────────────────────────────────────────

export interface Destination {
  id: string;
  name: string;
  country: string;
  description: string;
  duration: string;
  image: string;
  href: string;
}

// ─── Guide cards ──────────────────────────────────────────────────────────────

export interface Guide {
  id: string;
  city: string;
  country: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  duration: string;
  price: string;
  badge: string;
  badgeStyle: 'direct' | 'night';
  emoji: string;
}

// ─── Feature cards ────────────────────────────────────────────────────────────

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

// ─── Nav links ────────────────────────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
  icon: string;
}
