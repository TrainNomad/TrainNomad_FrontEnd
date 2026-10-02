import { InfoCard } from './InfoCard';
import {
  getDurationColor,
  getDurationLabel,
  formatDuration,
  formatTime,
} from '../types/explorer';
import type { Destination } from '../types/explorer';
import type { Place } from '../types/api';
import { useNetwork } from '../network/NetworkContext';

interface Props {
  dest: Destination;
  origin: Place | null;
  date: string;
  onClose: () => void;
}

/**
 * Right-panel detail view for a single destination.
 * Shows duration, departure/arrival times, the fastest direct train if any,
 * a visual timeline, and a CTA link to the timetable page.
 */
export function DestinationDetail({ dest, origin, date, onClose }: Props) {
  const { network } = useNetwork();
  const color = getDurationColor(dest.duration_min);
  const label = getDurationLabel(dest.duration_min);
  const originName = origin?.name ?? '';
  const direct = dest.direct;

  const timetableParams = new URLSearchParams({
    departure: origin?.id ?? originName,
    arrival: dest.place.id,
    date: date || dest.departure.slice(0, 10),
    departure_time: formatTime(dest.departure),
  });

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="p-5 border-b border-slate-50 flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-3 font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Retour aux destinations
        </button>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">
              Depuis <span className="text-brand font-semibold">{originName}</span>
            </p>
            <h2 className="text-2xl font-black text-[#1A2B3C] leading-tight">{dest.place.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {dest.place.type === 'city' && dest.place.stations ? `${dest.place.stations} gares · ` : ''}
              {dest.place.country}
            </p>
          </div>
          <span
            className="flex-shrink-0 text-sm font-bold px-3 py-1.5 rounded-xl mt-1"
            style={{ background: color + '22', color }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

        {/* Duration highlight */}
        <div
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: color + '15', border: `1.5px solid ${color}40` }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: color + '30' }}
          >
            <svg className="w-6 h-6" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-0.5">Trajet le plus rapide</p>
            <p className="text-2xl font-black" style={{ color }}>{formatDuration(dest.duration_min)}</p>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCard icon={<ClockIcon />} label="Départ" value={formatTime(dest.departure)} />
          <InfoCard icon={<ArrowRightIcon />} label="Arrivée" value={formatTime(dest.arrival)} />
          <InfoCard
            icon={<TransferIcon />}
            label="Correspondances"
            value={dest.transfers === 0 ? 'Direct' : String(dest.transfers)}
            accent={dest.transfers === 0}
          />
          <InfoCard
            icon={<TrainIcon />}
            label="Train direct"
            value={direct ? formatDuration(direct.duration_min) : 'Aucun'}
            accent={!!direct}
          />
        </div>

        {/* Timeline du meilleur trajet */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Meilleur trajet de la journée</p>

          <div className="flex items-center gap-3">
            <div className="text-right flex-shrink-0">
              <p className="text-base font-black text-[#1A2B3C]">{formatTime(dest.departure)}</p>
              <p className="text-xs text-slate-400">{originName}</p>
            </div>
            <div className="flex-1 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#1A2B3C] flex-shrink-0" />
              <div className="flex-1 h-0.5 bg-gradient-to-r from-[#1A2B3C] to-brand rounded-full" />
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            </div>
            <div className="flex-shrink-0">
              <p className="text-base font-black" style={{ color }}>{formatTime(dest.arrival)}</p>
              <p className="text-xs text-slate-400">{dest.place.name}</p>
            </div>
          </div>

          {direct && dest.transfers > 0 && (
            <p className="text-xs text-slate-500 mt-3">
              Train direct le plus rapide : {formatTime(direct.departure)} → {formatTime(direct.arrival)}
              {` (${formatDuration(direct.duration_min)})`}
            </p>
          )}
        </div>

        {/* CTA */}
        <a
          href={`${network.paths.trajets}?${timetableParams.toString()}`}
          className="block w-full text-center bg-[#1A2B3C] hover:bg-brand text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-md hover:-translate-y-0.5 text-sm"
        >
          Voir les horaires →
        </a>
      </div>
    </div>
  );
}

// ─── Inline icon helpers (avoids importing a whole icon lib) ──────────────────

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  );
}

function TrainIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25M17.25 4.5l1.5 1.5m-4.5 0h4.5M3 12l6-6 3 3 3-3 4.5 4.5" />
    </svg>
  );
}
