// Points d'entrée de l'espace « Mes voyages » posés dans les pages du site. Sans client Supabase : ils ne
// grossissent pas les pages qui les affichent, et n'apparaissent pas si l'espace n'est pas configuré.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getTargetTrip, setTargetTrip } from './target';
import { Bookmark, BookmarkPlus, Heart } from 'lucide-react';
import { MES_VOYAGES_ENABLED } from './config';

/**
 * « Enregistrer ce trajet » (page d'un voyage choisi). Le trajet reste dans le navigateur pendant une éventuelle
 * connexion ; il est enregistré dans le compte au retour (/mes-voyages/enregistrer).
 */
export function SaveJourneyButton({ voyageId }: { voyageId: string }) {
  const [target, setTarget] = useState(getTargetTrip);
  if (!MES_VOYAGES_ENABLED) return null;
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
      <Link
        to={`/mes-voyages/enregistrer?voyage=${encodeURIComponent(voyageId)}`}
        className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white px-5 py-3 rounded-xl text-sm font-bold shadow-sm transition-colors"
      >
        <BookmarkPlus className="w-4 h-4" aria-hidden />
        {target ? `Ajouter à « ${target.title} »` : 'Enregistrer ce trajet'}
      </Link>
      {target ? (
        <button
          type="button"
          onClick={() => {
            setTargetTrip(null);
            setTarget(null);
          }}
          className="text-xs font-semibold text-slate-500 underline hover:text-brand"
        >
          Enregistrer plutôt comme un nouveau voyage
        </button>
      ) : (
        <span className="text-xs text-slate-500">Retrouvez-le dans Mes voyages, sur tous vos appareils.</span>
      )}
    </div>
  );
}

/** « Sauvegarder cette recherche » (page Trajets) : mêmes paramètres que l'adresse de la page. */
export function SaveSearchLink({ search, network }: { search: string; network: string }) {
  if (!MES_VOYAGES_ENABLED) return null;
  const params = new URLSearchParams(search);
  if (network === 'tgvmax') params.set('network', 'tgvmax');
  return (
    <Link
      to={`/mes-voyages/sauvegarder?${params.toString()}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-brand hover:border-brand/40 transition-colors whitespace-nowrap"
    >
      <Bookmark className="w-3.5 h-3.5" aria-hidden />
      Sauvegarder la recherche
    </Link>
  );
}

/** Cœur « Mes voyages », tout à droite de la barre de navigation */
export function MesVoyagesHeart({ light = false }: { light?: boolean }) {
  if (!MES_VOYAGES_ENABLED) return null;
  return (
    <Link
      to="/mes-voyages"
      aria-label="Mes voyages"
      title="Mes voyages"
      className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
        light ? 'text-white hover:bg-white/10' : 'text-midnight hover:text-primary hover:bg-slate-100'
      }`}
    >
      <Heart className="w-6 h-6" aria-hidden />
    </Link>
  );
}
