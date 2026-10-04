import { useState, useCallback, useDeferredValue, useEffect, useMemo, useRef } from 'react';
import { defaultMaxDuration, maxDurationLimit } from '../types/explorer';
import type { Destination, OriginCoords } from '../types/explorer';
import type { DurationFilter } from '../components/MapLegend';
import type { Place } from '../types/api';
import { ExplorerSearch } from '../components/SearchBoxOneStation';
import type { ExplorerSearchPayload } from '../components/SearchBoxOneStation';
import { ExplorerMap } from '../components/ExplorerMap';
import type { MapInsets } from '../components/ExplorerMap';
import { DestinationPanel } from '../components/DestinationPanel';
import { BottomSheet } from '../components/ui/BottomSheet';
import type { SheetHeights, SheetSnap } from '../components/ui/BottomSheet';
import { useNetwork } from '../network/NetworkContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { formatDate } from '../lib/format';
import { track } from '../lib/analytics';

// Téléphone : hauteur occupée en haut de la carte par la recherche repliée (marges comprises),
// et hauteur de la feuille réduite (poignée + titre de la liste).
const SEARCH_INSET = 68;
const SHEET_PEEK = 100;

/**
 * Page /explorer (réseau Europe) et /tgvmax/explorer (réseau TGVmax) : mêmes composants.
 *
 * Responsibilities:
 *  - Hold all shared state (destinations, selected, loading, origin…)
 *  - Fetch /explorer from the API (gare choisie dans l'autocomplétion ou ?from= dans l'URL)
 *  - Pass data down to ExplorerSearch, ExplorerMap, DestinationPanel
 *
 * Téléphone : carte plein écran, recherche repliée en pastille, et liste des destinations
 * (ou détail de la destination choisie) dans une feuille qui monte du bas.
 * Ordinateur : carte et panneau côte à côte.
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
  // Durée de trajet maximale affichée (curseur de la carte), en minutes
  const [maxDuration, setMaxDuration]   = useState(0);

  const isMobile = useMediaQuery('(max-width: 767px)');
  const [sheetSnap, setSheetSnap]   = useState<SheetSnap>('half');
  const [searchOpen, setSearchOpen] = useState(true);
  const pageRef = useRef<HTMLDivElement>(null);
  const [pageHeight, setPageHeight] = useState(0);

  // ── API calls ──────────────────────────────────────────────────────────────

  const runSearch = useCallback(async (from: string, day: string, time?: string) => {
    setLoading(true);
    setDestinations([]);
    setSelected(null);
    setSearched(true);
    setError(null);
    setSheetSnap('half');
    setSearchOpen(false);

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
      setMaxDuration(defaultMaxDuration(data.destinations));
      track('recherche-explorer', {
        reseau: network.id,
        de: data.from.name,
        resultats: data.destinations.length,
      });
    } catch (e) {
      console.error('[Explorer] fetch error:', e);
      setError((e as Error).message);
      setDestinations([]);
    } finally {
      setLoading(false);
    }
  }, [api, network.id, network.explorerMaxTransfers]);

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

  // La carte suit le curseur immédiatement ; la liste (des milliers de lignes) avec un léger différé
  const listMaxDuration = useDeferredValue(maxDuration);
  const listed = useMemo(
    () => destinations.filter((d) => d.duration_min <= listMaxDuration),
    [destinations, listMaxDuration],
  );
  const durationFilter = useMemo<DurationFilter | null>(
    () =>
      destinations.length === 0
        ? null
        : {
            value: maxDuration,
            limit: maxDurationLimit(destinations),
            onChange: setMaxDuration,
            shown: destinations.reduce((n, d) => n + (d.duration_min <= maxDuration ? 1 : 0), 0),
            total: destinations.length,
          },
    [destinations, maxDuration],
  );

  // Choisir une ville (sur la carte ou dans la liste) affiche son détail dans la feuille,
  // ramenée à mi-hauteur pour que la ville reste visible sur la carte.
  const handleSelect = useCallback((dest: Destination) => {
    setSelected(dest);
    setSheetSnap('half');
  }, []);

  useEffect(() => {
    const page = pageRef.current;
    if (!isMobile || !page) return;
    const observer = new ResizeObserver(() => setPageHeight(page.clientHeight));
    observer.observe(page);
    return () => observer.disconnect();
  }, [isMobile]);

  const sheetHeights = useMemo<SheetHeights>(
    () => ({
      peek: SHEET_PEEK,
      half: Math.round(pageHeight * 0.45),
      full: Math.max(pageHeight - SEARCH_INSET, SHEET_PEEK),
    }),
    [pageHeight],
  );
  const mapInsets = useMemo<MapInsets>(
    () => ({ top: SEARCH_INSET, bottom: searched ? sheetHeights.half : 0 }),
    [searched, sheetHeights.half],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <div ref={pageRef} className="relative h-[calc(100dvh-5rem-1px)] bg-slate-50 overflow-hidden">
        <div className="absolute inset-0 flex z-0">
          <ExplorerMap
            destinations={destinations}
            selected={selected}
            originCoords={originCoords}
            originName={origin?.name ?? ''}
            searched={searched}
            onSelect={handleSelect}
            durationFilter={durationFilter}
            insets={mapInsets}
          />
        </div>

        {/* Recherche : pastille repliée, qui s'ouvre sur le formulaire complet.
            Le formulaire reste monté quand il est replié pour garder la gare et la date saisies. */}
        <div className="absolute top-0 inset-x-0 z-30 px-3 pt-3">
          {!searchOpen && (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-full h-12 flex items-center gap-3 bg-white rounded-full shadow-lg border border-slate-200/80 px-4 text-left"
            >
              <span className="material-symbols-outlined text-brand text-xl flex-shrink-0">search</span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-[#1A2B3C] truncate">
                  {origin?.name || 'Choisir une gare de départ'}
                </span>
                <span className="block text-[11px] text-slate-400 truncate">
                  {date ? formatDate(date) : 'Modifier la recherche'}
                </span>
              </span>
            </button>
          )}
          <div className={searchOpen ? 'shadow-xl rounded-2xl' : 'hidden'}>
            <ExplorerSearch onSearch={handleSearch} />
          </div>
          {searchOpen && searched && (
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="bg-white text-xs font-bold text-slate-600 px-3.5 py-2 rounded-full shadow-lg border border-slate-200/80"
              >
                Fermer
              </button>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-500 font-medium mt-2 px-3 py-2 bg-white rounded-xl shadow-lg">{error}</p>
          )}
        </div>

        {searched && pageHeight > 0 && (
          <BottomSheet snap={sheetSnap} onSnapChange={setSheetSnap} heights={sheetHeights}>
            <DestinationPanel
              destinations={listed}
              total={destinations.length}
              scaleMax={listMaxDuration}
              selected={selected}
              loading={loading}
              searched={searched}
              origin={origin}
              date={date}
              onSelect={handleSelect}
              onClose={() => setSelected(null)}
            />
          </BottomSheet>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-slate-50 overflow-hidden">

      {/* Barre de recherche : z-30 pour passer au-dessus de la carte (z-10) mais
          rester sous la navbar sticky (z-100). L'autocomplétion et le calendrier
          sont confinés dans ce contexte d'empilement. */}
      <div className="w-full px-4 pt-3 pb-3 flex-shrink-0 relative z-30">
        <ExplorerSearch onSearch={handleSearch} />
        {error && <p className="text-sm text-red-500 font-medium mt-2 px-2">{error}</p>}
      </div>

      {/* Corps principal : Carte + Panneau latéral (z-index plus bas) */}
      <div className="flex flex-row flex-1 min-h-0 relative px-4 pb-4 gap-4 z-10">
        <div className="flex-1 flex bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm relative z-0">
          <ExplorerMap
            destinations={destinations}
            selected={selected}
            originCoords={originCoords}
            originName={origin?.name ?? ''}
            searched={searched}
            onSelect={setSelected}
            durationFilter={durationFilter}
          />
        </div>

        <div className="w-[400px] flex-shrink-0 flex bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm relative z-10">
          <DestinationPanel
            destinations={listed}
            total={destinations.length}
            scaleMax={listMaxDuration}
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
