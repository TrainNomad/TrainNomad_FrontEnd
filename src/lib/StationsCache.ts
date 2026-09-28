// src/lib/stationCache.ts

const CACHE_KEY = 'stations_cache';

// Récupérer tout le dictionnaire du cache
function getCache(): Record<string, string> {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

// Enregistrer la correspondance (ex: "station:8747100" -> "Rennes")
export function saveStationToCache(id: string, label: string) {
  if (!id || !label) return;
  const cache = getCache();
  cache[id] = label;
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

// Récupérer le nom à partir de l'ID
export function getStationNameFromCache(id: string): string | null {
  const cache = getCache();
  return cache[id] || null;
}