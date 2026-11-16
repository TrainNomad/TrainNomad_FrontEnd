// Affichage du temps réel (retards, suppressions, messages des compagnies) renvoyé par l'API Europe.
// Les horaires théoriques restent la référence : l'heure réelle s'affiche à côté, l'heure prévue barrée.
// Chaque alerte dit quoi, où et pourquoi : « Ce train ne s'arrête pas à Schiphol Airport (votre descente) »
// plutôt qu'un simple « Arrêt non desservi ».
import { formatTime } from '../lib/format';
import type { Journey, Leg, TrainLeg, TransferLeg } from '../types/api';

/** Écart en minutes entre deux heures ISO (avec décalage horaire). */
export function minutesBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 60_000);
}

/** L'heure réelle est plus tardive que l'heure prévue (à la minute près). Une avance n'est jamais montrée. */
export const timeChanged = (theo?: string, real?: string): real is string =>
  !!theo && !!real && formatTime(theo) !== formatTime(real) && minutesBetween(theo, real) > 0;

/**
 * Heure prévue, ou heure prévue barrée + heure réelle en rouge quand le train est en retard.
 * `className` : style de l'heure prévue quand il n'y a pas de retard (reprend celui de l'appelant).
 */
export function RealTimeValue({
  theo,
  real,
  sep = 'h',
  className = '',
  stack = false,
}: {
  theo: string;
  real?: string;
  sep?: string;
  className?: string;
  /** Heure réelle sous l'heure prévue (grands chiffres) plutôt qu'à côté */
  stack?: boolean;
}) {
  if (!timeChanged(theo, real)) return <span className={className}>{formatTime(theo, sep)}</span>;
  const delay = minutesBetween(theo, real);
  return (
    <span className={stack ? 'inline-flex flex-col leading-tight' : 'inline-flex items-baseline gap-1 flex-wrap'}>
      <span className={`${className} line-through decoration-2 !text-slate-400`}>{formatTime(theo, sep)}</span>
      <span className={`${className} !text-red-600`} title={`Heure réelle (${delay > 0 ? '+' : ''}${delay} min)`}>
        {formatTime(real, sep)}
      </span>
    </span>
  );
}

type Status =
  | 'on_time'
  | 'delayed'
  | 'cancelled'
  | 'stop_skipped'
  | 'connection_at_risk'
  | 'disrupted'
  | 'unknown';

const LABELS: Record<Status, string> = {
  on_time: "À l'heure",
  delayed: 'Retard',
  cancelled: 'Train supprimé',
  stop_skipped: 'Arrêt non desservi',
  connection_at_risk: 'Correspondance compromise',
  disrupted: 'Trajet perturbé',
  unknown: '',
};

/** Pastille « en direct » : à l'heure (vert), retard (orange), supprimé / correspondance compromise (rouge). */
export function RealtimeBadge({ status, delayMin = 0 }: { status: Status; delayMin?: number }) {
  if (status === 'unknown') return null;
  const tone =
    status === 'on_time'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'delayed'
        ? 'bg-orange-50 text-orange-700 border-orange-200'
        : 'bg-red-50 text-red-700 border-red-200';
  const dot = status === 'on_time' ? 'bg-emerald-500' : status === 'delayed' ? 'bg-orange-500' : 'bg-red-500';
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-0.5 rounded-full text-xs font-bold ${tone}`}
      title="Information en temps réel de la compagnie"
    >
      <span className="relative flex w-1.5 h-1.5">
        <span className={`absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping ${dot}`} />
        <span className={`relative inline-flex w-1.5 h-1.5 rounded-full ${dot}`} />
      </span>
      {LABELS[status]}
      {status === 'delayed' && delayMin > 0 && ` +${delayMin} min`}
    </span>
  );
}

// ─── Explications ─────────────────────────────────────────────────────────────────

const trainName = (leg: TrainLeg) => `${leg.train_type}${leg.train_number ? ` n° ${leg.train_number}` : ''}`;

/** Gares de montée / descente non desservies par ce train, nommées (« Schiphol Airport (votre descente) »). */
function skippedEnds(leg: TrainLeg): string[] {
  const first = leg.stops[0];
  const last = leg.stops[leg.stops.length - 1];
  return [
    first?.skipped && `${leg.from.name} (votre montée)`,
    last?.skipped && `${leg.to.name} (votre descente)`,
  ].filter((s): s is string => !!s);
}

/** Problème bloquant d'un train (supprimé, gare non desservie), en une phrase ; null sinon. */
export function legProblem(leg: TrainLeg): string | null {
  const r = leg.realtime;
  if (!r) return null;
  if (r.status === 'cancelled') return `${leg.operator_name} a supprimé ce train ce jour-là.`;
  if (r.status === 'stop_skipped') {
    const ends = skippedEnds(leg);
    return ends.length ? `Ce train ne s'arrête pas à ${ends.join(' ni à ')}.` : "Ce train ne dessert pas l'une de vos gares.";
  }
  return null;
}

