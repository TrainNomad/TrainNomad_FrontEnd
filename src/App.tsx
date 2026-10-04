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
import { NetworkScope } from './network/NetworkContext';
import { usePageMeta } from './hooks/usePageMeta';
import { LEGACY_PAGES, LegacyGuideRedirect } from './pages/LegacyRedirects';
import NotFound from './pages/NotFound';
import './styles/global.css';

// Pages chargées à la demande : la carte (Leaflet, MapTiler) et les pages secondaires
// ne sont téléchargées que lorsqu'on les ouvre.
const MentionLegal = lazy(() => import('./pages/MentionLegal'));
const Conditions = lazy(() => import('./pages/Conditions'));
const Confidentialites = lazy(() => import('./pages/Confidentialites'));
const AboutPage = lazy(() => import('./pages/about'));
const Trajets = lazy(() => import('./pages/trajets'));
const GuidesPage = lazy(() => import('./pages/Guides'));
const GuideDetailPage = lazy(() => import('./pages/GuideDetail'));
const TGVMaxPage = lazy(() => import('./pages/tgvmax'));
const Explorer = lazy(() => import('./pages/explorer'));

function HomePage() {
  usePageMeta();
  return (
    <>
      <HeroSection />
      <DestinationsSection />
      <GuidesSection />
      <TGVMaxSection />
      <EuropeSection />
    </>
  );
}

/** Titre de l'onglet et description de la page. */
function Page({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  usePageMeta(title, description);
  return <>{children}</>;
}

const TGVMAX_DESCRIPTION =
  'Repérez les trains TGV INOUI et Intercités avec des places MAX JEUNE / MAX SENIOR disponibles. Site indépendant, données SNCF Voyageurs.';

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
          <Route path="/trajets" element={<Page title="Trajets en train"><Trajets /></Page>} />
          <Route path="/explorer" element={<Page title="Explorer l'Europe en train"><Explorer /></Page>} />
          {/* TGVmax : mêmes pages et composants, API et couleurs du réseau TGVmax */}
          <Route path="/tgvmax" element={<Page title="Places TGVmax disponibles" description={TGVMAX_DESCRIPTION}><NetworkScope network="tgvmax"><TGVMaxPage /></NetworkScope></Page>} />
          <Route path="/tgvmax/trajets" element={<Page title="Trajets TGVmax" description={TGVMAX_DESCRIPTION}><NetworkScope network="tgvmax"><Trajets /></NetworkScope></Page>} />
          <Route path="/tgvmax/explorer" element={<Page title="Où partir avec TGVmax ?" description={TGVMAX_DESCRIPTION}><NetworkScope network="tgvmax"><Explorer /></NetworkScope></Page>} />
          <Route path="/guides" element={<Page title="Guides de voyage en train"><GuidesPage /></Page>} />
          {/* le titre est posé par la page elle-même, avec le nom de la ville */}
          <Route path="/guides/:slug" element={<GuideDetailPage />} />
          <Route path="/a-propos" element={<Page title="À propos"><AboutPage /></Page>} />
          <Route path="/conditions" element={<Page title="Conditions d'utilisation"><Conditions /></Page>} />
          <Route path="/confidentialite" element={<Page title="Confidentialité"><Confidentialites /></Page>} />
          <Route path="/mentions-legales" element={<Page title="Mentions légales"><MentionLegal /></Page>} />

          {/* Anciennes URLs du site statique */}
          <Route path="/guide/guide.html" element={<LegacyGuideRedirect />} />
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
