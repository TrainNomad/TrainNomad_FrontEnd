import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { CARTES, type CarteCity, type CarteLayer } from '../lib/cartes';
import { formatDuration } from '../lib/format';
import { BottomSheet } from './ui/BottomSheet';
import type { SheetHeights, SheetSnap } from './ui/BottomSheet';
import { lineHref, RailLegend, RailSvg, useRailMap } from './RailMapParts';

// Téléphone : hauteur de la barre du haut (bouton Fermer, ville choisie) et de la feuille réduite
const TOP_INSET = 64;
const SHEET_PEEK = 96;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
/** Taille à l'écran des points et textes : px par unité de la carte, multipliée par ce facteur */
const SIZE = 0.75;

interface View {
  /** centre de la vue, en unités de la carte */
  cx: number;
  cy: number;
  /** 1 : toute la hauteur de la carte à l'écran */
  z: number;
}

type Size = { w: number; h: number };

const unitsPerPx = (size: Size, z: number) => CARTES.height / (size.h * z);

function clampView(v: View): View {
  return {
    z: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.z)),
    cx: Math.min(CARTES.width, Math.max(0, v.cx)),
    cy: Math.min(CARTES.height, Math.max(0, v.cy)),
  };
}

/** Cadre de la ville choisie : ses lignes et ses villes */
function layerBounds(layer: CarteLayer) {
  const xs: number[] = [layer.origin.x];
  const ys: number[] = [layer.origin.y];
  for (const l of layer.lines) {
    for (const pt of l.points.split(' ')) {
      const [x, y] = pt.split(',').map(Number);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        xs.push(x);
        ys.push(y);
      }
    }
  }
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

/**
 * Carte des trains au téléphone. Dans la page : un aperçu ; le toucher ouvre la carte en plein écran, toute la
 * hauteur de l'Europe visible, qu'on déplace d'un doigt et qu'on zoome à deux doigts. La liste (villes de départ,
 * puis les trajets de la ville choisie) est dans une feuille qui monte du bas, comme sur Explorer.
 * La carte ouverte est dans l'adresse (?carte=1, ou ?ville=…) : le bouton Retour du téléphone la ferme.
 */
