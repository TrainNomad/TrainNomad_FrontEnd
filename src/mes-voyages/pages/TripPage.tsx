// /mes-voyages/voyage/:id : un voyage — ses trajets enregistrés (détails, actualisation, suppression), ses dates,
// ses notes. Un voyage sans trajet est un projet : on peut y rechercher ou y saisir un trajet.
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CalendarPlus, Check, Map as MapIcon, PenLine, Pencil, Search, Share2, Trash2 } from 'lucide-react';
import { deleteLeg, deleteTrip, getTrip, reorderLegs } from '../lib/api';
import { errorMessage } from '../lib/errors';
import type { TripWithDetails } from '../lib/types';
import { Alert, Button, buttonClass, Card, ConfirmButton, PageLoader, PageShell, SectionTitle, formatPeriod } from '../ui';
import { StatusBadge } from '../components/TripCard';
import { LegCard } from '../components/LegCard';
import { Budget } from '../components/Budget';
import { CarbonSummary } from '../components/CarbonSummary';
import { SharePanel } from '../components/SharePanel';
import { downloadCalendar } from '../lib/calendar';

// Carte Leaflet : chargée seulement à l'ouverture
const TripMap = lazy(() => import('../components/TripMap'));
import { ManualLegForm, SearchForTrip } from '../components/AddLeg';
import { LocalItineraries, readLocalVoyages } from '../components/LocalItineraries';

