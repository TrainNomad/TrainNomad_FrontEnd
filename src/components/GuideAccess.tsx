import { Link } from 'react-router-dom';
import { formatDuration } from '../lib/format';
import { liaisonHow, typicalDay } from '../lib/liaisons';
import { liaisonPath, SEO_PAGES, tripsPath } from '../lib/seoPages';

/**
 * En haut d'un guide : comment venir dans la ville en train depuis les villes de « guideDepuis »
 * (src/lib/seoPages.json), avec la durée relevée chaque semaine et les liens vers la recherche.
 */
export function GuideAccess({ slug, cityName }: { slug: string; cityName: string }) {
  const rows = SEO_PAGES.guides[slug];
  if (!rows?.length) return null;
  const date = typicalDay(new Date());

  return (
    <section className="mb-16 bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6">
      <h2 className="text-2xl font-extrabold text-midnight">Venir à {cityName} en train</h2>
      <ul className="mt-3 divide-y divide-slate-200">
        {rows.map((row) => (
          <li key={row.from.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-800">Depuis {row.from.name}</div>
              <div className="text-sm text-slate-500">
                {formatDuration(row.summary.fastest_min)} au plus rapide, {liaisonHow(row.summary)}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={row.liaison ? liaisonPath(row.liaison) : tripsPath('/trajets', row.from, row.to, date)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1d7a5a] hover:bg-[#155d44] text-white text-sm font-bold rounded-full transition-colors"
              >
                Voir les itinéraires
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              {row.tgvmax && (
                <Link
                  to={tripsPath('/tgvmax/trajets', { id: row.tgvmax.from, name: row.from.name }, { id: row.tgvmax.to, name: row.to.name }, date)}
                  className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-bold rounded-full transition-colors"
                >
                  Places TGVmax
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
