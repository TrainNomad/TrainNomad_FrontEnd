// Configuration du front. Les valeurs se règlent dans le fichier `.env` à la racine du
// projet (voir `.env.example`) ; Vite les injecte au moment du build.

const withoutTrailingSlash = (url: string) => url.replace(/\/+$/, '');

/**
 * Site ouvert en local (`pnpm dev`, `pnpm preview`) : les API sont alors celles lancées sur la machine
 * (`python run_local.py`), sinon celles du serveur (Backend/serveur). Décidé dans le navigateur, au chargement de la page :
 * le même build fonctionne donc en local comme en ligne.
 */
const IS_LOCALHOST =
  typeof window !== 'undefined' &&
  /^(localhost|127\.0\.0\.1|\[::1\]|.+\.localhost)$/.test(window.location.hostname);

/** URL d'une API : variable d'environnement si elle est définie, sinon localhost ou le serveur. */
function apiUrl(envValue: string | undefined, serverUrl: string, localPort: number): string {
  return withoutTrailingSlash(envValue || (IS_LOCALHOST ? `http://localhost:${localPort}` : serverUrl));
}

/** URL de l'API de routage TrainNomad (service Go Backend/Europe). */
export const API_BASE_URL = apiUrl(import.meta.env.VITE_API_URL, 'https://api.trainnomad.eu', 8000);

/** URL de l'API des guides TrainNomad (service Go Backend/guide). */
export const GUIDES_API_URL = apiUrl(import.meta.env.VITE_GUIDES_API_URL, 'https://guides-api.trainnomad.eu', 8001);

/** URL de l'API TGVmax (service Go Backend/tgvmax). */
export const TGVMAX_API_URL = apiUrl(
  import.meta.env.VITE_TGVMAX_API_URL,
  'https://tgvmax-api.trainnomad.eu',
  8002,
);

/** Clé MapTiler (fond de carte de l'explorateur). */
export const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_KEY || '';

/** Nombre maximal de correspondances affichées sur la carte d'exploration. */
export const EXPLORER_MAX_TRANSFERS = Number(import.meta.env.VITE_EXPLORER_MAX_TRANSFERS ?? 2);
