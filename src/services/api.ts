// Appels à l'API de routage TrainNomad. L'URL se règle dans `.env` (VITE_API_URL).
import { API_BASE_URL } from '../config';
import type { ApiErrorBody, ExplorerResponse, Place, SearchResponse } from '../types/api';

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

async function getJSON<T>(path: string, params: Params, signal?: AbortSignal): Promise<T> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const response = await fetch(`${API_BASE_URL}${path}?${query.toString()}`, { signal });
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

/** Autocomplétion des villes et gares. */
export async function searchStations(q: string, limit = 8, signal?: AbortSignal): Promise<Place[]> {
  const data = await getJSON<{ results: Place[] }>('/stations', { q, limit }, signal);
  return data.results ?? [];
}

/**
 * Recherche d'itinéraires. `from` / `to` : id renvoyé par /stations ("city:…", "station:…")
 * ou nom de ville / gare. `time` : "HH:MM" (ou "HH:MM:SS").
 */
export function searchTrips(params: {
  from: string;
  to: string;
  date: string;
  time?: string;
  limit?: number;
  maxTransfers?: number;
}): Promise<SearchResponse> {
  return getJSON<SearchResponse>('/search', {
    from: params.from,
    to: params.to,
    date: params.date,
    time: params.time?.slice(0, 5),
    limit: params.limit ?? 10,
    max_transfers: params.maxTransfers,
  });
}

/** Toutes les destinations atteignables depuis une ville / gare pour la journée. */
export function exploreDestinations(params: {
  from: string;
  date: string;
  time?: string;
  maxTransfers?: number;
}): Promise<ExplorerResponse> {
  return getJSON<ExplorerResponse>('/explorer', {
    from: params.from,
    date: params.date,
    time: params.time?.slice(0, 5),
    max_transfers: params.maxTransfers,
  });
}
