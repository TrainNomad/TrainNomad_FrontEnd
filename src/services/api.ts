// Appels aux API de routage TrainNomad (Europe et TGVmax : même moteur Go, mêmes routes).
// Les URL se règlent dans `.env` (VITE_API_URL, VITE_TGVMAX_API_URL).
// Dans les composants, utiliser `useNetwork().api` : le client du réseau de la page courante.
import { API_BASE_URL } from '../config';
import type { ApiErrorBody, ExplorerResponse, FeaturedResponse, Place, SearchResponse } from '../types/api';

/** Erreur renvoyée par l'API ({ error, detail }) ou erreur réseau. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

type Params = Record<string, string | number | undefined>;

export interface SearchTripsParams {
  from: string;
  to: string;
  date: string;
  time?: string;
  limit?: number;
  maxTransfers?: number;
}

export interface ExploreParams {
  from: string;
  date: string;
  time?: string;
  maxTransfers?: number;
}

export interface ApiClient {
  /** Autocomplétion des villes et gares. */
  searchStations(q: string, limit?: number, signal?: AbortSignal): Promise<Place[]>;
  /**
   * Recherche d'itinéraires. `from` / `to` : id renvoyé par /stations ("city:…", "station:…")
   * ou nom de ville / gare. `time` : "HH:MM" (ou "HH:MM:SS").
   */
  searchTrips(params: SearchTripsParams): Promise<SearchResponse>;
  /** Toutes les destinations atteignables depuis une ville / gare pour la journée. */
  exploreDestinations(params: ExploreParams): Promise<ExplorerResponse>;
  /** Trajets mis en avant du jour (API TGVmax uniquement). */
  featuredTrips(signal?: AbortSignal): Promise<FeaturedResponse>;
}

export function createApiClient(baseUrl: string): ApiClient {
  async function getJSON<T>(path: string, params: Params, signal?: AbortSignal): Promise<T> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') query.set(key, String(value));
    }
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}?${query.toString()}`, { signal });
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
      throw new ApiError(0, 'network_error', `Serveur injoignable (${baseUrl}). Est-il démarré ?`);
    }
    if (!response.ok) {
      let body: ApiErrorBody | null = null;
      try {
        body = await response.json();
      } catch {
        // réponse non JSON (ex. service Render en cours de démarrage)
      }
      throw new ApiError(
        response.status,
        body?.error ?? 'http_error',
        body?.detail ?? `Erreur serveur (${response.status})`,
      );
    }
    return response.json() as Promise<T>;
  }

  return {
    async searchStations(q, limit = 8, signal) {
      const data = await getJSON<{ results: Place[] }>('/stations', { q, limit }, signal);
      return data.results ?? [];
    },
    searchTrips(params) {
      return getJSON<SearchResponse>('/search', {
        from: params.from,
        to: params.to,
        date: params.date,
        time: params.time?.slice(0, 5),
        limit: params.limit ?? 10,
        max_transfers: params.maxTransfers,
      });
    },
    exploreDestinations(params) {
      return getJSON<ExplorerResponse>('/explorer', {
        from: params.from,
        date: params.date,
        time: params.time?.slice(0, 5),
        max_transfers: params.maxTransfers,
      });
    },
    featuredTrips(signal) {
      return getJSON<FeaturedResponse>('/featured', {}, signal);
    },
  };
}

// Client du réseau Europe (compatibilité avec le code existant).
const europe = createApiClient(API_BASE_URL);
export const searchStations = europe.searchStations;
export const searchTrips = europe.searchTrips;
export const exploreDestinations = europe.exploreDestinations;
