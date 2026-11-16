// Suivi en direct d'un trajet enregistré : pour chaque train, retard à la montée et à la descente, suppression,
// messages de la compagnie, et correspondances devenues trop courtes.
import { minutesBetween, RealtimeBadge, RealtimeMessages, RealTimeValue } from '../../components/Realtime';
import { realtimeDelayAt, realtimeKey, realtimeStop, shiftIso, type TrainsRealtime } from '../../hooks/useTrainsRealtime';
import { isTrainLeg, type Journey, type RealtimeTrain, type TrainLeg } from '../../types/api';
import { formatTime } from '../../lib/format';

interface TrainView {
  leg: TrainLeg;
  train: RealtimeTrain;
  realDeparture?: string;
  realArrival?: string;
  status: 'on_time' | 'delayed' | 'cancelled' | 'stop_skipped';
  delayMin: number;
}

export interface LegRealtimeView {
  trains: TrainView[];
  /** Correspondances compromises (gare de changement) */
  atRisk: string[];
  /** Heures réelles du premier départ et de la dernière arrivée, quand elles sont connues */
  departure?: string;
  arrival?: string;
}

export function legRealtimeView(journey: Journey | null, rt: TrainsRealtime): LegRealtimeView | null {
  if (!journey || !rt.active || rt.trains.size === 0) return null;
  const legs = journey.legs;
  const views = new Map<number, TrainView>();
  legs.forEach((leg, i) => {
    if (!isTrainLeg(leg)) return;
    const train = rt.trains.get(realtimeKey(leg));
    if (!train) return;
    // position des gares dans le trajet (Eurostar : arrêts sans gare ni heure)
    const boardSeq = leg.board_sequence;
    const alightSeq = boardSeq ? boardSeq + leg.stops.length - 1 : undefined;
    const board = realtimeStop(train, leg.from.id, leg.departure, 'departure', boardSeq);
    const alight = realtimeStop(train, leg.to.id, leg.arrival, 'arrival', alightSeq);
    // heure réelle du flux ; sinon retard seul de l'arrêt (Eurostar) ; sinon dernier retard connu du train
    const realDeparture =
      board?.real_departure ??
      shiftIso(leg.departure, board?.sequence ? Math.max(0, board.delay_min) : realtimeDelayAt(train, leg.departure));
    const realArrival =
      alight?.real_arrival ??
      shiftIso(leg.arrival, alight?.sequence ? Math.max(0, alight.delay_min) : realtimeDelayAt(train, leg.arrival));
    const delayMin = Math.max(
      realDeparture ? minutesBetween(leg.departure, realDeparture) : 0,
      realArrival ? minutesBetween(leg.arrival, realArrival) : 0,
    );
    const status =
      train.status === 'cancelled'
        ? 'cancelled'
        : board?.skipped || alight?.skipped
          ? 'stop_skipped'
          : delayMin > 0
            ? 'delayed'
            : 'on_time';
    views.set(i, { leg, train, realDeparture, realArrival, status, delayMin });
  });
  if (views.size === 0) return null;

  // Correspondance : avec les retards, reste-t-il le temps minimal de changement ?
  const atRisk: string[] = [];
  legs.forEach((leg, i) => {
    if (leg.type !== 'transfer') return;
    const prevLeg = legs[i - 1];
    const nextLeg = legs[i + 1];
    if (!prevLeg || !nextLeg || !isTrainLeg(prevLeg) || !isTrainLeg(nextLeg)) return;
    const prev = views.get(i - 1);
    const next = views.get(i + 1);
    if (!prev && !next) return;
    const dead = (v?: TrainView) => v?.status === 'cancelled' || v?.status === 'stop_skipped';
    const arr = prev?.realArrival ?? prevLeg.arrival;
    const dep = next?.realDeparture ?? nextLeg.departure;
    if (dead(prev) || dead(next) || minutesBetween(arr, dep) < (leg.min_transfer_min ?? 0)) atRisk.push(leg.from.name);
  });

  const first = legs.findIndex(isTrainLeg);
  const last = legs.length - 1 - [...legs].reverse().findIndex(isTrainLeg);
  return {
    trains: [...views.values()],
    atRisk,
    departure: views.get(first)?.realDeparture,
    arrival: views.get(last)?.realArrival,
  };
}

export function LegRealtime({ view, rt }: { view: LegRealtimeView | null; rt: TrainsRealtime }) {
  if (!rt.active) return null;
  if (!view) {
    return (
      <p className="mt-3 text-xs text-slate-500">
        Suivi en direct : les retards s'afficheront ici dès que la compagnie publie le train (environ 1 h avant le départ).
      </p>
    );
  }
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 space-y-2.5">
      {view.trains.map((t) => (
        <div key={realtimeKey(t.leg)} className="text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-800">
              {t.leg.train_type} <span className="font-semibold text-slate-400">n° {t.leg.train_number}</span>
            </span>
            <RealtimeBadge status={t.status} delayMin={t.delayMin} />
          </div>
          <div className="mt-0.5 text-slate-600 tabular-nums flex flex-wrap gap-x-1.5">
            <RealTimeValue theo={t.leg.departure} real={t.realDeparture} sep=":" /> {t.leg.from.name} →{' '}
            <RealTimeValue theo={t.leg.arrival} real={t.realArrival} sep=":" /> {t.leg.to.name}
          </div>
          <RealtimeMessages messages={t.train.messages} />
        </div>
      ))}
      {view.atRisk.map((station) => (
        <p key={station} className="text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
          Correspondance compromise à {station} : avec le retard, le temps de changement n'est plus suffisant.
        </p>
      ))}
      {rt.updated && <p className="text-[11px] text-slate-400">Information de la compagnie, mise à jour à {formatTime(rt.updated)}</p>}
    </div>
  );
}
