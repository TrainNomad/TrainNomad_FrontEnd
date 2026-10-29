import { Link } from 'react-router-dom';
import { formatDuration } from '../lib/format';
import { liaisonPath, SEO_PAGES, type LiaisonPage } from '../lib/seoPages';

/** Page /train/ : toutes les liaisons, regroupées par ville de départ (les villes les plus desservies d'abord). */
export default function LiaisonsPage() {
  const byFrom = new Map<string, LiaisonPage[]>();
  for (const l of SEO_PAGES.liaisons) byFrom.set(l.from.name, [...(byFrom.get(l.from.name) ?? []), l]);
  const groups = [...byFrom.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

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

      <main className="w-full max-w-[80rem] mx-auto px-10 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(([from, liaisons]) => (
          <section key={from} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-lg font-extrabold text-slate-900">Depuis {from}</h2>
            <ul className="mt-2 divide-y divide-slate-100">
              {liaisons.map((l) => (
                <li key={l.slug}>
                  <Link to={liaisonPath(l.slug)} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-tone-600">
                    <span className="font-semibold text-slate-700">{l.to.name}</span>
                    <span className="text-slate-400">
                      {formatDuration(l.summary.fastest_min)}
                      {l.summary.direct > 0 ? ' · direct' : ''}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
