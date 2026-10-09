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

/** Mesure d'audience Umami Cloud (région Europe) : identifiant public du site et adresse du script. */
export const UMAMI_WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID || '88798394-67c9-408f-a7fc-f4b33c91ee57';
export const UMAMI_SCRIPT_URL = import.meta.env.VITE_UMAMI_SCRIPT_URL || 'https://cloud.umami.is/script.js';

/**
 * Lien de suivi Omio (affiliation Impact) : la page Omio visée est ajoutée dans le paramètre `u`.
 * Forme longue du lien court https://omio.sjv.io/NGVBbK (partenaire / annonce / programme).
 */
export const OMIO_TRACKING_URL = withoutTrailingSlash(
  import.meta.env.VITE_OMIO_TRACKING_URL || 'https://omio.sjv.io/c/7915754/409973/7385',
);

/** Nombre maximal de correspondances affichées sur la carte d'exploration. */
export const EXPLORER_MAX_TRANSFERS = Number(import.meta.env.VITE_EXPLORER_MAX_TRANSFERS ?? 2);
