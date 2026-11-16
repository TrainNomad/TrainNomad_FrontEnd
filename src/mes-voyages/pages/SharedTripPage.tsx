// /mes-voyages/partage#<jeton> : voyage partagé, en lecture seule et sans compte. Le jeton est lu après « # » (jamais
// envoyé au serveur du site ni à la mesure d'audience). Un visiteur connecté peut copier le voyage dans son espace.
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarPlus, Copy, History, Map as MapIcon, TrainFront } from 'lucide-react';
import { formatDuration, formatTime } from '../../lib/format';
import { isTrainLeg } from '../../types/api';
import { addLegs, createTrip, deleteTrip, getSharedTrip } from '../lib/api';
import { downloadCalendar } from '../lib/calendar';
import { errorMessage } from '../lib/errors';
import { localDate } from '../lib/itinerary';
import type { SharedTrip } from '../lib/types';
import { useAuth } from '../auth';
import { Alert, Button, buttonClass, Card, PageLoader, PageShell, formatDay, formatPeriod, formatStamp } from '../ui';
import { CarbonSummary } from '../components/CarbonSummary';

const TripMap = lazy(() => import('../components/TripMap'));

export default function SharedTripPage() {
  const token = useMemo(() => window.location.hash.replace(/^#/, ''), []);
  const { session } = useAuth();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<SharedTrip | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) return setTrip(null);
    getSharedTrip(token)
      .then(setTrip)
      .catch((err) => setError(errorMessage(err)));
  }, [token]);

  const journeys = useMemo(() => (trip?.legs ?? []).flatMap((l) => (l.itinerary_snapshot ? [l.itinerary_snapshot] : [])), [trip]);

  if (error) {
    return (
      <PageShell title="Voyage partagé">
        <Alert tone="error">{error}</Alert>
      </PageShell>
    );
  }
  if (trip === undefined) return <PageLoader />;
  if (trip === null) {
    return (
      <PageShell title="Lien de partage inactif">
        <Alert tone="warning">Ce lien n'existe pas ou a été désactivé par la personne qui l'a partagé.</Alert>
      </PageShell>
    );
  }

  // Copier dans mon espace (visiteur connecté) : nouveau voyage avec les mêmes trajets
  const copyToMine = async () => {
    setCopying(true);
    setError(null);
    try {
      const created = await createTrip({ title: trip.title, start_date: trip.start_date, end_date: trip.end_date, status: 'planned', notes: null });
      try {
        await addLegs(
          trip.legs.map(({ id: _id, ...leg }, i) => ({
            ...leg,
            trip_id: created.id,
            position: i,
            departure_timezone: null,
            arrival_timezone: null,
            notes: null,
            price_amount: null,
            price_kind: null,
            price_currency: 'EUR',
          })),
        );
      } catch (err) {
        await deleteTrip(created.id).catch(() => {});
        throw err;
      }
      navigate(`/mes-voyages/voyage/${created.id}?enregistre=1`);
    } catch (err) {
      setError(errorMessage(err));
      setCopying(false);
    }
  };

  return (
    <PageShell
      title={trip.title}
      subtitle={<>Voyage partagé · {formatPeriod(trip.start_date, trip.end_date)}</>}
      actions={
        <>
        {journeys.length > 0 && (
          <Button variant="primary" onClick={() => setShowMap(true)}>
            <MapIcon className="w-4 h-4" aria-hidden />
            Carte
          </Button>
        )}
        <Button onClick={() => downloadCalendar(trip.title, trip.legs.map((l) => ({ ...l, itinerary_snapshot: l.itinerary_snapshot ?? null })))}>
          <CalendarPlus className="w-4 h-4" aria-hidden />
          Ajouter au calendrier
        </Button>
        </>
      }
    >
      {showMap && (
        <Suspense fallback={null}>
          <TripMap
            title={trip.title}
            stages={trip.legs.map((l, i) => ({ label: `Étape ${i + 1}`, journey: l.itinerary_snapshot }))}
            onClose={() => setShowMap(false)}
          />
        </Suspense>
      )}
      <div className="flex flex-col gap-6">
        {trip.legs.length === 0 ? (
          <Card className="p-5">
            <p className="font-bold text-slate-900">Projet de voyage</p>
            <p className="text-sm text-slate-500 mt-1">Aucun trajet choisi pour le moment.</p>
          </Card>
        ) : (
          <ol className="flex flex-col gap-3">
            {trip.legs.map((leg) => {
              const day = localDate(leg.departure_local);
              const trains = leg.itinerary_snapshot?.legs.filter(isTrainLeg) ?? [];
              const t = (v: string | null) => (v && v.length >= 16 ? formatTime(v) : '—');
              return (
                <li key={leg.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span className="normal-case tracking-normal font-semibold">{day ? formatDay(day) : 'Date à préciser'}</span>
                  </div>
                  <div className="mt-2 text-lg font-extrabold text-slate-900 tabular-nums break-words">
                    {t(leg.departure_local)} {leg.origin_name} → {t(leg.arrival_local)} {leg.destination_name}
                  </div>
                  {leg.itinerary_snapshot && (
                    <div className="text-xs text-slate-500">
                      {formatDuration(leg.itinerary_snapshot.duration_min)} ·{' '}
                      {leg.itinerary_snapshot.transfers === 0 ? 'direct' : `${leg.itinerary_snapshot.transfers} corresp.`}
                    </div>
                  )}
                  {trains.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-sm text-slate-600">
                      {trains.map((tr, i) => (
                        <li key={i}>
                          <strong className="text-slate-800">{[tr.train_type, tr.train_number].filter(Boolean).join(' ')}</strong> ·{' '}
                          {formatTime(tr.departure)} {tr.from.name} → {formatTime(tr.arrival)} {tr.to.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    (leg.operator_name || leg.train_number) && (
                      <p className="mt-2 text-sm text-slate-600">{[leg.operator_name, leg.train_number].filter(Boolean).join(' · ')}</p>
                    )
                  )}
                  {leg.source_fetched_at && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-800">
                      <History className="w-3.5 h-3.5" aria-hidden />
                      Horaires enregistrés le {formatStamp(leg.source_fetched_at)} : ils peuvent avoir changé.
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <CarbonSummary journeys={journeys} manualCount={trip.legs.length - journeys.length} />

        <Card className="p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-sm text-slate-600">
            <TrainFront className="w-4 h-4 text-brand" aria-hidden />
            {session ? 'Gardez une copie de ce voyage dans votre espace.' : 'Préparez vous aussi vos voyages en train avec TrainNomad.'}
          </p>
          {session ? (
            <Button variant="primary" busy={copying} onClick={copyToMine}>
              <Copy className="w-4 h-4" aria-hidden />
              Copier dans Mes voyages
            </Button>
          ) : (
            <Link
              to={`/mes-voyages/connexion?mode=inscription&suite=${encodeURIComponent(`/mes-voyages/partage#${token}`)}`}
              className={buttonClass('primary')}
            >
              Créer mon compte
            </Link>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
