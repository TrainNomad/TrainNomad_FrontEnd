// Configuration du front. Les valeurs se règlent dans le fichier `.env` à la racine du
// projet (voir `.env.example`) ; Vite les injecte au moment du build.

const withoutTrailingSlash = (url: string) => url.replace(/\/+$/, '');

/** URL de l'API de routage TrainNomad (service Go). */
export const API_BASE_URL = withoutTrailingSlash(
  import.meta.env.VITE_API_URL || 'https://trainnomad-go.onrender.com',
);

/** URL de l'API des guides TrainNomad (service Go). */
export const GUIDES_API_URL = withoutTrailingSlash(
  import.meta.env.VITE_GUIDES_API_URL || 'https://trainnomad-guide.onrender.com',
);

/** Clé MapTiler (fond de carte de l'explorateur). */
export const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_KEY || '';

/** Nombre maximal de correspondances affichées sur la carte d'exploration. */
export const EXPLORER_MAX_TRANSFERS = Number(import.meta.env.VITE_EXPLORER_MAX_TRANSFERS ?? 1);
