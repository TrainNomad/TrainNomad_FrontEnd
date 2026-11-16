// Morceaux de la carte des trains de /train/, communs à l'ordinateur (CityRailMap) et au téléphone (CityRailMapMobile)
import { useEffect, useState, type MouseEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CARTES, CARTE_MODES, carteLayerUrl, withoutHidden, type CarteCity, type CarteLabel, type CarteLayer, type CarteLayers, type CarteLine, type CarteMode } from '../lib/cartes';
import { typicalDay } from '../lib/liaisons';
import { liaisonPath, tripsPath } from '../lib/seoPages';

const BG = '#0e1a2b';
const MINT = '#34d399';

function Label({ label, text, size, weight, opacity = 1, k = 1 }: { label: CarteLabel; text: string; size: number; weight: number; opacity?: number; k?: number }) {
  const [anchor, x, y] = label;
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={size * k}
      fontWeight={weight}
      fill="#fff"
      fillOpacity={opacity}
      stroke={BG}
      strokeWidth={5 * k}
      strokeLinejoin="round"
      paintOrder="stroke"
      pointerEvents="none"
    >
      {text}
    </text>
  );
}

/**
 * État de la carte des trains, commun à l'ordinateur et au téléphone : ville choisie (dans l'adresse,
 * /train/?ville=paris, lien partageable), filtre, lignes de la ville (chargées au choix de la ville).
 */