export function CityRailMapMobile() {
  const { cities, selected, select, mode, setMode, layer, stale, withMaps, available, open, params, setParams } = useRailMap();
  const isOpen = params.get('carte') === '1' || !!selected;

  const openMap = () => {
    const next = new URLSearchParams(params);
    next.set('carte', '1');
    setParams(next, { preventScrollReset: true });
  };
  const closeMap = () => {
    const next = new URLSearchParams(params);
    next.delete('carte');
    next.delete('ville');
    setParams(next, { replace: true, preventScrollReset: true });
  };

  if (!cities.length) return null;

  return (
    <>
      <button
        type="button"
        onClick={openMap}
        className="relative block w-full bg-[#0e1a2b] rounded-2xl overflow-hidden shadow-sm text-left"
        aria-label="Ouvrir la carte des trains"
      >
        <RailSvg
          viewBox={`0 0 ${CARTES.width} ${CARTES.height}`}
          className="block w-full aspect-[4/3]"
          selected={null}
          layer={null}
          hover={null}
          onSelect={() => {}}
          onOpen={() => {}}
          interactive={false}
        />
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-t from-[#0e1a2b] to-transparent">
          <span className="text-sm font-semibold text-white/80">Les trains de {withMaps.length} villes</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34d399] text-[#0e1a2b] px-4 py-2 text-sm font-extrabold">
            <span className="material-symbols-outlined text-base">map</span>
            Ouvrir la carte
          </span>
        </span>
      </button>

      {isOpen && (
        <FullScreenMap
          selected={selected}
          select={select}
          mode={mode}
          setMode={setMode}
          layer={layer}
          stale={stale}
          withMaps={withMaps}
          available={available}
          open={open}
          onClose={closeMap}
        />
      )}
    </>
  );
}

type RailMapState = ReturnType<typeof useRailMap>;

function FullScreenMap({
  selected,
  select,
  mode,
  setMode,
  layer,
  stale,
  withMaps,
  available,
  open,
  onClose,
}: Pick<RailMapState, 'selected' | 'select' | 'mode' | 'setMode' | 'layer' | 'stale' | 'withMaps' | 'available' | 'open'> & { onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [view, setView] = useState<View>({ cx: CARTES.width / 2, cy: CARTES.height / 2, z: 1 });
  const viewRef = useRef(view);
  const [snap, setSnap] = useState<SheetSnap>(selected ? 'half' : 'peek');

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(0);
  const anim = useRef<number | null>(null);

  const apply = useCallback((next: View) => {
    viewRef.current = clampView(next);
    setView(viewRef.current);
  }, []);
  const stopAnim = () => {
    if (anim.current !== null) cancelAnimationFrame(anim.current);
    anim.current = null;
  };
  const animateTo = useCallback(
    (target: View) => {
      stopAnim();
      const from = viewRef.current;
      const to = clampView(target);
      const start = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - start) / 450);
        const e = 1 - Math.pow(1 - p, 3);
        apply({ cx: from.cx + (to.cx - from.cx) * e, cy: from.cy + (to.cy - from.cy) * e, z: from.z + (to.z - from.z) * e });
        anim.current = p < 1 ? requestAnimationFrame(step) : null;
      };
      anim.current = requestAnimationFrame(step);
    },
    [apply],
  );

  // Taille de l'écran de la carte ; la page derrière ne défile pas
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    observer.observe(el);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      observer.disconnect();
      document.body.style.overflow = overflow;
      stopAnim();
    };
  }, []);

  const heights = useMemo<SheetHeights | null>(
    () =>
      size
        ? { peek: SHEET_PEEK, half: Math.round(size.h * 0.42), full: Math.max(size.h - TOP_INSET, SHEET_PEEK) }
        : null,
    [size],
  );

  // Ville choisie : la carte se cadre sur ses lignes, au-dessus de la feuille à mi-hauteur
  useEffect(() => {
    if (!size || !heights || !layer) return;
    const b = layerBounds(layer);
    const availH = Math.max(120, size.h - heights.half - TOP_INSET);
    const u = Math.max((b.x1 - b.x0) / (size.w - 32), (b.y1 - b.y0) / availH, CARTES.height / (size.h * MAX_ZOOM)) * 1.12;
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, CARTES.height / (size.h * u)));
    // centre du cadre à mi-hauteur de la zone libre (entre la barre du haut et la feuille)
    const offsetPx = (heights.half - TOP_INSET) / 2;
    animateTo({ cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2 + offsetPx * unitsPerPx(size, z), z });
  }, [layer, size, heights, animateTo]);

  // Retour à toutes les villes : toute la hauteur de la carte
  useEffect(() => {
    if (!selected) animateTo({ cx: CARTES.width / 2, cy: CARTES.height / 2, z: 1 });
    setSnap(selected ? 'half' : 'peek');
  }, [selected, animateTo]);

  // Molette (souris, pavé tactile) : zoom autour du pointeur
  useEffect(() => {
    const el = box.current;
    if (!el || !size) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAround(e.clientX - r.left, e.clientY - r.top, e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  /** Zoom de `factor` : le point de la carte sous (ax, ay) se retrouve sous (bx, by) (pixels de l'écran) */
  const zoomAround = (ax: number, ay: number, bx: number, by: number, factor: number) => {
    if (!size) return;
    const v = viewRef.current;
    const u0 = unitsPerPx(size, v.z);
    const wx = v.cx + (ax - size.w / 2) * u0;
    const wy = v.cy + (ay - size.h / 2) * u0;
    const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.z * factor));
    const u1 = unitsPerPx(size, z);
    apply({ z, cx: wx - (bx - size.w / 2) * u1, cy: wy - (by - size.h / 2) * u1 });
  };

  const local = (e: ReactPointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    stopAnim();
    if (pointers.current.size === 0) moved.current = 0;
    pointers.current.set(e.pointerId, local(e));
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev || !size) return;
    const next = local(e);
    if (pointers.current.size === 1) {
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      moved.current += Math.abs(dx) + Math.abs(dy);
      pointers.current.set(e.pointerId, next);
      const v = viewRef.current;
      const u = unitsPerPx(size, v.z);
      apply({ ...v, cx: v.cx - dx * u, cy: v.cy - dy * u });
      return;
    }
    // deux doigts : écartement (zoom) et déplacement du milieu
    const [a, b] = [...pointers.current.entries()].slice(0, 2);
    const other = a[0] === e.pointerId ? b[1] : a[1];
    const mid0 = { x: (prev.x + other.x) / 2, y: (prev.y + other.y) / 2 };
    const mid1 = { x: (next.x + other.x) / 2, y: (next.y + other.y) / 2 };
    const d0 = Math.hypot(prev.x - other.x, prev.y - other.y);
    const d1 = Math.hypot(next.x - other.x, next.y - other.y);
    moved.current += 20;
    pointers.current.set(e.pointerId, next);
    if (d0 > 0) zoomAround(mid0.x, mid0.y, mid1.x, mid1.y, d1 / d0);
  };
  const onPointerEnd = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId);
  };

  const zoomBy = (factor: number) => size && zoomAround(size.w / 2, size.h / 2, size.w / 2, size.h / 2, factor);

  const u = size ? unitsPerPx(size, view.z) : 1;
  const viewBox = size ? `${view.cx - (size.w * u) / 2} ${view.cy - (size.h * u) / 2} ${size.w * u} ${size.h * u}` : `0 0 ${CARTES.width} ${CARTES.height}`;

  const choose = (city: CarteCity | null) => select(city);

  return (
    <div className="fixed inset-x-0 bottom-0 top-20 z-[90] bg-[#0e1a2b] overflow-hidden" role="dialog" aria-modal="true" aria-label="Carte des trains">
      <div
        ref={box}
        className="absolute inset-0 touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onPointerLeave={onPointerEnd}
        onClickCapture={(e) => {
          // un glissement de la carte ne compte pas comme un toucher sur une ville ou une ligne
          if (moved.current > 10) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {size && (
          <RailSvg
            viewBox={viewBox}
            className="absolute inset-0 w-full h-full"
            selected={selected}
            layer={layer}
            hover={null}
            k={SIZE * u}
            onSelect={choose}
            onOpen={open}
          />
        )}
      </div>

      {/* Barre du haut : fermer, ville choisie */}
      <div className="absolute top-0 inset-x-0 z-30 px-3 pt-3 flex items-center gap-2 pointer-events-none">
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto inline-flex items-center gap-1 h-10 rounded-full bg-white text-slate-700 pl-3 pr-4 text-sm font-bold shadow-lg"
        >
          <span className="material-symbols-outlined text-lg">close</span>
          Fermer
        </button>
        {selected && (
          <button
            type="button"
            onClick={() => choose(null)}
            className="pointer-events-auto inline-flex items-center gap-1.5 h-10 rounded-full bg-[#34d399] text-[#0e1a2b] pl-4 pr-2.5 text-sm font-extrabold shadow-lg min-w-0"
            aria-label={`Revenir à toutes les villes (départ de ${selected.name})`}
          >
            <span className="truncate">Depuis {selected.name}</span>
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        )}
        <div className="ml-auto flex flex-col gap-1.5 pointer-events-auto">
          <button type="button" onClick={() => zoomBy(1.6)} aria-label="Zoomer"
            className="w-10 h-10 rounded-full bg-white text-slate-700 shadow-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">add</span>
          </button>
          <button type="button" onClick={() => zoomBy(1 / 1.6)} aria-label="Dézoomer"
            className="w-10 h-10 rounded-full bg-white text-slate-700 shadow-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-xl">remove</span>
          </button>
        </div>
      </div>

      {heights && (
        <BottomSheet snap={snap} onSnapChange={setSnap} heights={heights}>
          <div className="flex-1 min-h-0 flex flex-col">
            {selected ? (
              <CityTrips city={selected} layer={layer} stale={stale} mode={mode} setMode={setMode} available={available} />
            ) : (
              <CityChoice cities={withMaps} onChoose={choose} />
            )}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

/** Aucune ville choisie : les villes de départ, les plus reliées d'abord */
function CityChoice({ cities, onChoose }: { cities: CarteCity[]; onChoose: (c: CarteCity) => void }) {
  return (
    <>
      <div className="px-5 pb-3 flex-shrink-0">
        <p className="text-base font-extrabold text-slate-900">Choisir une ville de départ</p>
        <p className="text-xs text-slate-500">Touchez une ville sur la carte ou dans la liste.</p>
      </div>
      <ul className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 border-t border-slate-100 pb-[env(safe-area-inset-bottom)]">
        {cities.map((c) => (
          <li key={c.slug}>
            <button type="button" onClick={() => onChoose(c)} className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left">
              <span className="font-semibold text-slate-800">{c.name}</span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                {c.dests?.length ?? 0} destinations
                <ChevronRight className="w-4 h-4" aria-hidden />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Ville choisie : ses filtres, puis ses trajets (page de la liaison ou recherche) */
function CityTrips({
  city,
  layer,
  stale,
  mode,
  setMode,
  available,
}: { city: CarteCity; layer: CarteLayer | null; stale: boolean } & Pick<RailMapState, 'mode' | 'setMode' | 'available'>) {
  const onMap = layer ? new Set(layer.lines.map((l) => l.dest)) : null;
  // Liste de la ville (la même que sous la carte), réduite aux destinations dessinées pour ce filtre
  const dests = (city.dests ?? []).filter((d) => (onMap ? onMap.has(d.name) : mode === 'correspondance'));

  return (
    <>
      <div className="px-5 pb-3 flex-shrink-0">
        <p className="text-base font-extrabold text-slate-900">Trains au départ de {city.name}</p>
        {available.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {available.map(({ mode: m, label }) => {
              const info = city.maps.find((x) => x.mode === m)!;
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={m === mode}
                  onClick={() => setMode(m)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold border transition-colors ${
                    m === mode ? 'border-[#1d7a5a] text-[#1d7a5a] bg-[#1d7a5a]/10' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {label} <span className="opacity-60">· {info.direct + info.other}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto border-t border-slate-100 pb-[env(safe-area-inset-bottom)]">
        {stale && (
          <p className="px-5 py-3 text-xs text-amber-700">La carte de {city.name} est en cours de mise à jour : ses lignes reviennent au prochain calcul.</p>
        )}
        <ul className="divide-y divide-slate-100">
          {dests.map((d) => (
            <li key={d.name}>
              <Link to={lineHref(city, { slug: d.slug, id: d.id, dest: d.name })} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="font-semibold text-slate-800">{d.name}</span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap">
                  {formatDuration(d.min)}
                  {d.direct ? ' · direct' : ' · 1 corresp.'}
                  <ChevronRight className="w-4 h-4" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {!layer && !stale && dests.length === 0 && <p className="px-5 py-4 text-sm text-slate-400">Chargement des lignes…</p>}
        {layer && <RailLegend layer={layer} className="px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500" />}
      </div>
    </>
  );
}
