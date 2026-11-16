// Carte d'un voyage (week-end, semaine de vacances…) : toutes ses étapes sur la même carte Leaflet que la page
// Trajets, une couleur par étape, sur les voies là où le tracé existe. Cliquer une étape de la légende cadre la carte
// dessus ; « Tout le voyage » revient à l'ensemble. Chargée seulement à l'ouverture (Leaflet et MapTiler sont lourds).
import { useEffect, useRef, useState } from 'react';
import { canvas, latLngBounds, map as createMap } from 'leaflet';
import type { LatLngTuple, Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MaptilerLayer } from '@maptiler/leaflet-maptilersdk';
import { config as maptilerConfig } from '@maptiler/sdk';
import { X } from 'lucide-react';
import { isTrainLeg, type Journey } from '../../types/api';
import { MAPTILER_API_KEY } from '../../config';
import { formatTime } from '../../lib/format';
import { drawJourney } from '../../lib/journeyLayer';
import { cx, formatDay } from '../ui';

// Pas de télémétrie MapTiler : voir la page Confidentialité.
maptilerConfig.telemetry = false;

/** Une couleur par étape du voyage (reprise dans la légende) */
export const STAGE_COLORS = ['#1d7a5a', '#2563eb', '#e11d48', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];

export interface MapStage {
  label: string;
  journey: Journey | null;
}

const stopsOf = (j: Journey): LatLngTuple[] =>
  j.legs.flatMap((l) => (isTrainLeg(l) ? l.stops.filter((s) => s.lat || s.lon).map((s): LatLngTuple => [s.lat, s.lon]) : []));

export default function TripMap({ title, stages, onClose }: { title: string; stages: MapStage[]; onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const paddingRef = useRef<[number, number]>([40, 40]);
  const [focus, setFocus] = useState<number | null>(null);
  const drawn = stages.map((s, i) => ({ ...s, color: STAGE_COLORS[i % STAGE_COLORS.length], index: i }));
  const onMap = drawn.filter((s) => s.journey);
  const manual = drawn.filter((s) => !s.journey);

  // Échap pour fermer ; la page derrière ne défile pas
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  useEffect(() => {
    if (!containerRef.current) return;
    const canHover = window.matchMedia('(hover: hover)').matches;
    const map = createMap(containerRef.current, { zoomControl: canHover, renderer: canvas({ tolerance: canHover ? 4 : 14 }) });
    mapRef.current = map;
    paddingRef.current = canHover ? [40, 40] : [24, 24];
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);
    new MaptilerLayer({ apiKey: MAPTILER_API_KEY, language: 'fr' }).addTo(map);
    map.attributionControl.addAttribution('Voies © contributeurs OpenStreetMap');

    const all = onMap.flatMap((s) => stopsOf(s.journey!));
    if (all.length > 0) map.fitBounds(latLngBounds(all), { padding: paddingRef.current });

    const layers = onMap.map((s) =>
      drawJourney(map, s.journey!, { labels: canHover ? 'tooltip' : 'popup', stopRadius: canHover ? 4 : 5, color: s.color }),
    );
    return () => {
      layers.forEach((l) => l.remove());
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // les étapes ne changent pas pendant que la carte est ouverte
  }, []);

  // Cadrage sur une étape, ou sur tout le voyage
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const points = focus === null ? onMap.flatMap((s) => stopsOf(s.journey!)) : stopsOf(drawn[focus].journey!);
    if (points.length > 0) map.flyToBounds(latLngBounds(points), { padding: paddingRef.current, duration: 0.8 });
  }, [focus]);

  const legend = (s: (typeof drawn)[number]) => {
    const j = s.journey!;
    return (
      <button
        key={s.index}
        type="button"
        onClick={() => setFocus(focus === s.index ? null : s.index)}
        aria-pressed={focus === s.index}
        className={cx(
          'flex items-center gap-2 min-w-0 rounded-lg px-2 py-1 text-xs font-semibold text-left transition-colors',
          focus === s.index ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50',
        )}
      >
        <span className="w-5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
        <span className="truncate">
          {s.label} · {formatDay(j.departure, false)} {formatTime(j.departure, 'h')} · {j.from.name} → {j.to.name}
        </span>
      </button>
    );
  };

  return (
    <div
      className="fixed inset-x-0 top-0 h-[100dvh] z-[2000] bg-slate-900/60 flex items-center justify-center p-0 sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Carte du voyage ${title}`}
    >
      <div className="bg-white w-full h-full sm:h-[85vh] sm:max-w-5xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-left">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 sm:py-3 border-b border-slate-100">
          <div className="min-w-0">
            <div className="font-extrabold text-slate-900 truncate">{title}</div>
            <div className="text-xs text-slate-500">
              {onMap.length} étape{onMap.length > 1 ? 's' : ''} sur la carte
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer la carte"
            className="w-10 h-10 sm:w-9 sm:h-9 flex-shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div ref={containerRef} className="flex-1 min-h-0" />

        <div className="px-3 sm:px-4 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:pb-3 border-t border-slate-100 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-2 gap-y-1 max-h-[30vh] overflow-y-auto">
          {onMap.length > 1 && (
            <button
              type="button"
              onClick={() => setFocus(null)}
              aria-pressed={focus === null}
              className={cx('rounded-lg px-2 py-1 text-xs font-bold', focus === null ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50')}
            >
              Tout le voyage
            </button>
          )}
          {onMap.map(legend)}
          {manual.length > 0 && (
            <span className="w-full px-2 text-[11px] leading-snug text-slate-400">
              Non affiché{manual.length > 1 ? 's' : ''} : {manual.map((s) => s.label).join(', ')} (saisi{manual.length > 1 ? 's' : ''} à la main, sans
              tracé).
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
