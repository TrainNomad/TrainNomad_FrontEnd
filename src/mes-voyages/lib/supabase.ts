// Client Supabase de l'espace « Mes voyages ». Chargé uniquement par les pages /mes-voyages (import à la
// demande depuis App.tsx) : le reste du site n'embarque ni ce client ni la session.
//
// Seule la clé publique (« publishable » / anon) est utilisée dans le navigateur : les droits sont limités par la
// RLS de la base (supabase/migrations). La clé service n'existe que dans les fonctions serveur.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { MES_VOYAGES_ENABLED, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../config';

export { MES_VOYAGES_ENABLED, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL };

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!MES_VOYAGES_ENABLED) throw new Error('Supabase non configuré (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)');
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        // Session gardée sur l'appareil pour ne pas redemander un code à chaque visite ; supprimée à la déconnexion
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'trainnomad-mes-voyages-auth',
        // Connexion par code saisi dans la page ; si l'e-mail contient un lien (modèle d'e-mail par défaut de
        // Supabase), la session arrive dans l'adresse au retour et elle est reprise ici
        detectSessionInUrl: true,
        flowType: 'implicit',
      },
    });
  }
  return client;
}

/** Adresse d'une fonction serveur (supabase/functions). */
export const functionUrl = (name: string) => `${SUPABASE_URL}/functions/v1/${name}`;
