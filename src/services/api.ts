// src/services/api.ts

// URL de base de votre backend sur Render
const API_BASE_URL = 'https://trainnomad-sql.onrender.com';

/**
 * Fonction utilitaire pour gérer les réponses et éviter les plantages JSON (ex: en cas de 404 ou 500)
 */
async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur serveur (${response.status}) : ${errorText || response.statusText}`);
  }
  return response.json();
}

/**
 * Fonction pour rechercher des trajets
 */
export async function searchTrips(params: {
  origin: string;
  destination: string;
  date: string;
  time?: string;
  limit?: number;
}) {
  const queryParams = new URLSearchParams({
    origin: params.origin,
    destination: params.destination,
    date: params.date,
    departure_time: params.time || '06:00:00',
    limit: String(params.limit || 20),
  });

  const response = await fetch(`${API_BASE_URL}/search?${queryParams.toString()}`);
  return handleResponse(response);
}