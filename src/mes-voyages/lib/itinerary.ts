// Passage entre les recherches du site (page Trajets, voyages choisis dans le navigateur) et l'espace
// « Mes voyages » : adresses de recherche, étapes enregistrées à partir d'un trajet, dates et heures.
import { NETWORKS, type NetworkId } from '../../network/networks';
import { isTrainLeg, type Journey, type Place } from '../../types/api';
import type { LegSearchParams, SavedSearch, SavedSearchInput, SearchFilters, TripLegInput } from './types';

/** Identifiant de lieu accepté par la base (domaine place_id) */
const PLACE_ID = /^(city|station):[A-Za-z0-9_.:-]{1,80}$/;
export const validPlaceId = (id: string | null | undefined): string | null => (id && PLACE_ID.test(id) ? id : null);

/** Date du jour sur l'appareil, AAAA-MM-JJ */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ─── Adresses de la page Trajets ────────────────────────────────────────────────────────────────

const FILTER_KEYS = ['max_transfers', 'train_types', 'long_wait'] as const;

function trajetsUrl(network: NetworkId, params: Record<string, string | undefined | null>): string {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) query.set(k, v);
  return `${NETWORKS[network].paths.trajets}?${query.toString()}`;
}

/** Relance une recherche sauvegardée, avec ses paramètres d'origine. */
export function savedSearchUrl(search: SavedSearch, date?: string): string {
  return trajetsUrl(search.network, {
    departure: search.origin_id,
    departure_name: search.origin_name,
    arrival: search.destination_id,
    arrival_name: search.destination_name,
    date: date ?? search.travel_date,
    departure_time: search.departure_time_preference?.slice(0, 5) ?? '02:00',
    return_date: search.return_date,
    ...search.filters,
  });
}

/** Relance la recherche d'une étape enregistrée (horaires du moment). */
export function legSearchUrl(network: NetworkId | null, params: LegSearchParams): string {
  return trajetsUrl(network ?? 'europe', { ...params });
}

/** Recherche d'un trajet entre deux lieux à une date (étape d'un voyage sans train choisi). */
export function searchUrl(network: NetworkId, from: Place, to: Place, date: string): string {
  return trajetsUrl(network, {
    departure: from.id,
    departure_name: from.name,
    arrival: to.id,
    arrival_name: to.name,
    date,
    departure_time: '02:00',
  });
}

/**
 * Recherche décrite par une adresse de la page Trajets (mêmes paramètres), pour l'enregistrer.
 * Null si le départ ou l'arrivée manquent ou ne sont pas des identifiants de lieu.
 */
export function savedSearchFromParams(params: URLSearchParams): SavedSearchInput | null {
  const origin = validPlaceId(params.get('departure') || params.get('origin'));
  const destination = validPlaceId(params.get('arrival') || params.get('destination'));
  if (!origin || !destination) return null;
  const date = params.get('date');
  const ret = params.get('return_date') || params.get('returnDate');
  const time = params.get('departure_time') || params.get('time');
  const filters: SearchFilters = {};
  for (const key of FILTER_KEYS) {
    const v = params.get(key);
    if (v) filters[key] = v.slice(0, 500);
  }
  const isDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const originName = (params.get('departure_name') || params.get('origin_name') || origin).slice(0, 160);
  const destinationName = (params.get('arrival_name') || params.get('destination_name') || destination).slice(0, 160);
  return {
    label: null,
    network: params.get('network') === 'tgvmax' ? 'tgvmax' : 'europe',
    origin_id: origin,
    origin_name: originName,
    destination_id: destination,
    destination_name: destinationName,
    travel_date: isDate(date) ? date : null,
    return_date: isDate(ret) ? ret : null,
    // 02:00 est la valeur par défaut de la page Trajets : ce n'est pas une préférence de l'utilisateur
    departure_time_preference: time && /^\d{2}:\d{2}$/.test(time) && time !== '02:00' ? time : null,
    filters,
  };
}

// ─── Étapes enregistrées à partir d'un trajet trouvé ────────────────────────────────────────────

const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

