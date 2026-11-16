import { useRef, useState, type MouseEvent } from 'react';
import { CARTES, type CarteCity } from '../lib/cartes';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { CityRailMapMobile } from './CityRailMapMobile';
import { RailLegend, RailSvg, useRailMap } from './RailMapParts';

interface Tip {
  x: number;
  y: number;
  text: string;
}

/**
 * Carte des trains de la page /train/ : les villes du site sur l'Europe en points ; un clic sur une ville
 * affiche ses lignes (direct et une correspondance, directs, moins de 3 h, trains de nuit), sur les voies.
 * Survol d'une ligne : durée et compagnie ; clic : la page de la liaison, ou la recherche s'il n'y en a pas.
 * Téléphone : carte plein écran qu'on déplace et zoome au doigt, liste des trajets dans une feuille (CityRailMapMobile).
 */
export default function CityRailMap() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  return isMobile ? <CityRailMapMobile /> : <CityRailMapDesktop />;
}

function CityRailMapDesktop() {
  const { cities, selected, select, mode: activeMode, setMode, layer, stale, withMaps, available, open } = useRailMap();
  const { width: W, height: H } = CARTES;
  const [hover, setHover] = useState<string | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const box = useRef<HTMLDivElement>(null);

  if (!cities.length) return null;

  const clearTip = () => {
    setHover(null);
    setTip(null);
  };
  const onHover = (name: string | null, e?: MouseEvent, text?: string) => {
    if (!e || !text) return clearTip();
    setHover(name);
    const rect = box.current?.getBoundingClientRect();
    if (rect) setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, text });
  };
  const choose = (city: CarteCity | null) => {
    clearTip();
    select(city);
  };

  return (
    <section className="bg-[#0e1a2b] rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 pt-5 flex flex-wrap items-center gap-3 min-h-[3.25rem]">
        {selected ? (
          <>
            <button
              type="button"
              onClick={() => choose(null)}
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
              onChange={(e) => choose(withMaps.find((c) => c.name === e.target.value) ?? null)}
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
        <RailSvg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 w-full h-full"
          selected={selected}
          layer={layer}
          hover={hover}
          onHover={onHover}
          onSelect={choose}
          onOpen={open}
        />

        {tip && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-lg"
            style={{ left: tip.x, top: tip.y - 12 }}
          >
            {tip.text}
          </div>
        )}
      </div>

      <div className="px-5 pb-4 pt-2 text-xs text-white/60">
        {stale ? (
          <span>La carte de {selected!.name} est en cours de mise à jour : ses lignes reviennent au prochain calcul.</span>
        ) : layer ? (
          <RailLegend layer={layer} className="flex flex-wrap items-center gap-x-5 gap-y-2" />
        ) : (
          <span>Tracés sur les voies, horaires d'une semaine type. Cliquez sur une ligne pour les horaires de la liaison.</span>
        )}
      </div>
    </section>
  );
}
