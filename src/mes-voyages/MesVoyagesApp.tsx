// Espace personnel « Mes voyages » : point d'entrée unique, monté sur /mes-voyages/* par App.tsx et chargé à la
// demande. Tout le module (pages, session, client Supabase) vit dans src/mes-voyages ; il n'utilise du reste du
// site que des éléments en lecture (types, réseaux, autocomplétion des gares, voyages gardés dans le navigateur).
//
// Routes
//   /mes-voyages                 trajets enregistrés, recherches sauvegardées, projets (présentation si déconnecté)
//   /mes-voyages/connexion       connexion / inscription : e-mail + mot de passe, Google, Facebook (?suite= retour)
//   /mes-voyages/mot-de-passe    nouveau mot de passe (arrivée depuis le lien « mot de passe oublié »)
//   /mes-voyages/nouveau         créer un voyage
//   /mes-voyages/voyage/:id      fiche d'un voyage (trajets, notes)
//   /mes-voyages/voyage/:id/modifier
//   /mes-voyages/sauvegarder     enregistrer la recherche décrite par l'adresse (mêmes paramètres que /trajets)
//   /mes-voyages/enregistrer     « Enregistrer ce trajet » : trajet choisi sur la page Trajets (?voyage=<id local>)
//   /mes-voyages/ajouter         ajouter un trajet choisi à un voyage existant (?voyage=<id local>&trip=<id>)
//   /mes-voyages/compte          compte, données, suppression
//   /mes-voyages/partage#<jeton> voyage partagé en lecture seule (sans compte)
import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { AuthProvider, RequireAuth } from './auth';
import { MES_VOYAGES_ENABLED } from './config';
import { PageLoader, PageShell, Alert } from './ui';

const HomePage = lazy(() => import('./pages/HomePage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const TripFormPage = lazy(() => import('./pages/TripFormPage'));
const TripPage = lazy(() => import('./pages/TripPage'));
const SaveSearchPage = lazy(() => import('./pages/SaveSearchPage'));
const AddItineraryPage = lazy(() => import('./pages/AddItineraryPage'));
const SaveJourneyPage = lazy(() => import('./pages/SaveJourneyPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const SharedTripPage = lazy(() => import('./pages/SharedTripPage'));

/** Pages personnelles : jamais indexées par les moteurs de recherche. */
function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}

function NotConfigured() {
  return (
    <PageShell title="Mes voyages">
      <Alert tone="info">
        L'espace personnel arrive bientôt. En attendant, les voyages choisis sur la page Trajets restent gardés dans ce
        navigateur.
      </Alert>
    </PageShell>
  );
}

export default function MesVoyagesApp() {
  useNoIndex();
  usePageMeta('Mes voyages', 'Gardez les trajets en train qui vous plaisent et retrouvez-les sur tous vos appareils.');

  if (!MES_VOYAGES_ENABLED) return <NotConfigured />;

  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="connexion" element={<SignInPage />} />
          <Route path="mot-de-passe" element={<ResetPasswordPage />} />
          {/* lien de partage : lisible sans compte */}
          <Route path="partage" element={<SharedTripPage />} />
          <Route path="nouveau" element={<RequireAuth><TripFormPage /></RequireAuth>} />
          <Route path="voyage/:id" element={<RequireAuth><TripPage /></RequireAuth>} />
          <Route path="voyage/:id/modifier" element={<RequireAuth><TripFormPage /></RequireAuth>} />
          <Route path="sauvegarder" element={<RequireAuth><SaveSearchPage /></RequireAuth>} />
          <Route path="enregistrer" element={<RequireAuth><SaveJourneyPage /></RequireAuth>} />
          <Route path="ajouter" element={<RequireAuth><AddItineraryPage /></RequireAuth>} />
          <Route path="compte" element={<RequireAuth><AccountPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/mes-voyages" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
