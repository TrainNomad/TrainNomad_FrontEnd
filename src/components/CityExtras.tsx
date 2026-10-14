import { Link } from 'react-router-dom';
import { useCityGuide, normalizeCity } from '../lib/cityGuides';
import { CITY_BLOCKS } from '../lib/cityBlocks';
import { track } from '../lib/analytics';

interface Props {
  /** Ville d'arrivée (nom affiché, ex. « Berlin ») */
  city: string;
}

/**
 * Encart « Sur place à {ville} » : lien vers le guide TrainNomad de la ville s'il existe, puis les blocs
 * personnalisés de src/lib/cityBlocks.ts. Rien n'est affiché s'il n'y a ni guide ni bloc pour cette ville.
 */
export function CityExtras({ city }: Props) {
  const guide = useCityGuide(city);
  const key = normalizeCity(city);
  const blocks = CITY_BLOCKS.filter((b) => !b.cities || b.cities.some((c) => normalizeCity(c) === key));
  if (!guide && blocks.length === 0) return null;

  const fill = (s: string) => s.replace(/\{ville\}/g, city);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Sur place à {city}</p>
      <div className="flex flex-col gap-1 -mx-2">
        {guide && (
          <Link
            to={`/guides/${guide.slug}`}
            onClick={() => track('clic-guide', { city: guide.name })}
            className="group flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 transition-colors"
          >
            <img src={guide.image} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" loading="lazy" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 group-hover:text-brand transition-colors">
                Notre guide de {guide.name}
              </p>
              <p className="text-xs text-slate-500 line-clamp-2">{guide.description}</p>
              {guide.readingTime > 0 && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                  {guide.readingTime} min de lecture
                </p>
              )}
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-brand text-base">arrow_forward</span>
          </Link>
        )}

        {blocks.map((b) => (
          <a
            key={b.id}
            href={b.href.replace(/\{ville\}/g, encodeURIComponent(city))}
            target="_blank"
            rel={b.sponsored ? 'sponsored noopener' : 'noopener'}
            onClick={() => track('clic-bloc', { id: b.id, city })}
            className="group flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 transition-colors"
          >
            <span className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl text-slate-500">{b.icon}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 group-hover:text-brand transition-colors">{fill(b.title)}</p>
              {b.text && <p className="text-xs text-slate-500 line-clamp-2">{fill(b.text)}</p>}
              {b.sponsored && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Lien partenaire</p>
              )}
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:text-brand text-base">open_in_new</span>
          </a>
        ))}
      </div>
    </div>
  );
}
