// Temps réel des trains d'un trajet enregistré (GET /realtime de l'API Europe), actualisé chaque minute.
// Interrogé seulement autour du voyage : la SNCF publie un train environ 1 h avant son départ et le retire après
// son arrivée ; en dehors de cette fenêtre (trajet de la semaine prochaine…), aucune requête n'est faite.
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { isTrainLeg, type Journey, type RealtimeResponse, type RealtimeTrain, type TrainLeg } from '../types/api';

const REFRESH_MS = 60_000;
const BEFORE_MS = 2 * 3600_000; // commencer 2 h avant le premier départ
const AFTER_MS = 3600_000; // continuer 1 h après l'arrivée prévue (retards)

/** Clé d'un train pour /realtime : OPERATEUR:NUMERO:DATE DE MONTÉE */
export const realtimeKey = (leg: TrainLeg) => `${leg.operator}:${leg.train_number}:${leg.departure.slice(0, 10)}`;

function inWindow(journey: Journey, now: number): boolean {
  const start = Date.parse(journey.departure) - BEFORE_MS;
  const end = Date.parse(journey.arrival) + AFTER_MS;
  return now >= start && now <= end;
}

export interface TrainsRealtime {
  /** Trains connus en temps réel, par clé realtimeKey (statut « unknown » exclu) */
  trains: Map<string, RealtimeTrain>;
  /** Le suivi est en cours (fenêtre du voyage et temps réel disponible côté API) */
  active: boolean;
  /** Heure du flux de la compagnie */
  updated?: string;
}

export function useTrainsRealtime(journey: Journey | null | undefined): TrainsRealtime {
  const [state, setState] = useState<TrainsRealtime>({ trains: new Map(), active: false });

  useEffect(() => {
    if (!journey) return;
    const keys = [...new Set(journey.legs.filter(isTrainLeg).filter((l) => l.train_number).map(realtimeKey))];
    if (keys.length === 0) return;

    let stopped = false;
    let controller: AbortController | null = null;

    const load = async () => {
      if (stopped || document.visibilityState === 'hidden') return;
      if (!inWindow(journey, Date.now())) {
        setState((s) => (s.active ? { trains: new Map(), active: false } : s));
        return;
      }
      controller?.abort();
      controller = new AbortController();
      try {
        const res = await fetch(`${API_BASE_URL}/realtime?trains=${encodeURIComponent(keys.join(','))}`, {
          signal: controller.signal,
        });
        if (res.status === 503) {
          stopped = true; // temps réel désactivé sur l'API : inutile de réessayer
          return;
        }
        if (!res.ok) return;
        const data: RealtimeResponse = await res.json();
        const trains = new Map<string, RealtimeTrain>();
        data.trains.forEach((t, i) => t.status !== 'unknown' && trains.set(keys[i], t));
        setState({ trains, active: true, updated: data.realtime.updated });
      } catch {
        // réseau indisponible : on garde le dernier état, nouvel essai à la prochaine minute
      }
    };

    load();
    const timer = window.setInterval(load, REFRESH_MS);
    document.addEventListener('visibilitychange', load);
    return () => {
      stopped = true;
      controller?.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', load);
    };
  }, [journey]);

  return state;
}

/**
 * Retard (minutes) du train à une heure prévue, pour une gare absente du flux (NS sans heure, Renfe : un seul
 * arrêt) : celui du dernier arrêt connu avant cette heure, sinon du premier connu, sinon le retard maximal.
 */
export function realtimeDelayAt(train: RealtimeTrain, scheduled: string): number {
  const t = Date.parse(scheduled);
  let last: number | null = null;
  let first: number | null = null;
  for (const s of train.stops ?? []) {
    for (const [sched, real] of [
      [s.scheduled_arrival, s.real_arrival],
      [s.scheduled_departure, s.real_departure],
    ]) {
      if (!sched || !real) continue;
      const delay = Math.round((Date.parse(real) - Date.parse(sched)) / 60_000);
      if (first === null) first = delay;
      if (Date.parse(sched) <= t) last = delay;
    }
  }
  return Math.max(0, last ?? first ?? train.delay_max_min);
}

/** Heure ISO décalée de `minutes`, dans le fuseau de l'heure d'origine (« 2026-11-08T14:35:00+01:00 »). */
export function shiftIso(iso: string, minutes: number): string {
  const offset = iso.slice(19); // "+01:00"
  const sign = offset[0] === '-' ? -1 : 1;
  const offsetMin = sign * (+offset.slice(1, 3) * 60 + +offset.slice(4, 6));
  const d = new Date(Date.parse(iso) + (minutes + offsetMin) * 60_000);
  return `${d.toISOString().slice(0, 19)}${offset}`;
}

/**
 * Arrêt du train en temps réel correspondant à une gare du trajet : même gare, sinon même heure prévue, sinon même
 * position dans le trajet (`sequence`, Eurostar : arrêts sans gare ni heure).
 */
export function realtimeStop(
  train: RealtimeTrain,
  stationId: string,
  scheduled: string,
  kind: 'arrival' | 'departure',
  sequence?: number,
) {
  const stops = train.stops ?? [];
  const field = kind === 'arrival' ? 'scheduled_arrival' : 'scheduled_departure';
  const hhmm = scheduled.slice(11, 16);
  return (
    stops.find((s) => !!stationId && s.station.id === stationId && (s[field] ?? '').slice(11, 16) === hhmm) ??
    stops.find((s) => !!stationId && s.station.id === stationId) ??
    stops.find((s) => (s[field] ?? '').slice(11, 16) === hhmm) ??
    (sequence ? stops.find((s) => s.sequence === sequence) : undefined)
  );
}
