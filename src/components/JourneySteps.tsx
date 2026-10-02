import type { ReactNode } from 'react';
import type { Journey, StopTime, TrainLeg, TransferLeg } from '../types/api';
import { isSeatChange } from '../types/api';
import { dayOffset, formatDuration, formatTime } from '../lib/format';
import { TrainLogo } from './TrainLogo';

interface Props {
  journey: Journey;
}

/**
 * Déroulé détaillé d'un trajet : pour chaque train, la gare de départ et la gare
 * d'arrivée (en gras) avec la durée du trajet, tous les arrêts intermédiaires en petit,
 * puis un bloc de correspondance (attente, changement de gare) avant le train suivant.
 * TGVmax : un changement de siège (même train, billet suivant) est affiché sans rupture du trajet.
 */
export function JourneySteps({ journey }: Props) {
  // TGVmax : un changement de siège = un billet de plus, mais on reste dans le même train
  const ticketCount = journey.transfers + 1;
  const trainCount = ticketCount - (journey.seat_changes ?? 0);

  return (
    <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-bold text-tone-600 uppercase tracking-wider">Déroulé du trajet</span>
        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
          {trainCount !== ticketCount && `${ticketCount} billets · `}
          {trainCount} train{trainCount > 1 ? 's' : ''} · {formatDuration(journey.duration_min)}
        </span>
      </div>

      <div>
        {journey.legs.map((leg, i) =>
          leg.type === 'train' ? (
            <TrainSegment
              key={i}
              leg={leg}
              journeyStart={journey.departure}
              isFirst={i === 0}
              isLast={i === journey.legs.length - 1}
              totalDuration={journey.duration_min}
              seatBefore={isSeatChange(journey.legs[i - 1])}
              seatAfter={isSeatChange(journey.legs[i + 1])}
            />
          ) : (
            <TransferSegment
              key={i}
              leg={leg}
              nextTrainNumber={nextTrain(journey, i)?.train_number}
              nextCheckin={nextTrain(journey, i)?.checkin_min ?? 0}
              overnight={isOvernight(journey, i)}
            />
          ),
        )}
      </div>
    </div>
  );
}

function nextTrain(journey: Journey, index: number): TrainLeg | undefined {
  const leg = journey.legs[index + 1];
  return leg?.type === 'train' ? leg : undefined;
}

function isOvernight(journey: Journey, index: number): boolean {
  const prev = journey.legs[index - 1];
  const next = journey.legs[index + 1];
  return prev?.type === 'train' && next?.type === 'train' && dayOffset(prev.arrival, next.departure) > 0;
}

// ─── Ligne de la frise : heure | rail (point + trait) | contenu ──────────────────

interface RowProps {
  time?: ReactNode;
  marker: ReactNode;
  /** Trait vertical sous le point, jusqu'à la ligne suivante */
  rail?: 'train' | 'transfer' | 'none';
  compact?: boolean;
  children: ReactNode;
}

function Row({ time, marker, rail = 'none', compact = false, children }: RowProps) {
  return (
    <div className="flex gap-3">
      <div className={`w-14 flex-shrink-0 text-right leading-5 ${compact ? 'pt-0' : 'pt-0.5'}`}>{time}</div>
      <div className="relative w-4 flex-shrink-0 flex flex-col items-center">
        <div className={`flex items-center justify-center ${compact ? 'h-5' : 'h-6'}`}>{marker}</div>
        {rail === 'train' && <div className="flex-1 w-0.5 bg-tone-400" />}
        {rail === 'transfer' && <div className="flex-1 border-l-2 border-dashed border-amber-400" />}
      </div>
      <div className={`flex-1 min-w-0 ${compact ? 'pb-1.5' : 'pb-4'}`}>{children}</div>
    </div>
  );
}

const MajorDot = ({ filled = false }: { filled?: boolean }) => (
  <span
    className={`block w-3.5 h-3.5 rounded-full border-[3px] border-tone-500 z-10 ${filled ? 'bg-tone-500' : 'bg-white'}`}
  />
);

const MinorDot = () => <span className="block w-2 h-2 rounded-full bg-white border-2 border-tone-400 z-10" />;

function TimeLabel({ iso, reference, strong }: { iso?: string; reference: string; strong?: boolean }) {
  if (!iso) return null;
  const offset = dayOffset(reference, iso);
  return (
    <span className={strong ? 'text-sm font-extrabold text-slate-900' : 'text-xs font-medium text-slate-400'}>
      {formatTime(iso, 'h')}
      {offset > 0 && (
        <sup className="ml-0.5 text-[9px] font-bold text-amber-600" title="Arrivée un jour suivant">
          +{offset}j
        </sup>
      )}
    </span>
  );
}

// ─── Segment en train ────────────────────────────────────────────────────────────

interface TrainSegmentProps {
  leg: TrainLeg;
  journeyStart: string;
  isFirst: boolean;
  isLast: boolean;
  totalDuration: number;
  /** Ce trajet commence par un changement de siège (même train que le précédent) */
  seatBefore?: boolean;
  /** Ce trajet se termine par un changement de siège (on reste dans le train) */
  seatAfter?: boolean;
}

