import { LEGEND_ITEMS } from '../types/explorer';

/**
 * Absolute-positioned legend card rendered on top of the map.
 * Parent must be `position: relative`.
 */
export function MapLegend() {
  return (
    <div className="absolute bottom-6 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-100 p-3 z-[1000]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        Durée de trajet
      </p>
      <div className="flex flex-col gap-1.5">
        {LEGEND_ITEMS.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: item.color }}
            />
            <span className="text-xs text-slate-600 font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
