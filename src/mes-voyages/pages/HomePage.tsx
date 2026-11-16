// /mes-voyages : trajets enregistrés, recherches sauvegardées, projets de voyage, voyages passés.
// Visiteur non connecté : présentation de l'espace et connexion.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, CalendarDays, Plus, RefreshCw, ShieldCheck, TrainFront, UserRound } from 'lucide-react';
import { useAuth } from '../auth';
import { profileOf } from '../lib/account';
import { listSavedSearches, listTrips } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { todayIso } from '../lib/itinerary';
import type { SavedSearch, TripSummary } from '../lib/types';
import { Alert, buttonClass, Card, EmptyState, PageLoader, PageShell, SectionTitle } from '../ui';
import { TripCard } from '../components/TripCard';
import { SavedSearches } from '../components/SavedSearches';
import { LocalItineraries, readLocalVoyages } from '../components/LocalItineraries';

function Welcome() {
  const points = [
    { icon: <TrainFront className="w-5 h-5" aria-hidden />, title: 'Gardez un trajet', text: 'Un trajet vous plaît ? Enregistrez-le avec ses trains, ses horaires et ses correspondances.' },
    { icon: <RefreshCw className="w-5 h-5" aria-hidden />, title: 'Retrouvez-le, à jour', text: 'Sur votre téléphone comme sur votre ordinateur, et actualisez la recherche quand vous voulez.' },
    { icon: <Bookmark className="w-5 h-5" aria-hidden />, title: 'Sauvegardez vos recherches', text: 'Relancez un départ, une arrivée et vos critères en un clic.' },
  ];
  return (
    <PageShell title="Mes voyages" subtitle="Vous avez trouvé un trajet qui vous plaît ? Gardez-le pour plus tard.">
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {points.map((p) => (
          <Card key={p.title} className="p-5">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-3">{p.icon}</div>
            <div className="font-bold text-slate-900">{p.title}</div>
            <p className="text-sm text-slate-500 mt-1">{p.text}</p>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/mes-voyages/connexion" className={buttonClass('primary')}>
          Se connecter ou créer un compte
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-brand" aria-hidden />
          Sans mot de passe · la recherche reste utilisable sans compte
        </span>
      </div>
    </PageShell>
  );
}

function Dashboard() {
  const { session } = useAuth();
  const firstName = profileOf(session?.user).firstName;
  const [trips, setTrips] = useState<TripSummary[] | null>(null);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const localVoyages = useMemo(readLocalVoyages, []);

  useEffect(() => {
    let active = true;
    Promise.all([listTrips(), listSavedSearches()])
      .then(([t, s]) => {
        if (!active) return;
        setTrips(t);
        setSearches(s);
      })
      .catch((err) => active && setError(errorMessage(err)));
    return () => {
      active = false;
    };
  }, []);

  const today = todayIso();
  const all = trips ?? [];
  const isPast = (t: TripSummary) => (t.end_date ?? t.start_date) < today;
  const saved = all.filter((t) => !isPast(t) && t.legs.length > 0);
  const projects = all.filter((t) => !isPast(t) && t.legs.length === 0);
  const past = all.filter(isPast).reverse();
  // trajets de cet appareil pas encore enregistrés dans le compte
  const savedDepartures = all.flatMap((t) => t.legs.map((l) => l.departure_local ?? ''));

  return (
    <PageShell
      title="Mes voyages"
      subtitle={firstName ? `Bonjour ${firstName} !` : undefined}
      actions={
        <>
          <Link to="/mes-voyages/compte" className={buttonClass('ghost')}>
            <UserRound className="w-4 h-4" aria-hidden />
            Compte
          </Link>
          <Link to="/mes-voyages/nouveau" className={buttonClass('secondary')}>
            <CalendarDays className="w-4 h-4" aria-hidden />
            Préparer un voyage
          </Link>
        </>
      }
    >
      {error && <div className="mb-6"><Alert tone="error">{error}</Alert></div>}
      {trips === null && !error ? (
        <PageLoader />
      ) : (
        <div className="flex flex-col gap-10">
          <section>
            <SectionTitle>Trajets enregistrés</SectionTitle>
            {saved.length === 0 ? (
              <Card>
                <EmptyState icon={<TrainFront className="w-6 h-6" aria-hidden />} title="Aucun trajet enregistré">
                  Choisissez un trajet dans les résultats de recherche, puis « Enregistrer ce trajet ».
                  <div className="mt-4">
                    <Link to="/trajets" className={buttonClass('primary', 'sm')}>
                      Rechercher un trajet
                    </Link>
                  </div>
                </EmptyState>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {saved.map((t) => <TripCard key={t.id} trip={t} />)}
              </div>
            )}
          </section>

          {localVoyages.some((v) => !savedDepartures.includes(v.outbound.journey.departure)) && (
            <section>
              <SectionTitle>Choisis sur cet appareil</SectionTitle>
              <Card>
                <p className="px-4 sm:px-5 pt-4 text-xs text-slate-500">
                  Trajets choisis sur la page Trajets, gardés dans ce navigateur seulement. Enregistrez-les pour les retrouver partout.
                </p>
                <LocalItineraries voyages={localVoyages} exclude={savedDepartures} />
              </Card>
            </section>
          )}

          <section>
            <SectionTitle>Recherches sauvegardées</SectionTitle>
            <SavedSearches searches={searches} onChange={setSearches} />
          </section>

          <section>
            <SectionTitle
              aside={
                <Link to="/mes-voyages/nouveau" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand">
                  <Plus className="w-3.5 h-3.5" aria-hidden />
                  Préparer un voyage
                </Link>
              }
            >
              Projets de voyage
            </SectionTitle>
            {projects.length === 0 ? (
              <p className="text-sm text-slate-500">
                Un voyage dans quelques mois, avant que les horaires soient publiés ? Créez-le maintenant, vous ajouterez le train plus tard.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {projects.map((t) => <TripCard key={t.id} trip={t} />)}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <SectionTitle>Voyages passés</SectionTitle>
              <div className="flex flex-col gap-3">
                {past.map((t) => <TripCard key={t.id} trip={t} past />)}
              </div>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}

export default function HomePage() {
  const { session, loading } = useAuth();
  if (loading) return <PageLoader />;
  return session ? <Dashboard /> : <Welcome />;
}
