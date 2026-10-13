import { useEffect, useRef, useState } from 'react';
import { canvas, latLngBounds, map as createMap } from 'leaflet';
import type { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MaptilerLayer } from '@maptiler/leaflet-maptilersdk';
import { config as maptilerConfig } from '@maptiler/sdk';
import type { Journey } from '../types/api';
import { isTrainLeg } from '../types/api';
import { MAPTILER_API_KEY } from '../config';
import { formatTime } from '../lib/format';
import { drawJourney, LEG_COLORS } from '../lib/journeyLayer';

// Pas de télémétrie MapTiler : voir la page Confidentialité.
maptilerConfig.telemetry = false;

interface Props {
  journey: Journey;
  onClose: () => void;
}

/** Fenêtre affichant le trajet sur une carte : une ligne par train, sur les voies là où le tracé existe. */
export default function JourneyMap({ journey, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [coverage, setCoverage] = useState<{ traced: number; total: number } | null>(null);
  const trains = journey.legs.filter(isTrainLeg);

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
    // Écran tactile : pas de survol, donc une bulle au toucher, une zone de toucher élargie autour des
    // points, et pas de boutons de zoom (on pince la carte)
    const canHover = window.matchMedia('(hover: hover)').matches;
    const map = createMap(containerRef.current, {
      zoomControl: canHover,
      renderer: canvas({ tolerance: canHover ? 4 : 14 }),
    });
    const padding: [number, number] = canHover ? [40, 40] : [24, 24];
    // Le téléphone tourne, la barre d'adresse se replie : la carte suit la taille de son cadre
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);
    new MaptilerLayer({ apiKey: MAPTILER_API_KEY, language: 'fr' }).addTo(map);
    map.attributionControl.addAttribution('Voies © contributeurs OpenStreetMap');

    // Cadrage immédiat sur les arrêts, sans attendre les tracés
    const stopPoints: LatLngTuple[] = [];
    journey.legs.forEach((leg) => {
      if (isTrainLeg(leg)) leg.stops.forEach((s) => (s.lat || s.lon) && stopPoints.push([s.lat, s.lon]));
    });
    if (stopPoints.length > 0) map.fitBounds(latLngBounds(stopPoints), { padding });

    // Le trajet se dessine du départ à l'arrivée
    let cancelled = false;
    const layer = drawJourney(map, journey, {
      labels: canHover ? 'tooltip' : 'popup',
      stopRadius: canHover ? 4 : 5,
    });
    layer.loaded.then(({ coverage }) => !cancelled && setCoverage(coverage));

    return () => {
      cancelled = true;
      layer.remove();
      observer.disconnect();
      map.remove();
    };
  }, [journey]);

  return (
    <div
      className="fixed inset-x-0 top-0 h-[100dvh] z-[2000] bg-slate-900/60 flex items-center justify-center p-0 sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Trajet sur la carte"
    >
      <div className="bg-white w-full h-full sm:h-[80vh] sm:max-w-5xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-left">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 sm:py-3 border-b border-slate-100">
          <div className="min-w-0">
            <div className="font-extrabold text-slate-900 truncate">
              {journey.from.name} → {journey.to.name}
            </div>
            <div className="text-xs text-slate-500">
              {formatTime(journey.departure, 'h')} – {formatTime(journey.arrival, 'h')}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer la carte"
            className="w-10 h-10 sm:w-9 sm:h-9 flex-shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-xl text-slate-600">close</span>
          </button>
        </div>

        <div ref={containerRef} className="flex-1 min-h-0" />

        {/* Légende. Téléphone : un train par ligne, texte coupé s'il est trop long, hauteur limitée
            (la carte garde la place) et marge sous la barre de gestes du téléphone */}
        <div className="px-4 sm:px-5 pt-2.5 sm:pt-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:pb-3 border-t border-slate-100 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-5 gap-y-1.5 max-h-[26vh] overflow-y-auto">
          {trains.map((leg, i) => (
            <span key={i} className="flex items-center gap-2 min-w-0 text-xs font-semibold text-slate-700">
              <span
                className="w-5 h-1 rounded-full flex-shrink-0"
                style={{ backgroundColor: LEG_COLORS[i % LEG_COLORS.length] }}
              />
              <span className="truncate">
                {leg.train_type} · {leg.from.name} → {leg.to.name}
              </span>
            </span>
          ))}
          {coverage && coverage.traced < coverage.total && (
            <span className="text-[11px] leading-snug text-slate-400 w-full">
              {coverage.traced === 0
                ? 'Tracé sur les voies pas encore disponible pour ce trajet : traits droits entre les arrêts.'
                : 'Tracé sur les voies disponible sur une partie du trajet ; ailleurs, traits droits entre les arrêts.'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
