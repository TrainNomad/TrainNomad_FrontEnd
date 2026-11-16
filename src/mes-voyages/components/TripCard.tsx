import { Link } from 'react-router-dom';
import { ChevronRight, History } from 'lucide-react';
import { formatTime } from '../../lib/format';
import { TRIP_STATUS_LABELS, type TripStatus, type TripSummary } from '../lib/types';
import { localDate, todayIso } from '../lib/itinerary';
import { cx, formatDay, formatPeriod, formatStamp } from '../ui';

const STATUS_STYLES: Record<TripStatus, string> = {
  planned: 'bg-sky-50 text-sky-800 border-sky-200',
  booked: 'bg-brand/10 text-brand-dark border-brand/30',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export function StatusBadge({ status }: { status: TripStatus }) {
  return (
    <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold', STATUS_STYLES[status])}>
      {TRIP_STATUS_LABELS[status]}
    </span>
  );
}

/** Jours avant le départ : « dans 3 jours », « demain », « aujourd'hui » */
function countdown(startDate: string): string | null {
  const days = Math.round((Date.parse(`${startDate}T12:00:00Z`) - Date.parse(`${todayIso()}T12:00:00Z`)) / 86_400_000);
  if (days < 0) return null;
  if (days === 0) return "aujourd'hui";
  if (days === 1) return 'demain';
  return `dans ${days} jours`;
}

const time = (local: string | null) => (local && local.length >= 16 ? formatTime(local) : null);

/** Carte d'un voyage : ses trajets enregistrés (heures, gares) ou, pour un projet, ses dates. */
export function TripCard({ trip, past = false }: { trip: TripSummary; past?: boolean }) {
  const soon = past ? null : countdown(trip.start_date);
  const captured = trip.legs.map((l) => l.source_fetched_at).filter((d): d is string => !!d).sort()[0];
  return (
    <Link
      to={`/mes-voyages/voyage/${trip.id}`}
      className="group flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-4 sm:px-5 py-4 shadow-sm hover:border-brand/40 hover:shadow transition"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold text-slate-900 break-words">{trip.title}</span>
          {trip.status !== 'planned' && <StatusBadge status={trip.status} />}
        </div>
        <div className="mt-0.5 text-sm text-slate-500">
          {formatPeriod(trip.start_date, trip.end_date)}
          {soon && <span className="text-brand font-semibold"> · {soon}</span>}
        </div>
        {trip.legs.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {trip.legs.slice(0, 3).map((l) => {
              const day = localDate(l.departure_local);
              return (
                <li key={l.id} className="text-sm text-slate-700 tabular-nums break-words">
                  {day && day !== trip.start_date && <span className="text-slate-400">{formatDay(day, false)} · </span>}
                  <strong>{time(l.departure_local) ?? '—'}</strong> {l.origin_name} → <strong>{time(l.arrival_local) ?? '—'}</strong> {l.destination_name}
                  {l.transfers != null && <span className="text-xs text-slate-400"> · {l.transfers === 0 ? 'direct' : `${l.transfers} corresp.`}</span>}
                </li>
              );
            })}
            {trip.legs.length > 3 && <li className="text-xs text-slate-400">+ {trip.legs.length - 3} autre{trip.legs.length > 4 ? 's' : ''} trajet{trip.legs.length > 4 ? 's' : ''}</li>}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Aucun trajet choisi pour le moment.</p>
        )}
        {captured && !past && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400">
            <History className="w-3.5 h-3.5" aria-hidden />
            Enregistré le {formatStamp(captured)}
          </p>
        )}
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand transition-colors flex-shrink-0" aria-hidden />
    </Link>
  );
}
