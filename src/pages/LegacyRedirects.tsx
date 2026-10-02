// Anciennes URLs du site statique (trainnomad.eu avant la version React). Les redirections 301
// sont faites par Render (render.yaml) ; ces routes servent de filet si une URL arrive quand même ici.
import { Navigate, useSearchParams } from 'react-router-dom';
import { useGuides } from '../hooks/useGuides';

/** Pages renommées : /trajets.html -> /trajets, etc. */
export const LEGACY_PAGES: Record<string, string> = {
  '/index.html': '/',
  '/trajets.html': '/trajets',
  '/explorer.html': '/explorer',
  '/outilstgvmax.html': '/tgvmax',
  '/guide': '/guides',
  '/guide/index.html': '/guides',
  '/A_propos.html': '/a-propos',
  '/conditions.html': '/conditions',
  '/confidentialite.html': '/confidentialite',
  '/mention_legal.html': '/mentions-legales',
  '/404.html': '/',
};

// Slugs de l'ancien site renommés dans l'API des guides
const GUIDE_ALIASES: Record<string, string> = { edimbourg: 'edinburgh' };

/** /guide/guide.html?ville=<slug> : vers le guide s'il existe encore, sinon vers la liste des guides. */
export function LegacyGuideRedirect() {
  const [params] = useSearchParams();
  const ville = (params.get('ville') || '').toLowerCase();
  const slug = GUIDE_ALIASES[ville] ?? ville;
  const { guides, loading } = useGuides();

  if (loading) return <div className="min-h-[60vh]" />;
  const exists = guides.some((g) => g.slug === slug);
  return <Navigate to={exists ? `/guides/${slug}` : '/guides'} replace />;
}
