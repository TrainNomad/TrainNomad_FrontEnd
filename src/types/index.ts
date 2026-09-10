// ─── Station / Autocomplete ───────────────────────────────────────────────────

export interface Station {
  label: string;
  type: 'city' | 'station';
  country?: string;
  city?: string;
  uic?: string;
  /** Valeur exacte attendue par l'API pour la recherche (fallback: label) */
  search_val?: string;
  lat?: number;
  lon?: number;
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