/** Retard en clair : « départ 18h21 au lieu de 18h11 · arrivée 20h29 au lieu de 20h14 ». */
export function delayDetail(leg: TrainLeg): string | null {
  const r = leg.realtime;
  if (!r) return null;
  const parts = [
    timeChanged(leg.departure, r.departure) && `départ ${formatTime(r.departure, 'h')} au lieu de ${formatTime(leg.departure, 'h')}`,
    timeChanged(leg.arrival, r.arrival) && `arrivée ${formatTime(r.arrival, 'h')} au lieu de ${formatTime(leg.arrival, 'h')}`,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

/** Pourquoi une correspondance n'est plus possible, avec le train et la gare en cause. */
export function transferProblem(prev: Leg | undefined, transfer: TransferLeg, next: Leg | undefined): string {
  const p = prev?.type === 'train' ? prev : undefined;
  const n = next?.type === 'train' ? next : undefined;
  if (p?.realtime?.status === 'cancelled') return `Le ${trainName(p)} est supprimé : cette correspondance n'est plus possible.`;
  if (n?.realtime?.status === 'cancelled') return `Le ${trainName(n)} est supprimé : cette correspondance n'est plus possible.`;
  if (p && p.stops[p.stops.length - 1]?.skipped)
    return `Le ${trainName(p)} ne s'arrête pas à ${p.to.name} : vous ne pourrez pas y prendre le train suivant.`;
  if (n && n.stops[0]?.skipped)
    return `Le ${trainName(n)} ne s'arrête pas à ${n.from.name} : vous ne pourrez pas y monter.`;
  const arr = p?.realtime?.arrival ?? p?.arrival;
  const dep = n?.realtime?.departure ?? n?.departure;
  if (arr && dep) {
    const margin = minutesBetween(arr, dep);
    return (
      `Avec le retard, arrivée à ${formatTime(arr, 'h')} et départ du train suivant à ${formatTime(dep, 'h')} : ` +
      (margin > 0 ? `${margin} min` : 'aucune marge') +
      `, pour ${transfer.min_transfer_min ?? 0} min de changement nécessaires.`
    );
  }
  return "Avec le retard en cours, le temps de changement n'est plus suffisant.";
}

/** État d'un trajet complet, avec une étiquette précise (« Train supprimé » plutôt que « Trajet perturbé »). */
export function journeyRealtime(journey: Journey): { status: Status; label?: string; problem?: string } | null {
  const r = journey.realtime;
  if (!r) return null;
  const trains = journey.legs.filter((l): l is TrainLeg => l.type === 'train');
  const cancelled = trains.find((l) => l.realtime?.status === 'cancelled');
  const skipped = trains.find((l) => l.realtime?.status === 'stop_skipped');
  if (cancelled) return { status: 'cancelled', problem: `${trainName(cancelled)} : ${legProblem(cancelled)}` };
  if (skipped) return { status: 'stop_skipped', problem: legProblem(skipped) ?? undefined };
  if (r.status === 'connection_at_risk') {
    const i = journey.legs.findIndex((l) => l.type === 'transfer' && l.connection_at_risk);
    const t = journey.legs[i] as TransferLeg | undefined;
    return { status: 'connection_at_risk', problem: t ? transferProblem(journey.legs[i - 1], t, journey.legs[i + 1]) : undefined };
  }
  return { status: r.status === 'disrupted' ? 'disrupted' : r.status };
}

/**
 * Bloc d'état d'un train dans le déroulé : discret quand tout va bien, explicite sinon
 * (retard avec les heures, suppression, gare non desservie nommée), suivi des messages de la compagnie.
 */
export function RealtimeNotice({ leg }: { leg: TrainLeg }) {
  const r = leg.realtime;
  if (!r) return null;
  const problem = legProblem(leg);
  const delay = Math.max(r.delay_departure_min, r.delay_arrival_min);
  return (
    <div className="mt-2 space-y-1.5">
      {problem ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-800">
          <span className="material-symbols-outlined text-sm leading-4 text-red-600">error</span>
          <span>
            <strong className="font-bold">{r.status === 'cancelled' ? 'Train supprimé.' : 'Arrêt non desservi.'}</strong> {problem}{' '}
            Choisissez un autre train.
          </span>
        </div>
      ) : r.status === 'delayed' ? (
        <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-2 text-xs text-orange-800">
          <span className="material-symbols-outlined text-sm leading-4 text-orange-600">schedule</span>
          <span>
            <strong className="font-bold">Retard de {delay} min</strong>
            {delayDetail(leg) && <> · {delayDetail(leg)}</>}
          </span>
        </div>
      ) : (
        <RealtimeBadge status="on_time" />
      )}
      <RealtimeMessages messages={r.messages} />
    </div>
  );
}

/** Messages voyageurs de la compagnie (travaux, incident, cause du retard…). */
export function RealtimeMessages({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <ul className="mt-2 space-y-1">
      {messages.map((m, i) => (
        <li
          key={i}
          className="text-[11px] leading-snug text-orange-800 bg-orange-50 border border-orange-100 rounded-lg px-2.5 py-1.5"
        >
          {m}
        </li>
      ))}
    </ul>
  );
}
