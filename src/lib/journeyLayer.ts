// Dessin d'un trajet sur une carte Leaflet : une ligne par train (sur les voies là où le tracé existe,
// src/lib/traces.ts), les correspondances en pointillés, un point par arrêt. La ligne se dessine du départ
// à l'arrivée, sauf si le système demande de réduire les animations.
import { circleMarker, layerGroup, polyline } from 'leaflet';
import type { Map as LeafletMap, Renderer } from 'leaflet';
import type { Journey } from '../types/api';
import { isTrainLeg } from '../types/api';
import { formatTime } from './format';
import { legPath } from './traces';
import type { LatLng, LegPath } from './traces';

/** Une couleur par train du trajet (reprise dans la légende). */
export const LEG_COLORS = ['#1d7a5a', '#2563eb', '#e11d48', '#d97706', '#7c3aed', '#0891b2'];

export interface JourneyCoverage {
  /** Nombre de tronçons entre arrêts tracés sur les voies, sur le total */
  traced: number;
  total: number;
}

export interface JourneyLayerOptions {
  renderer?: Renderer;
  pane?: string;
  /** Nom et heure de l'arrêt : au survol, au toucher, ou pas du tout (lignes et points alors non cliquables) */
  labels?: 'tooltip' | 'popup' | 'none';
  /** Rayon des points d'arrêt intermédiaires */
  stopRadius?: number;
}

export interface JourneyLayer {
  remove(): void;
  /** Résolu quand les tracés sont chargés (avant la fin de l'animation), avec tous les points du trajet */
  loaded: Promise<{ coverage: JourneyCoverage; points: LatLng[] }>;
}

/** Durée de l'animation : plus longue pour un long trajet, sans faire attendre. */
const animationMs = (km: number) => Math.min(3500, Math.max(1200, 900 + km * 2.5));

const KM_PER_DEG = 111.2;
function km(a: LatLng, b: LatLng): number {
  const dx = (b[1] - a[1]) * Math.cos(((a[0] + b[0]) / 2) * (Math.PI / 180));
  return Math.hypot(b[0] - a[0], dx) * KM_PER_DEG;
}

/** Distance cumulée le long de la ligne, pour chaque point. */
function cumulative(points: LatLng[]): number[] {
  const cum = [0];
  for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + km(points[i - 1], points[i]));
  return cum;
}

export function drawJourney(map: LeafletMap, journey: Journey, options: JourneyLayerOptions = {}): JourneyLayer {
  const { renderer, pane, labels = 'none', stopRadius = 4 } = options;
  const interactive = labels !== 'none';
  const base = { ...(renderer && { renderer }), ...(pane && { pane }), interactive };
  const group = layerGroup().addTo(map);
  let frame = 0;
  let removed = false;

  const addStop = (path: LegPath, k: number, color: string) => {
    const stop = path.stops[k];
    const isEnd = k === 0 || k === path.stops.length - 1;
    const marker = circleMarker([stop.lat, stop.lon], {
      ...base,
      radius: isEnd ? stopRadius + 3 : stopRadius,
      color,
      weight: isEnd ? 3 : 2,
      fillColor: '#ffffff',
      fillOpacity: 1,
    }).addTo(group);
    if (!interactive) return;
    const time = stop.departure ?? stop.arrival;
    const label = time ? `${stop.name} · ${formatTime(time, 'h')}` : stop.name;
    if (labels === 'tooltip') marker.bindTooltip(label);
    else marker.bindPopup(label, { closeButton: false, offset: [0, -4] });
  };

  const addTransfer = (leg: Journey['legs'][number]) => {
    if (leg.type !== 'transfer' || leg.from.id === leg.to.id) return;
    polyline(
      [
        [leg.from.lat, leg.from.lon],
        [leg.to.lat, leg.to.lon],
      ],
      { ...base, interactive: false, color: '#64748b', weight: 3, dashArray: '4 8' },
    ).addTo(group);
  };

  const trainLegs = journey.legs.filter(isTrainLeg);
  const loaded = Promise.all(trainLegs.map(legPath)).then((paths) => {
    if (!removed) {
      // Étapes dans l'ordre du trajet : un train se dessine, une correspondance apparaît d'un coup
      let t = 0;
      const steps = journey.legs.map((leg) => {
        if (!isTrainLeg(leg)) return { leg, path: null, cum: [0], color: '' };
        const path = paths[t];
        const color = LEG_COLORS[t++ % LEG_COLORS.length];
        return { leg, path, cum: cumulative(path.points), color };
      });
      const totalKm = steps.reduce((n, s) => n + s.cum[s.cum.length - 1], 0);
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const duration = reduced || totalKm === 0 ? 0 : animationMs(totalKm);

      let current = 0; // étape en cours
      let before = 0; // kilomètres des étapes terminées
      let lines: ReturnType<typeof polyline>[] = [];
      let idx = 0; // dernier point atteint dans l'étape en cours
      let nextStop = 0;
      const start = performance.now();

      const tick = (now: number) => {
        if (removed) return;
        const reached = duration === 0 ? Infinity : ((now - start) / duration) * totalKm;
        while (current < steps.length) {
          const { leg, path, cum, color } = steps[current];
          if (!path) {
            addTransfer(leg);
            current++;
            continue;
          }
          if (path.points.length === 0) {
            current++;
            continue;
          }
          if (lines.length === 0) {
            // liseré blanc sous la ligne de couleur
            lines = [
              polyline([], { ...base, interactive: false, color: '#ffffff', weight: 8, opacity: 0.9 }).addTo(group),
              polyline([], { ...base, interactive: false, color, weight: 4 }).addTo(group),
            ];
            idx = 0;
            nextStop = 0;
          }
          const d = reached - before;
          const length = cum[cum.length - 1];
          while (idx < cum.length - 1 && cum[idx + 1] <= d) idx++;
          const shown = path.points.slice(0, idx + 1);
          if (idx < cum.length - 1 && d > cum[idx]) {
            const a = path.points[idx];
            const b = path.points[idx + 1];
            const f = (d - cum[idx]) / (cum[idx + 1] - cum[idx]);
            shown.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
          }
          lines.forEach((line) => line.setLatLngs(shown));
          while (nextStop < path.stops.length && path.stopIndex[nextStop] <= idx) addStop(path, nextStop++, color);
          if (d < length) break; // étape en cours : suite à l'image suivante
          before += length;
          lines = [];
          current++;
        }
        if (current < steps.length) frame = requestAnimationFrame(tick);
      };
      tick(start);
    }
    return {
      coverage: {
        traced: paths.reduce((n, p) => n + p.traced, 0),
        total: paths.reduce((n, p) => n + p.total, 0),
      },
      points: paths.flatMap((p) => p.points),
    };
  });

  return {
    loaded,
    remove() {
      removed = true;
      cancelAnimationFrame(frame);
      group.remove();
    },
  };
}