function TrainSegment({ leg, journeyStart, isFirst, isLast, totalDuration, seatBefore, seatAfter }: TrainSegmentProps) {
  const intermediate = leg.stops.slice(1, -1);

  return (
    <div>
      {/* Gare de départ */}
      <Row time={<TimeLabel iso={leg.departure} reference={journeyStart} strong />} marker={<MajorDot />} rail="train">
        <div className="text-sm font-extrabold text-slate-900">{leg.from.name}</div>
        <div className="text-[11px] text-slate-400">
          {isFirst ? 'Départ' : seatBefore ? 'Billet suivant · même train, nouvelle place' : 'Montée'}
        </div>

        <div className="mt-2 inline-flex flex-wrap items-center gap-x-3 gap-y-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
          <TrainLogo trainType={leg.train_type} operator={leg.operator} className="h-4" textFallback={false} />
          <span className="text-xs font-bold text-slate-700">
            {leg.train_number && `N° ${leg.train_number}`}
            {/* {leg.train_type} {leg.train_number && `N° ${leg.train_number}`} */}
          </span>
          <span className="text-xs text-slate-500">Direction {leg.headsign}</span>
          <span className="text-[11px] text-slate-400">{leg.operator_name}</span>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-tone-700">
          <span className="material-symbols-outlined text-sm">schedule</span>
          {formatDuration(leg.duration_min)} de trajet
          <span className="font-normal text-slate-400">
            · {intermediate.length === 0 ? 'sans arrêt' : `${intermediate.length} arrêt${intermediate.length > 1 ? 's' : ''}`}
          </span>
        </div>

        {isFirst && leg.checkin_min ? <CheckinNotice minutes={leg.checkin_min} /> : null}
      </Row>

      {/* Arrêts intermédiaires, en petit */}
      {intermediate.map((stop, i) => (
        <StopRow key={`${stop.id}-${i}`} stop={stop} reference={journeyStart} />
      ))}

      {/* Gare d'arrivée */}
      <Row
        time={<TimeLabel iso={leg.arrival} reference={journeyStart} strong />}
        marker={<MajorDot filled={isLast} />}
        rail={isLast ? 'none' : 'transfer'}
      >
        <div className="text-sm font-extrabold text-slate-900">{leg.to.name}</div>
        <div className="text-[11px] text-slate-400">
          {isLast
            ? `Arrivée · durée totale ${formatDuration(totalDuration)}`
            : seatAfter
              ? 'Fin de ce billet · restez à bord du train'
              : 'Descente'}
        </div>
      </Row>
    </div>
  );
}

function StopRow({ stop, reference }: { stop: StopTime; reference: string }) {
  const dwell =
    stop.arrival && stop.departure && formatTime(stop.arrival) !== formatTime(stop.departure)
      ? formatTime(stop.departure, 'h')
      : null;
  return (
    <Row time={<TimeLabel iso={stop.arrival ?? stop.departure} reference={reference} />} marker={<MinorDot />} rail="train" compact>
      <span className="text-xs text-slate-500">{stop.name}</span>
      {dwell && <span className="ml-1.5 text-[10px] text-slate-400">(départ {dwell})</span>}
    </Row>
  );
}

// ─── Correspondance ──────────────────────────────────────────────────────────────

interface TransferSegmentProps {
  leg: TransferLeg;
  nextTrainNumber?: string;
  nextCheckin: number;
  overnight: boolean;
}

function TransferSegment({ leg, nextTrainNumber, nextCheckin, overnight }: TransferSegmentProps) {
  const wait = leg.wait_min ?? 0;
  const seat = leg.transfer_kind === 'seat_change';
  let how: string;
  switch (leg.transfer_kind) {
    case 'seat_change':
      // TGVmax : deux billets dans le même train, la place du 2e peut être dans une autre voiture
      how =
        `Même train${nextTrainNumber ? ` n° ${nextTrainNumber}` : ''} : restez à bord à ${leg.from.name} ` +
        `et rejoignez la place de votre billet suivant (autre voiture possible, pendant l'arrêt ou une fois reparti).`;
      break;
    case 'walk':
      how = `À pied jusqu'à ${leg.to.name} (≈ ${formatDuration(leg.duration_min)})`;
      break;
    case 'city':
      how = `Rejoindre ${leg.to.name} en transports urbains (≈ ${formatDuration(leg.duration_min)})`;
      break;
    default:
      how = `Changement de train en gare de ${leg.from.name}`;
  }

  return (
    <Row
      marker={
        <span className="material-symbols-outlined text-base text-amber-500 bg-white z-10 leading-none">
          {seat
            ? 'airline_seat_recline_normal'
            : leg.transfer_kind === 'same_station'
              ? 'sync_alt'
              : leg.transfer_kind === 'walk'
                ? 'directions_walk'
                : 'subway'}
        </span>
      }
      rail="transfer"
    >
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
        <div className="text-xs font-extrabold text-amber-700">
          {seat ? 'Correspondance · changement de siège' : 'Correspondance'} · {formatDuration(wait)}
          {overnight && <span className="ml-2 font-bold text-amber-600">(départ le lendemain)</span>}
        </div>
        <div className="text-xs text-amber-700/80 mt-0.5">{how}</div>
        {leg.min_transfer_min ? (
          <div className="text-[11px] text-amber-700/60 mt-0.5">Temps minimum prévu : {formatDuration(leg.min_transfer_min)}</div>
        ) : null}
      </div>
      {nextCheckin > 0 && <CheckinNotice minutes={nextCheckin} />}
    </Row>
  );
}

function CheckinNotice({ minutes }: { minutes: number }) {
  return (
    <div className="mt-2 flex items-start gap-1.5 text-[11px] text-sky-700 bg-sky-50 border border-sky-100 rounded-lg px-2.5 py-1.5">
      <span className="material-symbols-outlined text-sm leading-4">badge</span>
      Enregistrement et contrôle des passeports : présentez-vous au moins {minutes} min avant le départ.
    </div>
  );
}
