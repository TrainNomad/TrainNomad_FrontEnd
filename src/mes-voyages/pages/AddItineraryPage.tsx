// /mes-voyages/ajouter?voyage=<id local>[&trip=<id>]
// Ajoute à un voyage du compte un itinéraire choisi sur la page Trajets (aller, et retour s'il y en a un), lu dans
// ce navigateur (src/lib/voyages.ts). Chaque trajet est enregistré comme une photographie datée du résultat.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getVoyage } from '../../lib/voyages';
import { formatTime } from '../../lib/format';
import { addLegs, createTrip, getTrip, listTrips } from '../lib/api';
import { errorMessage, MesVoyagesError } from '../lib/errors';
import { legFromJourney, localDate, todayIso } from '../lib/itinerary';
import type { TripSummary } from '../lib/types';
import { Alert, Button, Card, Field, formatDay, formatPeriod, formatStamp, inputClass, PageLoader, PageShell } from '../ui';

const NEW_TRIP = '__nouveau__';

export default function AddItineraryPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const voyage = useMemo(() => getVoyage(params.get('voyage') ?? ''), [params]);
  const [trips, setTrips] = useState<TripSummary[] | null>(null);
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const legs = useMemo(
    () => (voyage ? [{ name: 'Aller', leg: voyage.outbound }, ...(voyage.inbound ? [{ name: 'Retour', leg: voyage.inbound }] : [])] : []),
    [voyage],
  );
  const firstDay = legs.length ? localDate(legs[0].leg.journey.departure)! : todayIso();
  const lastDay = legs.length ? localDate(legs[legs.length - 1].leg.journey.arrival)! : firstDay;

  useEffect(() => {
    listTrips()
      .then((list) => {
        const upcoming = list.filter((t) => (t.end_date ?? t.start_date) >= todayIso() || t.id === params.get('trip'));
        setTrips(upcoming);
        // voyage indiqué, sinon celui dont les dates couvrent ce trajet, sinon un nouveau voyage
        const requested = upcoming.find((t) => t.id === params.get('trip'));
        const covering = upcoming.find((t) => t.start_date <= firstDay && (t.end_date ?? t.start_date) >= firstDay);
        setTarget(requested?.id ?? covering?.id ?? NEW_TRIP);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [params, firstDay]);

  if (!voyage) {
    return (
      <PageShell title="Ajouter à un voyage" back={{ to: '/mes-voyages', label: 'Mes voyages' }}>
        <Alert tone="warning">
          Cet itinéraire n'est plus gardé dans ce navigateur. Choisissez de nouveau votre train depuis la{' '}
          <Link to="/trajets" className="underline">page Trajets</Link>.
        </Alert>
      </PageShell>
    );
  }
  if (trips === null && !error) return <PageLoader />;

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      let tripId = target;
      let position = 0;
      if (target === NEW_TRIP) {
        const created = await createTrip({
          title: `${voyage.outbound.from.name} → ${voyage.outbound.to.name}`.slice(0, 120),
          start_date: firstDay,
          end_date: lastDay > firstDay ? lastDay : null,
          status: 'planned',
          notes: null,
        });
        tripId = created.id;
      } else {
        const existing = await getTrip(target);
        if (!existing) throw new MesVoyagesError('trip_not_found');
        // même trajet déjà enregistré (même départ, même arrivée, même heure) : pas de doublon
        const already = (j: (typeof legs)[number]['leg']['journey']) =>
          existing.legs.some((l) => l.departure_local === j.departure && l.arrival_local === j.arrival && l.origin_name === j.from.name);
        if (legs.every(({ leg }) => already(leg.journey))) {
          navigate(`/mes-voyages/voyage/${target}`);
          return;
        }
        position = existing.legs.length;
      }
      await addLegs(
        legs.map(({ leg }, i) =>
          legFromJourney({
            tripId,
            position: position + i,
            network: voyage.network,
            from: leg.from,
            to: leg.to,
            date: leg.date,
            journey: leg.journey,
            fetchedAt: voyage.updatedAt,
          }),
        ),
      );
      navigate(`/mes-voyages/voyage/${tripId}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <PageShell title="Ajouter à un voyage" back={{ to: '/mes-voyages', label: 'Mes voyages' }}>
      <Card className="p-5 sm:p-6 max-w-xl">
        <ul className="flex flex-col gap-3">
          {legs.map(({ name, leg }) => (
            <li key={name} className="text-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">{name} · {formatDay(leg.journey.departure)}</div>
              <div className="font-bold text-slate-900">
                {formatTime(leg.journey.departure)} {leg.journey.from.name} → {formatTime(leg.journey.arrival)} {leg.journey.to.name}
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Horaires affichés lors du choix, le {formatStamp(voyage.updatedAt)}. Ils peuvent avoir changé : vous pourrez actualiser la
          recherche depuis le voyage.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <Field label="Voyage" htmlFor="mv-add-target">
            <select id="mv-add-target" value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass}>
              <option value={NEW_TRIP}>Nouveau voyage : {voyage.outbound.from.name} → {voyage.outbound.to.name}</option>
              {(trips ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({formatPeriod(t.start_date, t.end_date)})
                </option>
              ))}
            </select>
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <Button variant="primary" busy={busy} onClick={add}>
            <Plus className="w-4 h-4" aria-hidden />
            {target === NEW_TRIP ? 'Créer le voyage avec ces trajets' : 'Ajouter au voyage'}
          </Button>
        </div>
      </Card>
    </PageShell>
  );
}
