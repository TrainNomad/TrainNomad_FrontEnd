import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TGVMAX_API_URL } from '../config';
import { usePageMeta } from '../hooks/usePageMeta';
import { formatDateShort, formatDuration } from '../lib/format';
import { maxCityPath, SEO_PAGES, tripsPath } from '../lib/seoPages';
import { addDays, fetchMaxFrom, MAX_DAYS, type MaxFrom } from '../lib/tgvmaxDepuis';

type Period = 'all' | 'today' | 'weekend';

const PERIODS: Array<[Period, string]> = [
  ['all', `${MAX_DAYS} prochains jours`],
  ['weekend', 'Ce week-end'],
  ['today', "Aujourd'hui"],
];

/** Vendredi, samedi et dimanche à venir (le week-end en cours s'il a commencé). */
function weekendDates(today: string): Set<string> {
  const day = new Date(`${today}T12:00:00Z`).getUTCDay();
  const friday = addDays(today, day === 0 ? -2 : day === 6 ? -1 : 5 - day);
  return new Set([friday, addDays(friday, 1), addDays(friday, 2)].filter((d) => d >= today));
}

/**
 * Page « TGVmax depuis une ville » (/tgvmax/depuis/lyon/) : destinations avec des places MAX dans les 30 prochains
 * jours, calculées en direct (les disponibilités changent chaque matin). Le relevé du build
 * (public/tgvmax-depuis/<slug>.json) s'affiche en attendant.
 */
export default function TgvmaxDepuisPage() {
  const { slug = '' } = useParams();
  const city = SEO_PAGES.tgvmax.find((c) => c.slug === slug);
  const today = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState<MaxFrom | null>(null);
  const [progress, setProgress] = useState<number | null>(0);
  const [period, setPeriod] = useState<Period>('all');
  usePageMeta(
    city ? `TGVmax depuis ${city.name}` : 'Page TGVmax introuvable',
    city
      ? `Où partir avec TGVmax depuis ${city.name} ? Les destinations directes avec des places MAX JEUNE et MAX SENIOR dans les ${MAX_DAYS} prochains jours, mises à jour chaque matin.`
      : undefined,
  );

  useEffect(() => {
    if (!city) return;
    const controller = new AbortController();
    setData(null);
    setProgress(0);
    fetch(`/tgvmax-depuis/${city.slug}.json`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((snapshot: MaxFrom | null) => {
        // Relevé du build en attendant le calcul : sans les jours déjà passés
        if (!snapshot || controller.signal.aborted) return;
        const destinations = snapshot.destinations
          .map((d) => ({ ...d, dates: d.dates.filter((date) => date >= today) }))
          .filter((d) => d.dates.length > 0);
        setData((current) => current ?? { ...snapshot, destinations });
      })
      .catch(() => {});
    fetchMaxFrom(TGVMAX_API_URL, city.id, today, MAX_DAYS, { signal: controller.signal, onProgress: setProgress })
      .then((live) => {
        setData(live);
        setProgress(null);
      })
      .catch(() => setProgress(null));
    return () => controller.abort();
  }, [city, today]);

  const weekend = useMemo(() => weekendDates(today), [today]);
  const shown = useMemo(() => {
    if (!data) return [];
    const keep = (date: string) => (period === 'today' ? date === today : period === 'weekend' ? weekend.has(date) : true);
    return data.destinations.map((d) => ({ ...d, dates: d.dates.filter(keep) })).filter((d) => d.dates.length > 0);
  }, [data, period, today, weekend]);

  if (!city) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md">
          <span className="material-symbols-outlined text-5xl text-slate-300 block mb-4">train</span>
          <p className="text-slate-600 font-medium">Pas de page TGVmax pour cette ville.</p>
          <Link to="/tgvmax/explorer" className="inline-block mt-5 bg-brand text-white px-5 py-2 rounded-full font-bold text-sm">
            Explorer la carte TGVmax
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-[#f5f5f5] via-[#fafaf8] to-[#f0ebe5]">
        <div className="max-w-[80rem] mx-auto px-10 py-12 md:py-16">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-tone-600">TGVmax</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
            Où partir depuis <span className="text-[#F97316]">{city.name}</span> ?
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl">
            Les destinations en train direct avec des places MAX JEUNE et MAX SENIOR à 0 € au départ de {city.name}, jour par jour.
          </p>
          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Période">
            {PERIODS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                aria-pressed={period === key}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  period === key ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="w-full max-w-[80rem] mx-auto px-4 py-6 space-y-6">
        <section className="mx-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-extrabold text-slate-900">
              {data ? `${shown.length} destination${shown.length > 1 ? 's' : ''} en direct avec des places MAX` : 'Recherche des places MAX…'}
            </h2>
            {progress !== null && (
              <span className="text-xs font-semibold text-slate-400">
                Mise à jour : {progress} / {MAX_DAYS} jours
              </span>
            )}
          </div>
          {data ? (
            shown.length > 0 ? (
              <ul className="mt-2 divide-y divide-slate-100">
                {shown.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800">{d.name}</div>
                      <div className="text-xs text-slate-500">
                        Direct en {formatDuration(d.min_duration)} · places {d.dates.length} jour{d.dates.length > 1 ? 's' : ''}
                        {period === 'all' ? ` sur ${MAX_DAYS}` : ''}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {d.dates.slice(0, 4).map((date) => (
                        <Link
                          key={date}
                          to={tripsPath('/tgvmax/trajets', { id: city.id, name: city.name }, d, date)}
                          className="px-2.5 py-1 rounded-lg bg-tone-50 hover:bg-tone-100 text-tone-600 text-xs font-bold first-letter:uppercase"
                        >
                          {formatDateShort(date)}
                        </Link>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Aucune place MAX sur cette période : essayez une autre période.</p>
            )
          ) : (
            <div className="mt-4 h-40 bg-slate-100 rounded-xl animate-pulse" />
          )}
        </section>

        <section className="mx-6">
          <h2 className="text-sm font-extrabold text-slate-900">Depuis une autre ville</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {SEO_PAGES.tgvmax
              .filter((c) => c.slug !== city.slug)
              .map((c) => (
                <Link key={c.slug} to={maxCityPath(c.slug)} className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:border-slate-300">
                  {c.name}
                </Link>
              ))}
          </div>
        </section>

        <p className="px-6 text-xs text-slate-400">
          Disponibilités d'après les données ouvertes de SNCF Voyageurs, mises à jour chaque matin : une place peut partir
          entre-temps. Site indépendant, sans lien avec SNCF Voyageurs. TGVmax, MAX JEUNE et MAX SENIOR sont des marques de
          SNCF Voyageurs.
        </p>
      </main>
    </div>
  );
}
