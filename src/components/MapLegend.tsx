import { DURATION_COLORS, durationLegend, formatHours } from '../types/explorer';

export interface DurationFilter {
  /** Durée maximale affichée, en minutes : filtre les destinations et fixe l'échelle de couleurs */
  value: number;
  /** Borne haute du curseur (plus longue durée des résultats), en minutes */
  limit: number;
  onChange: (minutes: number) => void;
  /** Destinations affichées / au total */
  shown: number;
  total: number;
}

interface Props {
  filter: DurationFilter;
  /** Téléphone : bloc sur deux lignes, à placer par le parent */
  compact?: boolean;
}

const THUMB = 22; // diamètre du bouton du curseur (cf. .duration-slider dans global.css)

/**
 * Légende de la carte et curseur de durée maximale, réunis : la partie colorée de la piste
 * montre les tranches de couleur, qui se resserrent ou s'étalent avec le curseur.
 * Parent must be `position: relative` (variante ordinateur).
 */
export function MapLegend({ filter, compact = false }: Props) {
  const { value, limit, onChange, shown, total } = filter;
  const items = durationLegend(value);
  const min = 60;
  const ratio = limit > min ? (value - min) / (limit - min) : 1;
  // Le centre du bouton va de THUMB/2 à (largeur - THUMB/2) : la couleur s'arrête dessous
  const end = `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${ratio})`;
  const stops = DURATION_COLORS.map((color, i) => {
    const from = `calc(${end} * ${i / DURATION_COLORS.length})`;
    const to = `calc(${end} * ${(i + 1) / DURATION_COLORS.length})`;
    return `${color} ${from}, ${color} ${to}`;
  });
  const track = `linear-gradient(to right, ${stops.join(', ')}, #e2e8f0 ${end})`;

  const slider = (
    <div className="relative flex-1 min-w-0 h-7 flex items-center">
      <div className="absolute inset-x-0 h-2 rounded-full" style={{ background: track }} />
      <input
        type="range"
        min={min}
        max={Math.max(limit, min)}
        step={60}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Durée de trajet maximale"
        aria-valuetext={`Jusqu'à ${formatHours(value)}`}
        className="duration-slider relative w-full"
      />
    </div>
  );

  if (compact) {
    return (
      <div className="w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-100 px-3 pt-1.5 pb-2">
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 text-xs font-bold text-[#1A2B3C] tabular-nums">≤ {formatHours(value)}</span>
          {slider}
        </div>
        <div className="grid grid-cols-6 gap-1 mt-0.5">
          {items.map((item) => (
            <div key={item.color} className="flex items-center gap-1 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-[10px] text-slate-600 font-semibold whitespace-nowrap tabular-nums">{item.upTo}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-6 left-4 w-56 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-100 p-3 z-[1000]">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Durée de trajet</p>
        <p className="text-xs font-bold text-[#1A2B3C] tabular-nums">Jusqu'à {formatHours(value)}</p>
      </div>
      <div className="flex mt-1 mb-2">{slider}</div>
      <div className="flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item.color} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <span className="text-xs text-slate-600 font-medium tabular-nums">{item.label}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-400 mt-2 tabular-nums">
        {shown === total ? `${total} destinations` : `${shown} destinations sur ${total}`}
      </p>
    </div>
  );
}
