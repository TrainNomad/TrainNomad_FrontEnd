import { getDurationColor, formatDuration, formatTime } from '../types/explorer';
import type { Destination } from '../types/explorer';

interface Props {
  destinations: Destination[];
  loading: boolean;
  searched: boolean;
  onSelect: (dest: Destination) => void;
}

/**
 * Scrollable list panel showing all destinations sorted by duration.
 * Handles three states: loading skeleton, empty (no results), and the list itself.
 */
export function DestinationList({ destinations, loading, searched, onSelect }: Props) {

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4 overflow-y-auto flex-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl bg-slate-100 h-[72px]" />
        ))}
      </div>
    );
  }

  if (!searched) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm">
          Les destinations s'afficheront ici après votre recherche.
        </p>
      </div>
    );
  }

  if (destinations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center gap-3">
        <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
        </svg>
        <p className="text-slate-500 font-medium text-sm">Aucune destination trouvée.</p>
        <p className="text-slate-400 text-xs">Essayez avec un autre nom de gare.</p>
      </div>
    );
  }

  const sorted = [...destinations].sort((a, b) => a.duration_min - b.duration_min);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-50 flex-shrink-0">
        <h2 className="font-bold text-[#1A2B3C] text-base">{sorted.length} destinations</h2>
        <p className="text-xs text-slate-400 mt-0.5">Cliquez sur une destination pour les détails</p>
      </div>

      <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-1.5">
        {sorted.map((d) => {
          const color = getDurationColor(d.duration_min);
          return (
            <button
              key={d.place.id}
              onClick={() => onSelect(d)}
              className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100"
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                style={{ background: color }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1A2B3C] text-sm truncate group-hover:text-[#1d7a5a] transition-colors">
                  {d.place.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {d.transfers === 0
                    ? 'Direct'
                    : `${d.transfers} correspondance${d.transfers > 1 ? 's' : ''}`}
                  {` · départ ${formatTime(d.departure)}`}
                  {d.transfers > 0 && d.direct && ` · direct en ${formatDuration(d.direct.duration_min)}`}
                </p>
              </div>
              <span
                className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-lg"
                style={{ background: color + '22', color }}
              >
                {formatDuration(d.duration_min)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
