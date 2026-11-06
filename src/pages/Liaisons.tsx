import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CityRailMap from '../components/CityRailMap';
import { CARTES, type CarteCity } from '../lib/cartes';
import { formatDuration } from '../lib/format';
import { typicalDay } from '../lib/liaisons';
import { liaisonPath, tripsPath } from '../lib/seoPages';

/**
 * Page /train/ : la carte des trains, puis pour chaque ville du site toutes ses destinations en direct ou avec
 * une correspondance (src/lib/cartes.json, les mêmes que sur la carte), les villes les plus reliées d'abord.
 */
export default function LiaisonsPage() {
  const cities = CARTES.cities.filter((c) => c.dests?.length);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-[#1d7a5a] text-white">
        <div className="max-w-[80rem] mx-auto px-10 py-12 md:py-16">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/70">Liaisons en train</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">L'Europe en train, ligne par ligne</h1>
          <p className="mt-4 text-lg text-white/90 max-w-2xl">
            Durée, trains directs, correspondances et horaires d'une journée type pour les grandes liaisons européennes,
            relevés chaque semaine dans les horaires des compagnies.
          </p>
        </div>
      </section>

      <div id="carte" className="w-full max-w-[80rem] mx-auto px-4 sm:px-10 pt-8 scroll-mt-4">
        <CityRailMap />
      </div>

      <main className="w-full max-w-[80rem] mx-auto px-10 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cities.map((c) => (
          <FromGroup key={c.name} city={c} />
        ))}
      </main>
    </div>
  );
}

/** Destinations affichées par ville avant le bouton « Voir plus ». */
const VISIBLE = 6;

/**
 * Carte d'une ville de départ ; au-delà de VISIBLE destinations, le reste s'affiche sur demande.
 * Les liens masqués restent dans la page (simple `hidden`) : les moteurs suivent toujours toutes les liaisons.
 * Une destination sans page de liaison mène à la recherche entre les deux villes.
 */
function FromGroup({ city }: { city: CarteCity }) {
  const [open, setOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const dests = city.dests ?? [];
  const hiddenCount = dests.length - VISIBLE;
  const date = typicalDay(new Date());

  const showOnMap = () => {
    const next = new URLSearchParams(params);
    next.set('ville', city.slug);
    setParams(next, { replace: true, preventScrollReset: true });
    document.getElementById('carte')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-slate-900">Depuis {city.name}</h2>
        {city.maps.length > 0 && (
          <button type="button" onClick={showOnMap} className="inline-flex items-center gap-1 text-xs font-bold text-tone-600 hover:underline">
            <span className="material-symbols-outlined text-base">map</span>
            Sur la carte
          </button>
        )}
      </div>
      <ul className="mt-2 divide-y divide-slate-100">
        {dests.map((d, i) => (
          <li key={d.name} className={!open && i >= VISIBLE ? 'hidden' : undefined}>
            <Link
              to={d.slug ? liaisonPath(d.slug) : tripsPath('/trajets', { id: city.id, name: city.name }, { id: d.id, name: d.name }, date)}
              className="flex items-center justify-between gap-3 py-2 text-sm hover:text-tone-600"
            >
              <span className="font-semibold text-slate-700">{d.name}</span>
              <span className="text-slate-400">
                {formatDuration(d.min)}
                {d.direct ? ' · direct' : ' · 1 corresp.'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="mt-2 text-sm font-semibold text-tone-600 hover:underline"
        >
          {open ? 'Voir moins' : `Voir plus (${hiddenCount})`}
        </button>
      )}
    </section>
  );
}
