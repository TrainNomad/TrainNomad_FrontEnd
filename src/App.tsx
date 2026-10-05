import { lazy, Suspense, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { DestinationsSection } from './components/DestinationsSection';
import { GuidesSection } from './components/GuidesSection';
import { TGVMaxSection } from './components/TGVMaxSection';
import { EuropeSection } from './components/EuropeSection';
import { FaqSection } from './components/FaqSection';
import { NetworkScope } from './network/NetworkContext';
import { usePageMeta } from './hooks/usePageMeta';
import { LEGACY_PAGES, LegacyGuideRedirect } from './pages/LegacyRedirects';
import NotFound from './pages/NotFound';
import PAGE_META from './lib/pageMeta.json';
import './styles/global.css';

// Pages chargées à la demande : la carte (Leaflet, MapTiler) et les pages secondaires
// ne sont téléchargées que lorsqu'on les ouvre.
const MentionLegal = lazy(() => import('./pages/MentionLegal'));
const Conditions = lazy(() => import('./pages/Conditions'));
const Confidentialites = lazy(() => import('./pages/Confidentialites'));
const AboutPage = lazy(() => import('./pages/about'));
const CommentCaMarche = lazy(() => import('./pages/CommentCaMarche'));
const Trajets = lazy(() => import('./pages/trajets'));
const GuidesPage = lazy(() => import('./pages/Guides'));
const GuideDetailPage = lazy(() => import('./pages/GuideDetail'));
const TGVMaxPage = lazy(() => import('./pages/tgvmax'));
const Explorer = lazy(() => import('./pages/explorer'));

function HomePage() {
  usePageMeta(undefined, PAGE_META['/'].description);
  return (
    <>
      <HeroSection />
      <DestinationsSection />
      <GuidesSection />
      <TGVMaxSection />
      <EuropeSection />
      <FaqSection />
    </>
  );
}

/**
 * Titre de l'onglet et description de la page, lus dans src/lib/pageMeta.json
 * (même source que les pages HTML générées par scripts/prerender.mjs).
 */
function Page({ path, children }: { path: Exclude<keyof typeof PAGE_META, '/'>; children: ReactNode }) {
  const { title, description } = PAGE_META[path];
  usePageMeta(title, description);
  return <>{children}</>;
}

export default function App() {
  const { pathname } = useLocation();
  const isMapPage = pathname.replace(/\/$/, '').endsWith('/explorer');

  // Changement de page : on repart du haut (pas lors d'un simple changement de paramètres de recherche)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="bg-white text-midnight font-display">
      <Navbar />
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trajets" element={<Page path="/trajets"><Trajets /></Page>} />
          <Route path="/explorer" element={<Page path="/explorer"><Explorer /></Page>} />
          {/* TGVmax : mêmes pages et composants, API et couleurs du réseau TGVmax */}
          <Route path="/tgvmax" element={<Page path="/tgvmax"><NetworkScope network="tgvmax"><TGVMaxPage /></NetworkScope></Page>} />
          <Route path="/tgvmax/trajets" element={<Page path="/tgvmax/trajets"><NetworkScope network="tgvmax"><Trajets /></NetworkScope></Page>} />
          <Route path="/tgvmax/explorer" element={<Page path="/tgvmax/explorer"><NetworkScope network="tgvmax"><Explorer /></NetworkScope></Page>} />
          <Route path="/guides" element={<Page path="/guides"><GuidesPage /></Page>} />
          {/* le titre est posé par la page elle-même, avec le nom de la ville */}
          <Route path="/guides/:slug" element={<GuideDetailPage />} />
          <Route path="/a-propos" element={<Page path="/a-propos"><AboutPage /></Page>} />
          <Route path="/comment-ca-marche" element={<Page path="/comment-ca-marche"><CommentCaMarche /></Page>} />
          <Route path="/conditions" element={<Page path="/conditions"><Conditions /></Page>} />
          <Route path="/confidentialite" element={<Page path="/confidentialite"><Confidentialites /></Page>} />
          <Route path="/mentions-legales" element={<Page path="/mentions-legales"><MentionLegal /></Page>} />

          {/* Anciennes URLs du site statique */}
          <Route path="/guide/guide.html" element={<LegacyGuideRedirect />} />
          {/* cible de la redirection Render de /guide/guide.html (render.yaml) */}
          <Route path="/guide/guide" element={<LegacyGuideRedirect />} />
          {Object.entries(LEGACY_PAGES).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {/* Explorer sur téléphone : carte plein écran façon application, sans pied de page
          (les liens légaux sont dans le menu de la Navbar) */}
      <div className={isMapPage ? 'hidden md:block' : undefined}>
        <Footer />
      </div>
    </div>
  );
}
