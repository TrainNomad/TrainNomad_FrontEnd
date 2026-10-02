import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Destination, OriginCoords } from '../types/explorer';
import type { Place } from '../types/api';
import { ExplorerSearch } from '../components/SearchBoxOneStation';
import type { ExplorerSearchPayload } from '../components/SearchBoxOneStation';
import { ExplorerMap } from '../components/ExplorerMap';
import { DestinationPanel } from '../components/DestinationPanel';
import { useNetwork } from '../network/NetworkContext';

/**
 * Page /explorer (réseau Europe) et /tgvmax/explorer (réseau TGVmax) : mêmes composants.
 *
 * Responsibilities:
 *  - Hold all shared state (destinations, selected, loading, origin…)
 *  - Fetch /explorer from the API (gare choisie dans l'autocomplétion ou ?from= dans l'URL)
 *  - Pass data down to ExplorerSearch, ExplorerMap, DestinationPanel
 */
export default function Explorer() {
  const { api, network } = useNetwork();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selected, setSelected]         = useState<Destination | null>(null);
  const [loading, setLoading]           = useState(false);
  const [searched, setSearched]         = useState(false);
  const [origin, setOrigin]             = useState<Place | null>(null);
  const [date, setDate]                 = useState('');
  const [error, setError]               = useState<string | null>(null);

  // ── API calls ──────────────────────────────────────────────────────────────

  const runSearch = useCallback(async (from: string, day: string, time?: string) => {
    setLoading(true);
    setDestinations([]);
    setSelected(null);
    setSearched(true);
    setError(null);

    try {
      const data = await api.exploreDestinations({
        from,
        date: day,
        time,
        maxTransfers: network.explorerMaxTransfers,
      });
      // L'API renvoie la gare / ville d'origine résolue, avec ses coordonnées
      setOrigin(data.from);
      setDate(data.date);
      setDestinations(data.destinations);
    } catch (e) {
      console.error('[Explorer] fetch error:', e);
      setError((e as Error).message);
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  }, [api, network.explorerMaxTransfers]);

  const handleSearch = useCallback(
    ({ station, origin: from, date: day, time }: ExplorerSearchPayload) => {
      setOrigin(station);
      runSearch(from, day, time);
    },
    [runSearch],
  );

  // Arrivée depuis la page d'accueil : /explorer?from=city:TL4916&date=2026-09-17
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) runSearch(from, params.get('date') || '', params.get('time') || undefined);
  }, [runSearch]);

  // Mémorisé : un nouvel objet à chaque rendu relançait le recadrage de la carte
  // (par exemple à chaque clic sur une destination).
  const originCoords = useMemo<OriginCoords | null>(
    () =>
      origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lon) && (origin.lat !== 0 || origin.lon !== 0)
        ? { lat: origin.lat, lon: origin.lon }
        : null,
    [origin?.lat, origin?.lon],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-slate-50 overflow-hidden">

      {/* Barre de recherche : z-30 pour passer au-dessus de la carte (z-10) mais
          rester sous la navbar sticky (z-100). L'autocomplétion et le calendrier
          sont confinés dans ce contexte d'empilement. */}
      <div className="w-full px-4 pt-3 pb-3 flex-shrink-0 relative z-30">
        <ExplorerSearch onSearch={handleSearch} />
        {error && <p className="text-sm text-red-500 font-medium mt-2 px-2">{error}</p>}
      </div>

      {/* Corps principal : Carte + Panneau latéral (z-index plus bas).
          Mobile : carte au-dessus, liste en dessous ; à partir de md : côte à côte. */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 relative px-4 pb-4 gap-4 z-10">
        <div className="flex-1 min-h-[40%] flex bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm relative z-0">
          <ExplorerMap
            destinations={destinations}
            selected={selected}
            originCoords={originCoords}
            originName={origin?.name ?? ''}
            searched={searched}
            onSelect={setSelected}
          />
        </div>

        <div className="h-[45%] md:h-auto w-full md:w-[400px] flex-shrink-0 flex bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm relative z-10">
          <DestinationPanel
            destinations={destinations}
            selected={selected}
            loading={loading}
            searched={searched}
            origin={origin}
            date={date}
            onSelect={setSelected}
            onClose={() => setSelected(null)}
          />
        </div>
      </div>
    </div>
  );
}
