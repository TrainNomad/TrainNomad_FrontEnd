// Un trajet enregistré : photographie datée d'un résultat de recherche (à actualiser), ou trajet saisi à la main.
// Actions : Voir les détails · Actualiser la recherche · Supprimer.
import { useState } from 'react';
import { ChevronDown, ChevronUp, History, PenLine, RefreshCw, Trash2 } from 'lucide-react';
import { formatDuration, formatTime } from '../../lib/format';
import { isTrainLeg, type TransferLeg } from '../../types/api';
import { localDate, todayIso } from '../lib/itinerary';
import type { TripLeg } from '../lib/types';
import { ConfirmButton, cx, formatDay, formatStamp } from '../ui';
import { RefreshPanel } from './RefreshPanel';
import { LegPrice } from './LegPrice';
import { LegOffers } from './LegOffers';
import { LegRealtime, legRealtimeView } from './LegRealtime';
import { RealTimeValue } from '../../components/Realtime';
import { useTrainsRealtime } from '../../hooks/useTrainsRealtime';

/** Heure affichée : heure locale de la gare (sans conversion vers le fuseau de l'appareil) */
const hasTime = (local: string | null) => !!local && local.length >= 16 && local[10] === 'T';

function TimeBlock({ local, real, place, align = 'left' }: { local: string | null; real?: string; place: string; align?: 'left' | 'right' }) {
  return (
    <div className={cx('min-w-0', align === 'right' && 'text-right')}>
      <div className="text-xl font-extrabold text-slate-900 tabular-nums">
        {/* temps réel : heure prévue barrée, heure réelle à côté */}
        {hasTime(local) ? <RealTimeValue theo={local!} real={real} sep=":" /> : '—'}
      </div>
      <div className="text-sm font-semibold text-slate-600 break-words">{place}</div>
    </div>
  );
}

function Details({ leg }: { leg: TripLeg }) {
  const journey = leg.itinerary_snapshot;
  if (!journey) {
    return <p className="text-sm text-slate-500">Trajet saisi à la main : pas de détail des trains.</p>;
  }
  return (
    <ol className="space-y-3">
      {journey.legs.map((part, i) =>
        isTrainLeg(part) ? (
          <li key={i} className="text-sm">
            <div className="font-bold text-slate-800">
              {part.train_type}
              {part.train_number && <span className="font-semibold text-slate-400"> · n° {part.train_number}</span>}
              {part.operator_name && <span className="font-semibold text-slate-400"> · {part.operator_name}</span>}
            </div>
            <div className="text-slate-600 tabular-nums">
              {formatTime(part.departure)} {part.from.name} → {formatTime(part.arrival)} {part.to.name}
              <span className="text-slate-400"> · {formatDuration(part.duration_min)}</span>
            </div>
            {part.stops.length > 2 && <div className="text-xs text-slate-400">{part.stops.length - 2} arrêt{part.stops.length > 3 ? 's' : ''} intermédiaire{part.stops.length > 3 ? 's' : ''}</div>}
          </li>
        ) : (
          <li key={i} className="text-xs text-slate-500 pl-3 border-l-2 border-slate-200">
            {(part as TransferLeg).transfer_kind === 'seat_change'
              ? `Changement de siège à ${part.from.name}`
              : `Correspondance à ${part.from.name}${part.from.name !== part.to.name ? ` → ${part.to.name}` : ''}`}
            {(part as TransferLeg).wait_min != null && ` · ${formatDuration((part as TransferLeg).wait_min!)} d'attente`}
          </li>
        ),
      )}
    </ol>
  );
}

