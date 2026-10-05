import { MapContainer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { canvas, circleMarker, latLngBounds, layerGroup } from 'leaflet';
import type { CircleMarker as LeafletCircleMarker, Map as LeafletMap, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MaptilerLayer } from '@maptiler/leaflet-maptilersdk';
import { config as maptilerConfig } from '@maptiler/sdk';

// Pas de télémétrie MapTiler (envoi de statistiques d'usage à api.maptiler.com) : voir la page Confidentialité.
maptilerConfig.telemetry = false;
import { MapLegend } from './MapLegend';
import type { DurationFilter } from './MapLegend';
import { DURATION_COLORS, durationBucket, getDurationColor, formatDuration } from '../types/explorer';
import type { Destination, OriginCoords } from '../types/explorer';
import { MAPTILER_API_KEY } from '../config';
import { useNetwork } from '../network/NetworkContext';

interface Props {
  destinations: Destination[];
  selected: Destination | null;
  originCoords: OriginCoords | null;
  originName: string;
  searched: boolean;
  onSelect: (dest: Destination) => void;
  /**
   * Curseur de durée maximale (null tant qu'il n'y a pas de résultats) : seules les destinations
   * en dessous sont affichées, et l'échelle de couleurs est découpée sur cette durée.
   */
  durationFilter: DurationFilter | null;
  /**
   * Téléphone : zones de la carte recouvertes par la recherche (haut) et la feuille (bas), en pixels.
   * Les points sont cadrés dans l'espace restant ; la légende et le bouton passent sous la recherche.
   */
  insets?: MapInsets;
}

/** Hauteur du bloc curseur + légende affiché sous la recherche sur téléphone (marge comprise). */
const LEGEND_ROW = 68;

export interface MapInsets {
  top: number;
  bottom: number;
}

// ─── Helpers géo ──────────────────────────────────────────────────────────────

const isCoord = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const hasCoords = (d: Destination) => isCoord(d.place.lat) && isCoord(d.place.lon);

/** Tous les points affichés sur la carte (origine + destinations valides, dans la durée maximale). */
function collectPoints(
  destinations: Destination[],
  originCoords: OriginCoords | null,
  maxDuration: number,
): LatLngTuple[] {
  const pts: LatLngTuple[] = [];
  if (originCoords && isCoord(originCoords.lat) && isCoord(originCoords.lon)) {
    pts.push([originCoords.lat, originCoords.lon]);
  }
  if (Array.isArray(destinations)) {
    for (const d of destinations) {
      if (hasCoords(d) && d.duration_min <= maxDuration) pts.push([d.place.lat, d.place.lon]);
    }
  }
  return pts;
}

/**
 * Recadre la carte sur l'ensemble des points. No-op s'il n'y en a aucun ou si la
 * carte n'a pas encore de taille (le ResizeObserver recadrera dès qu'elle en aura une).
 */
function fitToPoints(map: LeafletMap, pts: LatLngTuple[], insets?: MapInsets) {
  const size = map.getSize();
  if (pts.length === 0 || !size.x || !size.y) return;
  map.fitBounds(latLngBounds(pts), {
    ...(insets
      ? { paddingTopLeft: [24, insets.top + LEGEND_ROW + 16], paddingBottomRight: [24, insets.bottom + 24] }
      : { padding: [56, 56] }),
    maxZoom: pts.length === 1 ? 10 : 12,
  });
}

// ─── Marqueurs ────────────────────────────────────────────────────────────────

/** Rayon des points selon le zoom : fins à l'échelle de l'Europe, plus gros en zoomant. */
function markerRadius(zoom: number): number {
  if (zoom <= 4) return 2;
  if (zoom <= 5) return 2.5;
  if (zoom <= 6) return 3.5;
  if (zoom <= 7) return 4.5;
  if (zoom <= 9) return 6;
  return 7;
}

const markerWeight = (zoom: number) => (zoom <= 5 ? 0.5 : 1);

/** Contenu de l'infobulle, construit seulement au survol. */
function tooltipContent(d: Destination): HTMLElement {
  const el = document.createElement('div');
  const name = document.createElement('span');
  name.className = 'font-bold';
  name.textContent = d.place.name;
  el.append(
    name,
    document.createElement('br'),
    `${formatDuration(d.duration_min)} · ${d.transfers === 0 ? 'Direct' : `${d.transfers} corresp.`}`,
  );
  return el;
}

// ─── Contenu interne (a accès à useMap) ───────────────────────────────────────

/** Un point de la carte : masqué (non dessiné, non cliquable) au-delà de la durée maximale. */
interface MarkerEntry {
  marker: LeafletCircleMarker;
  duration: number;
  shown: boolean;
  bucket: number;
}

/** Affiche / masque et recolore les points selon la durée maximale, sans les recréer. */
function applyDurationScale(entries: MarkerEntry[], maxDuration: number) {
  for (const e of entries) {
    const shown = e.duration <= maxDuration;
    const bucket = durationBucket(e.duration, maxDuration);
    if (shown === e.shown && (!shown || bucket === e.bucket)) continue;
    e.shown = shown;
    e.bucket = bucket;
    e.marker.options.interactive = shown;
    e.marker.setStyle(shown ? { fill: true, stroke: true, fillColor: DURATION_COLORS[bucket] } : { fill: false, stroke: false });
  }
}

interface InnerProps extends Omit<Props, 'durationFilter'> {
  maxDuration: number;
  points: LatLngTuple[];
  mapRef: React.MutableRefObject<LeafletMap | null>;
}

function MapContent({
  destinations,
  selected,
  originCoords,
  originName,
  onSelect,
  insets,
  maxDuration,
  points,
  mapRef,
}: InnerProps) {
  const map = useMap();
  const pointsRef = useRef(points);
  const onSelectRef = useRef(onSelect);
  const insetsRef = useRef(insets);
  const maxDurationRef = useRef(maxDuration);
  const entriesRef = useRef<MarkerEntry[]>([]);
  useEffect(() => {
    pointsRef.current = points;
    onSelectRef.current = onSelect;
    insetsRef.current = insets;
    maxDurationRef.current = maxDuration;
  });

  // Expose l'instance Leaflet au composant parent (bouton « Recentrer »)
  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);

  // Leaflet et MapTiler ne mesurent le conteneur qu'au montage : si sa taille change
  // ensuite (mise en page flex, animation…), la carte restait vide jusqu'au prochain
  // redimensionnement de la fenêtre (ouverture de l'inspecteur, par exemple).
  useEffect(() => {
    const container = map.getContainer();
    const isEmpty = () => container.clientWidth === 0 || container.clientHeight === 0;
    let wasEmpty = isEmpty();
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        map.invalidateSize({ pan: false });
        const empty = isEmpty();
        if (wasEmpty && !empty) fitToPoints(map, pointsRef.current, insetsRef.current);
        wasEmpty = empty;
      });
    });
    observer.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map]);

  // Fond de carte MapTiler
  useEffect(() => {
    // Pas de `style` : on garde le fond MapTiler par défaut (MapTiler Streets),
    // celui qui était réellement rendu avant (MapStyle.LIGHT n'existe pas et
    // valait donc undefined).
    const mtLayer = new MaptilerLayer({
      apiKey: MAPTILER_API_KEY,
      language: 'fr',
    });
    mtLayer.addTo(map);
    return () => {
      map.removeLayer(mtLayer);
    };
  }, [map]);

  // Auto-recadrage à chaque nouveau jeu de résultats (pas quand le curseur de durée bouge :
  // la carte sauterait sans arrêt ; le bouton « Recentrer » cadre sur les points affichés)
  useEffect(() => {
    fitToPoints(map, pointsRef.current, insetsRef.current);
  }, [map, destinations, originCoords]);

  // Recentrage doux sur la destination sélectionnée
  useEffect(() => {
    if (!selected || !hasCoords(selected)) return;
    const zoom = Math.max(map.getZoom(), 8);
    // Vise le milieu de la zone visible, pas le milieu de la carte (en partie sous la feuille)
    const shift = insetsRef.current ? (insetsRef.current.bottom - insetsRef.current.top - LEGEND_ROW) / 2 : 0;
    const center = map.unproject(
      map.project([selected.place.lat, selected.place.lon], zoom).add([0, shift]),
      zoom,
    );
    map.flyTo(center, zoom, { duration: 0.6 });
  }, [map, selected]);

  // Destinations : plusieurs milliers de points, créés directement en Leaflet sur un
  // canvas plutôt qu'en composants React (un CircleMarker + Tooltip chacun était très lent).
  const renderer = useMemo(() => canvas({ padding: 0.5, tolerance: 4 }), []);
  useEffect(() => {
    const group = layerGroup();
    const markers: LeafletCircleMarker[] = [];
    const entries: MarkerEntry[] = [];
    const scaleMax = maxDurationRef.current;
    let weight = markerWeight(map.getZoom());

    // Les plus longues d'abord : les destinations proches restent visibles par-dessus
    const sorted = destinations.filter(hasCoords).sort((a, b) => b.duration_min - a.duration_min);
    for (const d of sorted) {
      const marker = circleMarker([d.place.lat, d.place.lon], {
        renderer,
        radius: markerRadius(map.getZoom()),
        weight,
        color: '#fff',
        fillColor: getDurationColor(d.duration_min, scaleMax),
        fillOpacity: 0.9,
      });
      entries.push({ marker, duration: d.duration_min, shown: true, bucket: durationBucket(d.duration_min, scaleMax) });
      marker.bindTooltip(() => tooltipContent(d), { direction: 'top', offset: [0, -4] });
      marker.on('click', () => onSelectRef.current(d));
      markers.push(marker);
      group.addLayer(marker);
    }
    applyDurationScale(entries, scaleMax);
    entriesRef.current = entries;
    group.addTo(map);

    const onZoom = () => {
      const zoom = map.getZoom();
      const radius = markerRadius(zoom);
      const newWeight = markerWeight(zoom);
      for (const marker of markers) {
        marker.setRadius(radius);
        if (newWeight !== weight) marker.setStyle({ weight: newWeight });
      }
      weight = newWeight;
    };
    map.on('zoomend', onZoom);
    return () => {
      map.off('zoomend', onZoom);
      group.remove();
      entriesRef.current = [];
    };
  }, [map, renderer, destinations]);

  // Curseur de durée : on met à jour les points existants (plusieurs milliers) sans les recréer
  useEffect(() => {
    applyDurationScale(entriesRef.current, maxDuration);
  }, [maxDuration]);

  return (
    <>
      {/* Origin pin */}
      {originCoords && isCoord(originCoords.lat) && isCoord(originCoords.lon) && (
        <CircleMarker
          center={[originCoords.lat, originCoords.lon]}
          radius={8}
          pathOptions={{ fillColor: '#1A2B3C', color: '#fff', weight: 2.5, fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]}>
            <span className="font-bold text-xs">{originName}</span>
          </Tooltip>
        </CircleMarker>
      )}

      {/* Destination sélectionnée, au-dessus des autres points */}
      {selected && hasCoords(selected) && (
        <CircleMarker
          key={selected.place.id}
          center={[selected.place.lat, selected.place.lon]}
          radius={9}
          pathOptions={{
            fillColor: getDurationColor(selected.duration_min, maxDuration),
            color: '#1A2B3C',
            weight: 3,
            fillOpacity: 1,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            <span className="font-bold">{selected.place.name}</span>
            <br />
            {formatDuration(selected.duration_min)} ·{' '}
            {selected.transfers === 0 ? 'Direct' : `${selected.transfers} corresp.`}
          </Tooltip>
        </CircleMarker>
      )}
    </>
  );
}

// ─── Composant public ─────────────────────────────────────────────────────────

/**
 * Carte Leaflet pleine hauteur (fond MapTiler), marqueurs colorés par durée,
 * curseur de durée maximale + légende, bouton de recentrage et état vide avant la première recherche.
 *
 * Le recadrage est automatique à chaque recherche ; le bouton « Recentrer »
 * permet de revenir sur l'ensemble des points affichés après un zoom manuel.
 */
export function ExplorerMap({
  destinations,
  selected,
  originCoords,
  originName,
  searched,
  onSelect,
  durationFilter,
  insets,
}: Props) {
  const { network } = useNetwork();
  const mapRef = useRef<LeafletMap | null>(null);
  const maxDuration = durationFilter?.value ?? Infinity;
  const points = useMemo(
    () => collectPoints(destinations, originCoords, maxDuration),
    [destinations, originCoords, maxDuration],
  );
  const canRecenter = points.length > 0;

  const handleRecenter = useCallback(() => {
    if (mapRef.current) fitToPoints(mapRef.current, points, insets);
  }, [points, insets]);

  return (
    <div className="flex-1 relative">
      <MapContainer
        center={[46.5, 2.5]}
        zoom={6}
        className="w-full h-full"
        zoomControl={!insets} // au doigt, on zoome en pinçant
        zoomSnap={0.5} // demi-niveaux de zoom : cadrage plus serré autour des points
        preferCanvas // des milliers de destinations : le rendu canvas est bien plus fluide que SVG
      >
        <MapContent
          destinations={destinations}
          selected={selected}
          originCoords={originCoords}
          originName={originName}
          searched={searched}
          onSelect={onSelect}
          insets={insets}
          maxDuration={maxDuration}
          points={points}
          mapRef={mapRef}
        />
      </MapContainer>

      {insets ? (
        /* Téléphone : curseur + légende et recentrage, sous la barre de recherche */
        durationFilter && (
          <div
            className="absolute inset-x-3 z-[1000] flex items-start gap-2 pointer-events-none"
            style={{ top: insets.top }}
          >
            <div className="flex-1 min-w-0 flex pointer-events-auto">
              <MapLegend filter={durationFilter} compact />
            </div>
            <button
              type="button"
              onClick={handleRecenter}
              aria-label="Recentrer la carte sur les destinations affichées"
              className="pointer-events-auto flex-shrink-0 w-9 h-9 flex items-center justify-center bg-white/95 backdrop-blur-sm text-[#1A2B3C] rounded-full shadow-lg border border-slate-200/80"
            >
              <RecenterIcon />
            </button>
          </div>
        )
      ) : (
        <>
          {/* Bouton de recentrage — hors MapContainer pour passer au-dessus des panes Leaflet */}
          {canRecenter && (
            <button
              type="button"
              onClick={handleRecenter}
              title="Recentrer la carte sur les destinations affichées"
              className="absolute top-4 right-4 z-[1000] flex items-center gap-2 bg-white/95 backdrop-blur-sm hover:bg-white text-[#1A2B3C] text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-200/80 transition-colors"
            >
              <RecenterIcon />
              Recentrer
            </button>
          )}

          {/* Legend sits outside the MapContainer so it's above the Leaflet z-index stack */}
          {durationFilter && <MapLegend filter={durationFilter} />}
        </>
      )}

      {/* Empty-state overlay — visible before first search */}
      {!searched && (
        <div className={`absolute inset-0 flex justify-center z-[500] pointer-events-none ${insets ? 'items-end pb-8 px-4' : 'items-center'}`}>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center max-w-xs border border-slate-100">
            <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
            </div>
            <p className="font-bold text-[#1A2B3C] mb-1">{network.texts.explorerTitle}</p>
            <p className="text-sm text-slate-500">{network.texts.explorerHint}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function RecenterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="7" />
      <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}