export function useRailMap() {
  const { cities } = CARTES;
  const [params, setParams] = useSearchParams();
  const selected = cities.find((c) => c.slug === params.get('ville') && c.maps.length) ?? null;
  const [mode, setMode] = useState<CarteMode>('correspondance');
  const [layers, setLayers] = useState<{ city: string; data: CarteLayers } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!selected) return;
    const ctrl = new AbortController();
    fetch(carteLayerUrl(selected), { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: CarteLayers) => setLayers({ city: selected.name, data: withoutHidden(data) }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [selected]);

  // filtre absent pour cette ville (pas de train de nuit à Lyon) : direct et une correspondance
  const activeMode: CarteMode = selected?.maps.some((m) => m.mode === mode) ? mode : 'correspondance';
  const loaded = selected && layers?.city === selected.name ? layers.data : null;
  // lignes d'un autre cadrage (ville pas encore recalculée après l'ajout de villes au site) : décalées sur le fond,
  // on ne les dessine pas
  const stale = !!loaded && loaded.proj !== CARTES.proj;
  const layer = loaded && !stale ? loaded[activeMode] ?? null : null;
  const withMaps = cities.filter((c) => c.maps.length);
  const available = selected ? CARTE_MODES.filter((m) => selected.maps.some((x) => x.mode === m.mode)) : [];

  const select = (city: CarteCity | null) => {
    const next = new URLSearchParams(params);
    if (city) next.set('ville', city.slug);
    else next.delete('ville');
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const open = (line: Pick<CarteLine, 'slug' | 'id' | 'dest'>) => {
    if (!selected) return;
    navigate(lineHref(selected, line));
  };

  return { cities, selected, select, mode: activeMode, setMode, layer, stale, withMaps, available, open, params, setParams };
}

/** Page d'une liaison, ou la recherche entre les deux villes s'il n'y en a pas */
export const lineHref = (from: CarteCity, line: Pick<CarteLine, 'slug' | 'id' | 'dest'>) =>
  line.slug ? liaisonPath(line.slug) : tripsPath('/trajets', { id: from.id, name: from.name }, { id: line.id, name: line.dest }, typicalDay(new Date()));

interface RailSvgProps {
  viewBox: string;
  selected: CarteCity | null;
  layer: CarteLayer | null;
  hover: string | null;
  /** Échelle des points, traits et textes (1 sur ordinateur ; au téléphone, suit le zoom) */
  k?: number;
  onHover?: (name: string | null, e?: MouseEvent, text?: string) => void;
  onSelect: (city: CarteCity) => void;
  onOpen: (line: CarteLine) => void;
  className?: string;
  interactive?: boolean;
}

/** Le dessin de la carte : fond, lignes de la ville choisie, points et noms des villes */
export function RailSvg({ viewBox, selected, layer, hover, k = 1, onHover, onSelect, onOpen, className, interactive = true }: RailSvgProps) {
  const { cities } = CARTES;
  const { width: W, height: H } = CARTES;
  const leave = () => onHover?.(null);

  const cityDot = (c: CarteCity) => {
    const inLayer = layer?.nodes.some((n) => n.name === c.name) || c.name === selected?.name;
    const clickable = interactive && c.maps.length > 0;
    return (
      <g
        key={c.name}
        className={clickable ? 'cursor-pointer' : undefined}
        onClick={clickable ? () => onSelect(c) : undefined}
        onMouseMove={(e) => onHover?.(null, e, clickable ? `Les trains au départ de ${c.name}` : c.name)}
        onMouseLeave={leave}
      >
        {/* zone de clic plus large que le point, pour le doigt */}
        <circle cx={c.x} cy={c.y} r={18 * k} fill="transparent" />
        {!inLayer && (
          <circle cx={c.x} cy={c.y} r={(selected ? 4 : 6) * k} fill={selected ? BG : '#fff'} stroke={selected ? '#fff' : BG}
            strokeWidth={2 * k} strokeOpacity={selected ? 0.35 : 1} />
        )}
      </g>
    );
  };

  return (
    <svg viewBox={viewBox} className={className} role="img" preserveAspectRatio="xMidYMid meet"
      aria-label={selected ? `Trains au départ de ${selected.name}` : 'Les villes des liaisons en train de TrainNomad'}>
      <defs>
        <radialGradient id="rail-glow">
          <stop offset="0" stopColor={MINT} stopOpacity=".45" />
          <stop offset="1" stopColor={MINT} stopOpacity="0" />
        </radialGradient>
      </defs>
      <image href="/cartes/europe.svg" width={W} height={H} />

      {layer && (
        <>
          <circle cx={layer.origin.x} cy={layer.origin.y} r={80 * k} fill="url(#rail-glow)" />
          {/* sous-couche sombre, puis les lignes : pointillés d'abord, directs par-dessus */}
          {layer.lines.map((l, i) => (
            <polyline key={`u${i}`} points={l.points} fill="none" stroke={BG} strokeWidth={6.4 * k} strokeLinejoin="round"
              strokeLinecap="round" strokeOpacity={hover && hover !== l.dest ? 0.1 : l.after ? 0.55 : 0.9} />
          ))}
          {layer.lines.map((l, i) => (
            <polyline
              key={`l${i}`}
              points={l.points}
              fill="none"
              stroke={l.color}
              strokeWidth={(l.after ? 4 : 3.4) * k}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={l.after ? `${0.1 * k} ${7 * k}` : undefined}
              opacity={hover && hover !== l.dest ? 0.15 : 1}
              className={interactive ? 'cursor-pointer transition-opacity' : undefined}
              onMouseMove={(e) => onHover?.(l.dest, e, l.tip)}
              onMouseLeave={leave}
              onClick={interactive ? () => onOpen(l) : undefined}
            />
          ))}
        </>
      )}

      {cities.map(cityDot)}

      {layer && (
        <>
          {layer.nodes.map((n) => {
            const line = layer.lines.find((l) => l.dest === n.name);
            const dim = hover && hover !== n.name ? 0.25 : 1;
            return (
              <g
                key={n.name}
                opacity={dim}
                className={line && interactive ? 'cursor-pointer' : undefined}
                onMouseMove={line ? (e) => onHover?.(n.name, e, line.tip) : undefined}
                onMouseLeave={leave}
                onClick={line && interactive ? () => onOpen(line) : undefined}
              >
                {n.kind === 'direct' && <circle cx={n.x} cy={n.y} r={7 * k} fill="#fff" stroke={BG} strokeWidth={2.5 * k} />}
                {n.kind === 'corresp' && <circle cx={n.x} cy={n.y} r={6.5 * k} fill={BG} stroke="#fff" strokeWidth={3 * k} />}
                {n.kind === 'via' && <circle cx={n.x} cy={n.y} r={4.5 * k} fill={BG} stroke="#fff" strokeWidth={2 * k} strokeOpacity={0.8} />}
                <Label label={n.label} text={n.name} size={n.kind === 'via' ? 13 : 18} weight={n.kind === 'via' ? 500 : 700}
                  opacity={n.kind === 'via' ? 0.7 : 1} k={k} />
              </g>
            );
          })}
          <circle cx={layer.origin.x} cy={layer.origin.y} r={12 * k} fill={MINT} stroke="#fff" strokeWidth={3 * k} pointerEvents="none" />
          {selected && <Label label={layer.origin.label} text={selected.name} size={26} weight={800} k={k} />}
        </>
      )}

      {!selected && cities.map((c) => c.label && <Label key={c.name} label={c.label} text={c.name} size={15} weight={700} k={k} />)}
    </svg>
  );
}

/** Légende des lignes de la ville choisie */
export function RailLegend({ layer, className }: { layer: CarteLayer; className?: string }) {
  return (
    <div className={className}>
      <span className="inline-flex items-center gap-2"><span className="inline-block w-6 h-[3px] rounded bg-current" />Train direct</span>
      {layer.lines.some((l) => l.after) && (
        <span className="inline-flex items-center gap-2"><span className="inline-block w-6 border-t-[3px] border-dotted border-current" />Après une correspondance</span>
      )}
      {layer.legend.map(([name, color]) => (
        <span key={name} className="inline-flex items-center gap-1.5"><span className="inline-block w-4 h-1.5 rounded" style={{ background: color }} />{name}</span>
      ))}
    </div>
  );
}
