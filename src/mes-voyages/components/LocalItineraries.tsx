// Trajets choisis sur la page Trajets et gardés dans ce navigateur (src/lib/voyages.ts, lu sans modification) :
// proposés à l'enregistrement dans le compte.
import { Link } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
import { listVoyages, type Voyage } from '../../lib/voyages';
import { formatTime } from '../../lib/format';
import { formatDay, formatStamp } from '../ui';

export function readLocalVoyages(): Voyage[] {
  try {
    return listVoyages();
  } catch {
    return [];
  }
}

/**
 * Sans `tripId` : « Enregistrer ce trajet » (nouveau voyage). Avec `tripId` : « Ajouter à ce voyage ».
 * `exclude` : départs (heure locale) déjà enregistrés, masqués de la liste.
 */
export function LocalItineraries({ voyages, tripId, exclude = [] }: { voyages: Voyage[]; tripId?: string; exclude?: string[] }) {
  const shown = voyages.filter((v) => !exclude.includes(v.outbound.journey.departure));
  if (shown.length === 0) return null;
  return (
    <ul className="divide-y divide-slate-100">
      {shown.map((v) => {
        const href = tripId
          ? `/mes-voyages/ajouter?voyage=${encodeURIComponent(v.id)}&trip=${tripId}`
          : `/mes-voyages/enregistrer?voyage=${encodeURIComponent(v.id)}`;
        return (
          <li key={v.id} className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3">
            <Smartphone className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-900">
                {v.outbound.from.name} → {v.outbound.to.name}
                {v.inbound && <span className="font-semibold text-slate-500"> · aller-retour</span>}
              </div>
              <div className="text-xs text-slate-500">
                {formatDay(v.outbound.journey.departure)} à {formatTime(v.outbound.journey.departure)}
                {v.inbound && ` · retour ${formatDay(v.inbound.journey.departure)} à ${formatTime(v.inbound.journey.departure)}`}
                {' · choisi le '}
                {formatStamp(v.updatedAt)}
              </div>
            </div>
            <Link to={href} className="rounded-xl px-3 py-1.5 text-xs font-bold bg-brand text-white hover:bg-brand-dark">
              {tripId ? 'Ajouter à ce voyage' : 'Enregistrer ce trajet'}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