export default function TripPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripWithDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [adding, setAdding] = useState<'search' | 'manual' | null>(null);
  const [sharing, setSharing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const localVoyages = useMemo(readLocalVoyages, []);
  const justSaved = params.has('enregistre') ? 'new' : params.has('ajoute') ? 'added' : params.has('deja') ? 'already' : null;

  useEffect(() => {
    let active = true;
    getTrip(id)
      .then((t) => {
        if (!active) return;
        if (!t) setNotFound(true);
        else setTrip(t);
      })
      .catch((err) => active && setError(errorMessage(err)));
    return () => {
      active = false;
    };
  }, [id]);

  if (notFound) {
    return (
      <PageShell title="Voyage introuvable" back={{ to: '/mes-voyages', label: 'Mes voyages' }}>
        <Alert tone="warning">Ce voyage n'existe plus ou n'appartient pas à ce compte.</Alert>
      </PageShell>
    );
  }
  if (!trip) {
    return error ? (
      <PageShell title="Mes voyages" back={{ to: '/mes-voyages', label: 'Mes voyages' }}>
        <Alert tone="error">{error}</Alert>
      </PageShell>
    ) : (
      <PageLoader />
    );
  }

  const legs = trip.legs;
  const journeys = legs.flatMap((l) => (l.itinerary_snapshot ? [l.itinerary_snapshot] : []));

  const moveLeg = async (index: number, direction: -1 | 1) => {
    const order = [...legs];
    const [moved] = order.splice(index, 1);
    order.splice(index + direction, 0, moved);
    const previous = trip;
    setTrip({ ...trip, legs: order.map((l, position) => ({ ...l, position })) });
    try {
      await reorderLegs(order.map((l) => l.id));
    } catch (err) {
      setTrip(previous);
      setError(errorMessage(err));
    }
  };

  const removeLeg = async (legId: string) => {
    try {
      await deleteLeg(legId);
      setTrip((t) => (t ? { ...t, legs: t.legs.filter((l) => l.id !== legId) } : t));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <PageShell
      back={{ to: '/mes-voyages', label: 'Mes voyages' }}
      title={trip.title}
      subtitle={
        <span className="inline-flex flex-wrap items-center gap-2">
          {formatPeriod(trip.start_date, trip.end_date)}
          {trip.status !== 'planned' && <StatusBadge status={trip.status} />}
        </span>
      }
      actions={
        <>
          {journeys.length > 0 && (
            <Button variant="primary" onClick={() => setShowMap(true)}>
              <MapIcon className="w-4 h-4" aria-hidden />
              Carte
            </Button>
          )}
          {legs.length > 0 && (
            <Button onClick={() => downloadCalendar(trip.title, legs)} title="Fichier .ics pour Google Agenda, Apple Calendrier, Outlook">
              <CalendarPlus className="w-4 h-4" aria-hidden />
              Calendrier
            </Button>
          )}
          <Button onClick={() => setSharing(!sharing)} aria-expanded={sharing}>
            <Share2 className="w-4 h-4" aria-hidden />
            {trip.share_token ? 'Partagé' : 'Partager'}
          </Button>
          <Link to={`/mes-voyages/voyage/${trip.id}/modifier`} className={buttonClass('secondary')}>
            <Pencil className="w-4 h-4" aria-hidden />
            Modifier
          </Link>
          <ConfirmButton
            size="md"
            label="Supprimer"
            confirmLabel="Supprimer ce voyage ?"
            icon={<Trash2 className="w-4 h-4" aria-hidden />}
            onConfirm={async () => {
              try {
                await deleteTrip(trip.id);
                navigate('/mes-voyages', { replace: true });
              } catch (err) {
                setError(errorMessage(err));
              }
            }}
          />
        </>
      }
    >
      {justSaved && (
        <div className="mb-6">
          <Alert tone="info">
            <span className="inline-flex items-center gap-1.5 font-bold">
              <Check className="w-4 h-4" aria-hidden />
              {justSaved === 'new' ? 'Trajet enregistré.' : justSaved === 'added' ? 'Trajet ajouté à ce voyage.' : 'Ce trajet était déjà enregistré.'}
            </span>{' '}
            Retrouvez-le dans Mes voyages, sur tous les appareils où vous êtes connecté.
          </Alert>
        </div>
      )}
      {error && <div className="mb-6"><Alert tone="error">{error}</Alert></div>}
      {showMap && (
        <Suspense fallback={null}>
          <TripMap
            title={trip.title}
            stages={legs.map((l, i) => ({ label: `Étape ${i + 1}`, journey: l.itinerary_snapshot }))}
            onClose={() => setShowMap(false)}
          />
        </Suspense>
      )}
      {sharing && (
        <div className="mb-6">
          <SharePanel trip={trip} onClose={() => setSharing(false)} onTripChange={(next) => setTrip((t) => (t ? { ...t, ...next } : t))} />
        </div>
      )}

      <div className="flex flex-col gap-10">
        <section>
          <SectionTitle>{legs.length > 1 ? 'Trajets' : 'Trajet'}</SectionTitle>
          {legs.length === 0 ? (
            <Card className="p-5">
              <p className="font-bold text-slate-900">Projet enregistré</p>
              <p className="text-sm text-slate-500 mt-1">Aucun itinéraire sélectionné pour le moment.</p>
            </Card>
          ) : (
            <ol className="flex flex-col gap-3">
              {legs.map((leg, i) => (
                <LegCard
                  key={leg.id}
                  leg={leg}
                  index={i}
                  count={legs.length}
                  onMove={(dir) => moveLeg(i, dir)}
                  onDelete={() => removeLeg(leg.id)}
                  onReplaced={(next) => setTrip((t) => (t ? { ...t, legs: t.legs.map((l) => (l.id === next.id ? next : l)) } : t))}
                />
              ))}
            </ol>
          )}

          <div className="mt-3">
            {adding === null ? (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setAdding('search')}>
                  <Search className="w-4 h-4" aria-hidden />
                  {legs.length === 0 ? 'Rechercher pour cette date' : 'Ajouter un trajet'}
                </Button>
                <Button variant="ghost" onClick={() => setAdding('manual')}>
                  <PenLine className="w-4 h-4" aria-hidden />
                  Saisir un trajet à la main
                </Button>
              </div>
            ) : (
              <Card className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-slate-900">{adding === 'search' ? 'Rechercher un train' : 'Saisir un trajet'}</p>
                  <Button size="sm" variant="ghost" onClick={() => setAdding(null)}>Fermer</Button>
                </div>
                {adding === 'search' ? (
                  <SearchForTrip trip={trip} />
                ) : (
                  <ManualLegForm
                    trip={trip}
                    position={legs.length}
                    onCancel={() => setAdding(null)}
                    onAdded={(leg) => {
                      setTrip((t) => (t ? { ...t, legs: [...t.legs, leg] } : t));
                      setAdding(null);
                    }}
                  />
                )}
              </Card>
            )}
          </div>

          {localVoyages.length > 0 && (
            <LocalForTrip tripId={trip.id} voyages={localVoyages} exclude={legs.map((l) => l.departure_local ?? '')} />
          )}
        </section>

        {legs.length > 0 && (
          <section>
            <SectionTitle>Budget</SectionTitle>
            <Budget trip={trip} legs={legs} onTripChange={(next) => setTrip((t) => (t ? { ...t, ...next } : t))} />
          </section>
        )}

        {journeys.length > 0 && (
          <section>
            <SectionTitle>Empreinte carbone</SectionTitle>
            <CarbonSummary journeys={journeys} manualCount={legs.length - journeys.length} />
          </section>
        )}

        {trip.notes && (
          <section>
            <SectionTitle aside={<Link to={`/mes-voyages/voyage/${trip.id}/modifier`} className="text-xs font-semibold text-slate-500 hover:text-brand">Modifier</Link>}>
              Notes
            </SectionTitle>
            <Card className="p-5">
              <p className="text-sm text-slate-700 whitespace-pre-line break-words">{trip.notes}</p>
            </Card>
          </section>
        )}
      </div>
    </PageShell>
  );
}

function LocalForTrip({ tripId, voyages, exclude }: { tripId: string; voyages: ReturnType<typeof readLocalVoyages>; exclude: string[] }) {
  if (voyages.every((v) => exclude.includes(v.outbound.journey.departure))) return null;
  return (
    <Card className="mt-4">
      <p className="px-4 sm:px-5 pt-4 text-xs font-bold uppercase tracking-wider text-slate-500">Choisis sur cet appareil</p>
      <LocalItineraries voyages={voyages} tripId={tripId} exclude={exclude} />
    </Card>
  );
}