/** Horaires, gares, compagnies et numéros de train d'un trajet trouvé, avec sa photographie et sa date de capture. */
export function journeyFields(journey: Journey, fetchedAt: string) {
  const trains = journey.legs.filter(isTrainLeg);
  return {
    origin_name: journey.from.name.slice(0, 160),
    destination_name: journey.to.name.slice(0, 160),
    scheduled_departure_at: journey.departure,
    scheduled_arrival_at: journey.arrival,
    departure_timezone: null,
    arrival_timezone: null,
    departure_local: journey.departure,
    arrival_local: journey.arrival,
    operator_name: unique(trains.map((t) => t.operator_name)).join(' + ').slice(0, 120) || null,
    train_number: unique(trains.map((t) => [t.train_type, t.train_number].filter(Boolean).join(' '))).join(' / ').slice(0, 40) || null,
    source: 'search' as const,
    source_fetched_at: fetchedAt,
    itinerary_snapshot: journey,
  };
}

/**
 * Trajet enregistré : le trajet tel qu'affiché lors du choix, avec sa date de capture. Ce n'est pas une garantie de
 * circulation : l'interface propose d'actualiser la recherche.
 */
export function legFromJourney(args: {
  tripId: string;
  position: number;
  network: NetworkId;
  from: Place;
  to: Place;
  date: string;
  journey: Journey;
  fetchedAt: string;
}): TripLegInput {
  const { tripId, position, network, from, to, date, journey, fetchedAt } = args;
  const fields = journeyFields(journey, fetchedAt);
  return {
    ...fields,
    trip_id: tripId,
    position,
    network,
    origin_id: validPlaceId(from.id),
    origin_name: fields.origin_name || from.name.slice(0, 160),
    destination_id: validPlaceId(to.id),
    destination_name: fields.destination_name || to.name.slice(0, 160),
    notes: null,
    price_amount: null,
    price_kind: null,
    price_currency: 'EUR',
    search_params: {
      departure: from.id,
      departure_name: from.name,
      arrival: to.id,
      arrival_name: to.name,
      date,
      departure_time: '02:00',
    },
  };
}

/** Suite des trains d'un trajet (type, numéro, heure de départ), pour reconnaître le même trajet d'une recherche à l'autre. */
export function trainSignature(journey: Journey): string {
  return journey.legs
    .filter(isTrainLeg)
    .map((t) => `${t.train_type} ${t.train_number}`.trim())
    .join(' / ');
}

// ─── Heures saisies à la main ───────────────────────────────────────────────────────────────────

/** Fuseaux proposés pour une étape saisie à la main (heure locale de la gare). */
export const TIMEZONES: { id: string; label: string }[] = [
  { id: 'Europe/Lisbon', label: 'Portugal, Royaume-Uni, Irlande (UTC+0/+1)' },
  { id: 'Europe/Paris', label: "France, Europe centrale (UTC+1/+2)" },
  { id: 'Europe/Helsinki', label: 'Finlande, Grèce, Roumanie, Pays baltes (UTC+2/+3)' },
  { id: 'Europe/Istanbul', label: 'Turquie (UTC+3)' },
];

/** Fuseau de l'appareil s'il est proposé, sinon Europe centrale. */
export function defaultTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetOf = (zone: string) => new Date().toLocaleString('en-US', { timeZone: zone, timeZoneName: 'shortOffset' }).split(' ').pop();
    const match = TIMEZONES.find((z) => offsetOf(z.id) === offsetOf(tz));
    return match?.id ?? 'Europe/Paris';
  } catch {
    return 'Europe/Paris';
  }
}

/** Décalage (minutes) du fuseau `timeZone` à l'instant `date`. */
function offsetMinutes(date: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** Heure locale d'une gare (date AAAA-MM-JJ, heure HH:MM, fuseau) → instant ISO absolu. */
export function zonedToIso(date: string, time: string, timeZone: string): string {
  const naive = Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10), +time.slice(0, 2), +time.slice(3, 5));
  // deux passes : le décalage peut changer autour du changement d'heure
  let instant = naive - offsetMinutes(new Date(naive), timeZone) * 60000;
  instant = naive - offsetMinutes(new Date(instant), timeZone) * 60000;
  return new Date(instant).toISOString();
}

/** "2026-09-17T09:31…" → "2026-09-17" */
export const localDate = (local: string | null | undefined) => (local && local.length >= 10 ? local.slice(0, 10) : null);
