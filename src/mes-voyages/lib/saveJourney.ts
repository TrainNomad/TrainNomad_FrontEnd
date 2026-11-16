// « Enregistrer ce trajet » : le trajet choisi sur la page Trajets (aller, et retour s'il y en a un, gardé dans le
// navigateur par src/lib/voyages.ts) est enregistré dans le compte, retrouvé sur tous les appareils.
//
// Où va le trajet :
//   1. dans le projet d'où est partie la recherche (« Rechercher pour cette date », voir ../target.ts) ;
//   2. sinon, dans le seul projet encore sans trajet dont les dates couvrent le départ ;
//   3. sinon, dans un nouveau voyage.
import type { Voyage } from '../../lib/voyages';
import { getTargetTrip, setTargetTrip } from '../target';
import { addLegs, createTrip, deleteTrip, listTrips } from './api';
import { legFromJourney, localDate } from './itinerary';
import type { TripSummary } from './types';

export interface SaveResult {
  tripId: string;
  /** Déjà enregistré auparavant : rien n'a été créé */
  already: boolean;
  /** Ajouté à un projet existant (et non à un nouveau voyage) */
  addedToProject: boolean;
}

const sameJourney = (voyage: Voyage) => {
  const legs = [voyage.outbound, ...(voyage.inbound ? [voyage.inbound] : [])];
  return (saved: { departure_local: string | null; arrival_local: string | null }[]) =>
    legs.every(({ journey }) => saved.some((l) => l.departure_local === journey.departure && l.arrival_local === journey.arrival));
};

/** Projet qui doit recevoir ce trajet, s'il y en a un */
function projectFor(trips: TripSummary[], firstDay: string): TripSummary | null {
  const target = getTargetTrip();
  const targeted = target && trips.find((t) => t.id === target.id);
  if (targeted) return targeted;
  const covering = trips.filter(
    (t) => t.legs.length === 0 && t.status !== 'cancelled' && t.start_date <= firstDay && (t.end_date ?? t.start_date) >= firstDay,
  );
  return covering.length === 1 ? covering[0] : null;
}

// Un même trajet n'est enregistré qu'une fois, même si la page est ouverte deux fois de suite
const inflight = new Map<string, Promise<SaveResult>>();

export function saveJourney(voyage: Voyage): Promise<SaveResult> {
  const pending = inflight.get(voyage.id);
  if (pending) return pending;
  const run = (async (): Promise<SaveResult> => {
    const trips = await listTrips();
    const existing = trips.find((t) => sameJourney(voyage)(t.legs));
    if (existing) {
      setTargetTrip(null);
      return { tripId: existing.id, already: true, addedToProject: false };
    }

    const legs = [voyage.outbound, ...(voyage.inbound ? [voyage.inbound] : [])];
    const firstDay = localDate(legs[0].journey.departure)!;
    const lastDay = localDate(legs[legs.length - 1].journey.arrival)!;
    const project = projectFor(trips, firstDay);

    const trip =
      project ??
      (await createTrip({
        title: `${voyage.outbound.from.name} → ${voyage.outbound.to.name}`.slice(0, 120),
        start_date: firstDay,
        end_date: lastDay > firstDay ? lastDay : null,
        status: 'planned',
        notes: null,
      }));
    const start = project ? project.legs.reduce((max, l) => Math.max(max, l.position + 1), 0) : 0;
    try {
      await addLegs(
        legs.map((leg, i) =>
          legFromJourney({
            tripId: trip.id,
            position: start + i,
            network: voyage.network,
            from: leg.from,
            to: leg.to,
            date: leg.date,
            journey: leg.journey,
            // moment où le trajet a été choisi dans les résultats
            fetchedAt: voyage.updatedAt,
          }),
        ),
      );
    } catch (err) {
      // pas de voyage vide laissé derrière un échec (un projet existant, lui, est conservé)
      if (!project) await deleteTrip(trip.id).catch(() => {});
      throw err;
    }
    setTargetTrip(null);
    return { tripId: trip.id, already: false, addedToProject: !!project };
  })();
  inflight.set(voyage.id, run);
  run.finally(() => inflight.delete(voyage.id)).catch(() => {});
  return run;
}
