import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CARTES, CARTE_MODES, carteLayerUrl, type CarteCity, type CarteLabel, type CarteLayers, type CarteLine, type CarteMode } from '../lib/cartes';
import { typicalDay } from '../lib/liaisons';
import { liaisonPath, tripsPath } from '../lib/seoPages';

const BG = '#0e1a2b';
const MINT = '#34d399';

interface Tip {
  x: number;
  y: number;
  text: string;
}

function Label({ label, text, size, weight, opacity = 1 }: { label: CarteLabel; text: string; size: number; weight: number; opacity?: number }) {
  const [anchor, x, y] = label;
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={size}
      fontWeight={weight}
      fill="#fff"
      fillOpacity={opacity}
      stroke={BG}
      strokeWidth={5}
      strokeLinejoin="round"
      paintOrder="stroke"
      pointerEvents="none"
    >
      {text}
    </text>
  );
}

/**
 * Carte des trains de la page /train/ : les villes du site sur l'Europe en points ; un clic sur une ville
 * affiche ses lignes (direct et une correspondance, directs, moins de 3 h, trains de nuit), sur les voies.
 * Survol d'une ligne : durée et compagnie ; clic : la page de la liaison, ou la recherche s'il n'y en a pas.
 */
export default function CityRailMap() {
  const { width: W, height: H, cities } = CARTES;
  // ville choisie : dans l'adresse (/train/?ville=paris), lien partageable ; les listes sous la carte la changent aussi
  const [params, setParams] = useSearchParams();
  const selected = cities.find((c) => c.slug === params.get('ville') && c.maps.length) ?? null;
  const [mode, setMode] = useState<CarteMode>('correspondance');
  const [layers, setLayers] = useState<{ city: string; data: CarteLayers } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!selected) return;
    const ctrl = new AbortController();
    fetch(carteLayerUrl(selected), { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => setLayers({ city: selected.name, data }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [selected]);

  if (!cities.length) return null;

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
    setHover(null);
    setTip(null);
    const next = new URLSearchParams(params);
    if (city) next.set('ville', city.slug);
    else next.delete('ville');
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const showTip = (e: MouseEvent, text: string) => {
    const rect = box.current?.getBoundingClientRect();
    if (rect) setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, text });
  };
  const clearTip = () => {
    setHover(null);
    setTip(null);
  };

  const open = (line: Pick<CarteLine, 'slug' | 'id' | 'dest'>) => {
    if (!selected) return;
    if (line.slug) navigate(liaisonPath(line.slug));
    else navigate(tripsPath('/trajets', { id: selected.id, name: selected.name }, { id: line.id, name: line.dest }, typicalDay(new Date())));
  };

  const cityDot = (c: CarteCity) => {
    const inLayer = layer?.nodes.some((n) => n.name === c.name) || c.name === selected?.name;
    const clickable = c.maps.length > 0;
    return (
      <g
        key={c.name}
        className={clickable ? 'cursor-pointer' : undefined}
        onClick={clickable ? () => select(c) : undefined}
        onMouseMove={(e) => showTip(e, clickable ? `Les trains au départ de ${c.name}` : c.name)}
        onMouseLeave={clearTip}
      >
        {/* zone de clic plus large que le point, pour le doigt */}
        <circle cx={c.x} cy={c.y} r={18} fill="transparent" />
        {!inLayer && (
          <circle cx={c.x} cy={c.y} r={selected ? 4 : 6} fill={selected ? BG : '#fff'} stroke={selected ? '#fff' : BG}
            strokeWidth={2} strokeOpacity={selected ? 0.35 : 1} />
        )}
      </g>
    );
  };

  return (
    <section className="bg-[#0e1a2b] rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 pt-5 flex flex-wrap items-center gap-3 min-h-[3.25rem]">
        {selected ? (
          <>
            <button
              type="button"
              onClick={() => select(null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#34d399] text-[#0e1a2b] pl-4 pr-2.5 py-1.5 text-sm font-extrabold"
              aria-label={`Revenir à toutes les villes (départ de ${selected.name})`}
            >
              Depuis {selected.name}
              <span className="material-symbols-outlined text-base">close</span>
            </button>
            {available.map(({ mode: m, label }) => {
              const info = selected.maps.find((x) => x.mode === m)!;
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={m === activeMode}
                  onClick={() => { setMode(m); clearTip(); }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition-colors ${
                    m === activeMode ? 'border-[#34d399] text-[#34d399] bg-[#34d399]/10' : 'border-white/15 text-white/70 hover:text-white'
                  }`}
                >
                  {label} <span className="opacity-60">· {info.direct + info.other}</span>
                </button>
              );
            })}
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-white/80">Cliquez sur une ville pour voir ses trains.</p>
            <select
              className="ml-auto rounded-lg bg-white/10 text-white text-sm font-semibold px-3 py-1.5 border border-white/15"
              value=""
              onChange={(e) => select(withMaps.find((c) => c.name === e.target.value) ?? null)}
              aria-label="Choisir une ville de départ"
            >
              <option value="" disabled>Choisir une ville</option>
              {[...withMaps].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                <option key={c.name} value={c.name} className="text-slate-900">{c.name}</option>
              ))}
            </select>
          </>
        )}
      </div>

      <div ref={box} className="relative mt-3 aspect-[4/3]">
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" role="img"
          aria-label={selected ? selected.maps.find((m) => m.mode === activeMode)?.alt ?? `Trains au départ de ${selected.name}` : 'Les villes des liaisons en train de TrainNomad'}>
          <defs>
            <radialGradient id="rail-glow">
              <stop offset="0" stopColor={MINT} stopOpacity=".45" />
              <stop offset="1" stopColor={MINT} stopOpacity="0" />
            </radialGradient>
          </defs>
          <image href="/cartes/europe.svg" width={W} height={H} />

          {layer && (
            <>
              <circle cx={layer.origin.x} cy={layer.origin.y} r={80} fill="url(#rail-glow)" />
              {/* sous-couche sombre, puis les lignes : pointillés d'abord, directs par-dessus */}
              {layer.lines.map((l, i) => (
                <polyline key={`u${i}`} points={l.points} fill="none" stroke={BG} strokeWidth={6.4} strokeLinejoin="round"
                  strokeLinecap="round" strokeOpacity={hover && hover !== l.dest ? 0.1 : l.after ? 0.55 : 0.9} />
              ))}
              {layer.lines.map((l, i) => (
                <polyline
                  key={`l${i}`}
                  points={l.points}
                  fill="none"
                  stroke={l.color}
                  strokeWidth={l.after ? 4 : 3.4}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={l.after ? '0.1 7' : undefined}
                  opacity={hover && hover !== l.dest ? 0.15 : 1}
                  className="cursor-pointer transition-opacity"
                  onMouseMove={(e) => { setHover(l.dest); showTip(e, l.tip); }}
                  onMouseLeave={clearTip}
                  onClick={() => open(l)}
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
                    className={line ? 'cursor-pointer' : undefined}
                    onMouseMove={line ? (e) => { setHover(n.name); showTip(e, line.tip); } : undefined}
                    onMouseLeave={clearTip}
                    onClick={line ? () => open(line) : undefined}
                  >
                    {n.kind === 'direct' && <circle cx={n.x} cy={n.y} r={7} fill="#fff" stroke={BG} strokeWidth={2.5} />}
                    {n.kind === 'corresp' && <circle cx={n.x} cy={n.y} r={6.5} fill={BG} stroke="#fff" strokeWidth={3} />}
                    {n.kind === 'via' && <circle cx={n.x} cy={n.y} r={4.5} fill={BG} stroke="#fff" strokeWidth={2} strokeOpacity={0.8} />}
                    <Label label={n.label} text={n.name} size={n.kind === 'via' ? 13 : 18} weight={n.kind === 'via' ? 500 : 700}
                      opacity={n.kind === 'via' ? 0.7 : 1} />
                  </g>
                );
              })}
              <circle cx={layer.origin.x} cy={layer.origin.y} r={12} fill={MINT} stroke="#fff" strokeWidth={3} pointerEvents="none" />
              <Label label={layer.origin.label} text={selected!.name} size={26} weight={800} />
            </>
          )}

          {!selected && cities.map((c) => c.label && <Label key={c.name} label={c.label} text={c.name} size={15} weight={700} />)}
        </svg>

        {tip && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-lg"
            style={{ left: tip.x, top: tip.y - 12 }}
          >
            {tip.text}
          </div>
        )}
      </div>

      <div className="px-5 pb-4 pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/60">
        {stale ? (
          <span>La carte de {selected!.name} est en cours de mise à jour : ses lignes reviennent au prochain calcul.</span>
        ) : layer ? (
          <>
            <span className="inline-flex items-center gap-2"><span className="inline-block w-6 h-[3px] rounded bg-white" />Train direct</span>
            {layer.lines.some((l) => l.after) && (
              <span className="inline-flex items-center gap-2"><span className="inline-block w-6 border-t-[3px] border-dotted border-white" />Après une correspondance</span>
            )}
            {layer.legend.map(([name, color]) => (
              <span key={name} className="inline-flex items-center gap-1.5"><span className="inline-block w-4 h-1.5 rounded" style={{ background: color }} />{name}</span>
            ))}
          </>
        ) : (
          <span>Tracés sur les voies, horaires d'une semaine type. Cliquez sur une ligne pour les horaires de la liaison.</span>
        )}
      </div>
    </section>
  );
}