export function LegCard({
  leg,
  index,
  count,
  onMove,
  onDelete,
  onReplaced,
}: {
  leg: TripLeg;
  index: number;
  count: number;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => Promise<void>;
  onReplaced: (leg: TripLeg) => void;
}) {
  const [panel, setPanel] = useState<'details' | 'refresh' | null>(null);
  const journey = leg.itinerary_snapshot;
  const day = localDate(leg.departure_local);
  const arrivalDay = localDate(leg.arrival_local);
  const past = day !== null && day < todayIso();
  const canRefresh = !!leg.search_params && !past;
  // Suivi en direct (API Europe /realtime), seulement autour de l'heure du voyage
  const rt = useTrainsRealtime(past ? null : journey);
  const live = legRealtimeView(journey, rt);

  return (
    <li className="bg-white border border-slate-200 rounded-2xl shadow-sm">
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {count > 1 && <>Trajet {index + 1} · </>}
            <span className="normal-case tracking-normal font-semibold">{day ? formatDay(day) : 'Date à préciser'}</span>
          </div>
          {count > 1 && (
            <div className="flex items-center">
              <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30" aria-label="Monter ce trajet">
                <ChevronUp className="w-4 h-4" />
              </button>
              <button type="button" disabled={index === count - 1} onClick={() => onMove(1)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30" aria-label="Descendre ce trajet">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
          <TimeBlock local={leg.departure_local} real={live?.departure} place={leg.origin_name} />
          <div className="pt-2 text-center text-xs text-slate-400 whitespace-nowrap">
            {journey ? formatDuration(journey.duration_min) : '→'}
            {journey && <div>{journey.transfers === 0 ? 'direct' : `${journey.transfers} corresp.`}</div>}
          </div>
          <div>
            <TimeBlock local={leg.arrival_local} real={live?.arrival} place={leg.destination_name} align="right" />
            {arrivalDay && day && arrivalDay !== day && <div className="text-xs text-slate-500 text-right">{formatDay(arrivalDay, false)}</div>}
          </div>
        </div>

        {(leg.operator_name || leg.train_number) && (
          <div className="mt-3 text-sm text-slate-600 break-words">{[leg.operator_name, leg.train_number].filter(Boolean).join(' · ')}</div>
        )}
        <LegRealtime view={live} rt={rt} />
        {leg.notes && <p className="mt-2 text-sm text-slate-500 whitespace-pre-line">{leg.notes}</p>}
        <div className="mt-3">
          <LegPrice leg={leg} onUpdated={onReplaced} />
        </div>

        <div className="mt-4 text-xs">
          {leg.source === 'search' && leg.source_fetched_at ? (
            <p className="inline-flex items-start gap-1.5 text-amber-800">
              <History className="w-3.5 h-3.5 mt-px flex-shrink-0" aria-hidden />
              <span>
                Itinéraire enregistré le {formatStamp(leg.source_fetched_at)}.
                {!past && ' Les horaires peuvent avoir changé.'}
              </span>
            </p>
          ) : (
            <p className="inline-flex items-center gap-1.5 text-slate-500">
              <PenLine className="w-3.5 h-3.5" aria-hidden />
              Saisi à la main
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPanel(panel === 'details' ? null : 'details')}
            aria-expanded={panel === 'details'}
            className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
          >
            {panel === 'details' ? 'Masquer les détails' : 'Voir les détails'}
            <ChevronDown className={cx('w-3.5 h-3.5 transition-transform', panel === 'details' && 'rotate-180')} aria-hidden />
          </button>
          {journey && !past && <LegOffers journey={journey} network={leg.network ?? 'europe'} />}
          {canRefresh && (
            <button
              type="button"
              onClick={() => setPanel(panel === 'refresh' ? null : 'refresh')}
              aria-expanded={panel === 'refresh'}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden />
              Actualiser la recherche
            </button>
          )}
          <span className="ml-auto">
            <ConfirmButton label="Supprimer" confirmLabel="Supprimer ce trajet ?" icon={<Trash2 className="w-3.5 h-3.5" aria-hidden />} onConfirm={onDelete} />
          </span>
        </div>
      </div>

      {panel === 'details' && (
        <div className="border-t border-slate-100 px-4 sm:px-5 py-4 bg-slate-50/60 rounded-b-2xl">
          <Details leg={leg} />
        </div>
      )}
      {panel === 'refresh' && (
        <RefreshPanel
          leg={leg}
          onClose={() => setPanel(null)}
          onReplaced={(next) => {
            onReplaced(next);
            setPanel(null);
          }}
        />
      )}
    </li>
  );
}
