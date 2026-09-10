import { useState, useCallback } from 'react';
import type { Destination, OriginCoords } from '../types/explorer';
import { ExplorerSearch } from '../components/SearchBoxOneStation';
import type { ExplorerSearchPayload } from '../components/SearchBoxOneStation';
import { ExplorerMap } from '../components/ExplorerMap';
import { DestinationPanel } from '../components/DestinationPanel';

const API_BASE = 'https://trainnomad-sql.onrender.com';

/**
 * /explorer page.
 *
 * Responsibilities:
 *  - Hold all shared state (destinations, selected, loading, originCoords…)
 *  - Fetch /explorer from the API (la gare provient de l'autocomplétion)
 *  - Pass data down to ExplorerSearch, ExplorerMap, DestinationPanel
 */
export default function Explorer() {
  const [destinations, setDestinations]   = useState<Destination[]>([]);
  const [selected, setSelected]           = useState<Destination | null>(null);
  const [loading, setLoading]             = useState(false);
  const [searched, setSearched]           = useState(false);
  const [originCoords, setOriginCoords]   = useState<OriginCoords | null>(null);
  const [originName, setOriginName]       = useState('');

  // ── API calls ──────────────────────────────────────────────────────────────

  // La gare vient de la sélection dans l'autocomplétion : plus besoin de
  // re-deviner la gare officielle via /stations à partir du texte saisi.
  const handleSearch = useCallback(async ({ station, origin, date }: ExplorerSearchPayload) => {
    setLoading(true);
    setDestinations([]);
    setSelected(null);
    setSearched(true);
    setOriginName(station.label);

    // /stations ne renvoie pas de coordonnées aujourd'hui : on n'affiche le
    // marqueur d'origine que si l'API finit par en fournir.
    setOriginCoords(
      station.lat != null && station.lon != null &&
      Number.isFinite(Number(station.lat)) && Number.isFinite(Number(station.lon))
        ? { lat: Number(station.lat), lon: Number(station.lon) }
        : null,
    );

    try {
      const res = await fetch(
        `${API_BASE}/explorer?from=${encodeURIComponent(origin)}&date=${encodeURIComponent(date)}`,
      );
      const data = await res.json();

      const results: Destination[] = Array.isArray(data)
        ? data
        : (Array.isArray(data.results) ? data.results : (Array.isArray(data.destinations) ? data.destinations : []));

      setDestinations(results);
    } catch (e) {
      console.error('[Explorer] fetch error:', e);
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-slate-50 overflow-hidden">
      
      {/* Barre de recherche : z-30 pour passer au-dessus de la carte (z-10) mais
          rester sous la navbar sticky (z-100). L'autocomplétion et le calendrier
          sont confinés dans ce contexte d'empilement. */}
      <div className="w-full px-4 pt-3 pb-3 flex-shrink-0 relative z-30">
        <ExplorerSearch onSearch={handleSearch} />
      </div>

      {/* Corps principal : Carte + Panneau latéral (z-index plus bas) */}
      <div className="flex flex-1 min-h-0 relative px-4 pb-4 gap-4 z-10">
        <div className="flex-1 flex bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm relative z-0">
          <ExplorerMap
            destinations={destinations}
            selected={selected}
            originCoords={originCoords}
            originName={originName}
            searched={searched}
            onSelect={setSelected}
          />
        </div>

        <div className="w-[400px] flex-shrink-0 flex bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm relative z-10">
          <DestinationPanel
            destinations={destinations}
            selected={selected}
            loading={loading}
            searched={searched}
            originName={originName}
            onSelect={setSelected}
            onClose={() => setSelected(null)}
          />
        </div>
      </div>
    </div>
  );
}