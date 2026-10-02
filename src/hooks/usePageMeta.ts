import { useEffect } from 'react';

const SITE = 'TrainNomad.eu';
const ORIGIN = 'https://trainnomad.eu';
const DEFAULT_DESCRIPTION =
  "Trouvez vos trajets en train en Europe, explorez les destinations sur une carte et repérez les places TGVmax disponibles.";

/** Titre de l'onglet, meta description et URL canonique (sans paramètres) de la page courante. */
export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : `${SITE} · L'Europe en train`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description || DEFAULT_DESCRIPTION);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', ORIGIN + window.location.pathname);
  }, [title, description]);
}
