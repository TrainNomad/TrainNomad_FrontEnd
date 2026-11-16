// Réglages de l'espace « Mes voyages » lus au build. Sans dépendance : importable par les pages du site
// (lien « Mes voyages », bouton « Enregistrer ce trajet ») sans embarquer le client Supabase.

const withoutTrailingSlash = (url: string) => url.replace(/\/+$/, '');

export const SUPABASE_URL = withoutTrailingSlash(import.meta.env.VITE_SUPABASE_URL || '');
export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Espace pas encore lancé : visible en développement (pnpm dev), masqué en production tant que
 * VITE_MES_VOYAGES_OUVERT=true n'est pas ajouté au tableau de bord Render.
 */
const OUVERT = import.meta.env.DEV || import.meta.env.VITE_MES_VOYAGES_OUVERT === 'true';

/** Espace disponible : ouvert et projet Supabase configuré pour ce build (.env, puis tableau de bord Render). */
export const MES_VOYAGES_ENABLED = OUVERT && SUPABASE_URL !== '' && SUPABASE_PUBLISHABLE_KEY !== '';
