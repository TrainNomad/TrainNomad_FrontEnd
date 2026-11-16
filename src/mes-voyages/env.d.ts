// Variables d'environnement propres à l'espace « Mes voyages » (voir supabase/README.md).
interface ImportMetaEnv {
  /** https://<projet>.supabase.co */
  readonly VITE_SUPABASE_URL?: string;
  /** Clé publique du projet (« publishable key », sb_publishable_…) */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** Ancienne clé publique (anon), acceptée si la précédente est absente */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** ID client OAuth Google (public) : active le bouton Google intégré, qui affiche « trainnomad.eu » */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Taille maximale d'un billet en octets (10 Mo par défaut), à garder égale au réglage serveur */
  readonly VITE_MAX_PDF_BYTES?: string;
}
