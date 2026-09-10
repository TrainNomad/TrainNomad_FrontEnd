import { MapContainer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { useCallback, useEffect, useRef } from 'react';
import { latLngBounds } from 'leaflet';
import type { Map as LeafletMap, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MaptilerLayer } from '@maptiler/leaflet-maptilersdk';
import { MapLegend } from './MapLegend';
import { getDurationColor, formatDuration } from '../types/explorer';
import type { Destination, OriginCoords } from '../types/explorer';

interface Props {
  destinations: Destination[];
  selected: Destination | null;
  originCoords: OriginCoords | null;
  originName: string;
  searched: boolean;
  onSelect: (dest: Destination) => void;
}

// ─── Helpers géo ──────────────────────────────────────────────────────────────

const isCoord = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Tous les points affichés sur la carte (origine + destinations valides). */
function collectPoints(
  destinations: Destination[],
  originCoords: OriginCoords | null,
): LatLngTuple[] {
  const pts: LatLngTuple[] = [];
  if (originCoords && isCoord(originCoords.lat) && isCoord(originCoords.lon)) {
    pts.push([originCoords.lat, originCoords.lon]);
  }
  if (Array.isArray(destinations)) {
    for (const d of destinations) {
      if (isCoord(d.dest_lat) && isCoord(d.dest_lon)) pts.push([d.dest_lat, d.dest_lon]);
    }
  }
  return pts;
}

/** Recadre la carte sur l'ensemble des points. No-op s'il n'y en a aucun. */
function fitToPoints(map: LeafletMap, pts: LatLngTuple[]) {
  if (pts.length === 0) return;
  map.fitBounds(latLngBounds(pts), {
    padding: [56, 56],
    maxZoom: pts.length === 1 ? 10 : 12,
  });
}

// ─── Contenu interne (a accès à useMap) ───────────────────────────────────────

interface InnerProps extends Props {
  mapRef: React.MutableRefObject<LeafletMap | null>;
}

function MapContent({
  destinations,
  selected,
  originCoords,
  originName,
  onSelect,
  mapRef,
}: InnerProps) {
  const map = useMap();

  // Expose l'instance Leaflet au composant parent (bouton « Recentrer »)
  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);

  // Fond de carte MapTiler
  useEffect(() => {
    // Pas de `style` : on garde le fond MapTiler par défaut (MapTiler Streets),
    // celui qui était réellement rendu avant (MapStyle.LIGHT n'existe pas et
    // valait donc undefined).
    const mtLayer = new MaptilerLayer({
      apiKey: 'sBZIT01ONEm9wMymYCwd',
    });
    mtLayer.addTo(map);
    return () => {
      map.removeLayer(mtLayer);
    };
  }, [map]);

  // Auto-recadrage à chaque nouveau jeu de résultats
  useEffect(() => {
    fitToPoints(map, collectPoints(destinations, originCoords));
  }, [map, destinations, originCoords]);

  // Recentrage doux sur la destination sélectionnée
  useEffect(() => {
    if (!selected || !isCoord(selected.dest_lat) || !isCoord(selected.dest_lon)) return;
    map.flyTo([selected.dest_lat, selected.dest_lon], Math.max(map.getZoom(), 8), {
      duration: 0.6,
    });
  }, [map, selected]);

  return (
    <>
      {/* Origin pin */}
      {originCoords && isCoord(originCoords.lat) && isCoord(originCoords.lon) && (
        <CircleMarker
          center={[originCoords.lat, originCoords.lon]}
          radius={9}
          pathOptions={{ fillColor: '#1A2B3C', color: '#fff', weight: 2.5, fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]}>
            <span className="font-bold text-xs">{originName}</span>
          </Tooltip>
        </CircleMarker>
      )}

      {/* Destination markers */}
      {Array.isArray(destinations) && destinations.map((d, i) => {
        if (!isCoord(d.dest_lat) || !isCoord(d.dest_lon)) return null;
        const color = getDurationColor(d.duration);
        const isSelected = selected?.dest_name === d.dest_name;
        return (
          <CircleMarker
            key={i}
            center={[d.dest_lat, d.dest_lon]}
            radius={isSelected ? 12 : 8}
            pathOptions={{
              fillColor: color,
              color: isSelected ? '#1A2B3C' : '#fff',
              weight: isSelected ? 3 : 1.5,
              fillOpacity: 0.9,
            }}
            eventHandlers={{ click: () => onSelect(d) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <span className="font-bold">{d.dest_name}</span>
              <br />
              {formatDuration(d.duration)} ·{' '}
              {d.transfers === 0 ? 'Direct' : `${d.transfers} corresp.`}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

// ─── Composant public ─────────────────────────────────────────────────────────

/**
 * Carte Leaflet pleine hauteur (fond MapTiler), marqueurs colorés par durée,
 * légende, bouton de recentrage et état vide avant la première recherche.
 *
 * Le recadrage est automatique à chaque recherche ; le bouton « Recentrer »
 * permet de revenir sur l'ensemble des points après un zoom manuel.
 */
export function ExplorerMap({
  destinations,
  selected,
  originCoords,
  originName,
  searched,
  onSelect,
}: Props) {
  const mapRef = useRef<LeafletMap | null>(null);
  const canRecenter = collectPoints(destinations, originCoords).length > 0;

  const handleRecenter = useCallback(() => {
    if (mapRef.current) fitToPoints(mapRef.current, collectPoints(destinations, originCoords));
  }, [destinations, originCoords]);

  return (
    <div className="flex-1 relative">
      <MapContainer
        center={[46.5, 2.5]}
        zoom={6}
        className="w-full h-full"
        zoomControl
      >
        <MapContent
          destinations={destinations}
          selected={selected}
          originCoords={originCoords}
          originName={originName}
          searched={searched}
          onSelect={onSelect}
          mapRef={mapRef}
        />
      </MapContainer>

      {/* Bouton de recentrage — hors MapContainer pour passer au-dessus des panes Leaflet */}
      {canRecenter && (
        <button
          type="button"
          onClick={handleRecenter}
          title="Recentrer la carte sur toutes les destinations"
          className="absolute top-4 right-4 z-[1000] flex items-center gap-2 bg-white/95 backdrop-blur-sm hover:bg-white text-[#1A2B3C] text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-200/80 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="7" />
            <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          Recentrer
        </button>
      )}

      {/* Legend sits outside the MapContainer so it's above the Leaflet z-index stack */}
      <MapLegend />

      {/* Empty-state overlay — visible before first search */}
      {!searched && (
        <div className="absolute inset-0 flex items-center justify-center z-[500] pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center max-w-xs border border-slate-100">
            <div className="w-14 h-14 rounded-full bg-[#1d7a5a]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#1d7a5a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
            </div>
            <p className="font-bold text-[#1A2B3C] mb-1">Explorer l'Europe en train</p>
            <p className="text-sm text-slate-500">
              Saisissez une gare de départ pour découvrir toutes les destinations accessibles.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
