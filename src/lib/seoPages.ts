// Index des pages générées automatiquement (src/lib/seoPagesData.json, écrit par scripts/seo-pages.mjs
// à chaque build) : liaisons, encart « Venir en train » des guides, pages TGVmax par ville.
import data from './seoPagesData.json';
import type { LiaisonSummary } from './liaisons';

export interface PlaceRef {
  name: string;
  id: string;
  country: string;
  lat: number;
  lon: number;
}

export interface LiaisonPage {
  slug: string;
  from: PlaceRef;
  to: PlaceRef;
  /** Guide de la ville d'arrivée */
  guide: string | null;
  /** Journée relevée */
  date: string;
  summary: LiaisonSummary;
}

export interface GuideAccess {
  from: PlaceRef;
  to: PlaceRef;
  summary: LiaisonSummary;
  /** Page de la liaison, s'il y en a une */
  liaison: string | null;
  /** Identifiants des deux villes dans l'API TGVmax, si elles y sont */
  tgvmax: { from: string; to: string } | null;
}

export interface MaxCityPage {
  slug: string;
  name: string;
  /** Identifiant de la ville dans l'API TGVmax */
  id: string;
  /** Destinations relevées au build */
  count: number;
}

interface SeoPagesData {
  built_at: string;
  date: string;
  liaisons: LiaisonPage[];
  guides: Record<string, GuideAccess[]>;
  tgvmax: MaxCityPage[];
}

export const SEO_PAGES = data as unknown as SeoPagesData;

/** Adresses avec la barre finale : Render sert alors directement la page générée (dist/train/…/index.html). */
export const liaisonPath = (slug: string) => `/train/${slug}/`;
export const maxCityPath = (slug: string) => `/tgvmax/depuis/${slug}/`;

/** Lien vers la page Trajets (réseau Europe ou TGVmax) pour deux villes et une date. */
export function tripsPath(base: string, from: { id: string; name: string }, to: { id: string; name: string }, date: string): string {
  const params = new URLSearchParams({ departure: from.id, departure_name: from.name, arrival: to.id, arrival_name: to.name, date });
  return `${base}?${params}`;
}
