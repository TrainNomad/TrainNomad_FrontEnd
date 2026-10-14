import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Scène animée : chargée seulement si l'annonce s'affiche
const MapNoticeScene = lazy(() => import('./MapNoticeScene'));

/** Retenu dans le navigateur une fois l'annonce fermée (page Confidentialité). */
const SEEN_KEY = 'annonce_carte';
/** Exemple : Paris → Bruxelles (identifiants de ville, date du jour). */
const EXAMPLE = '/trajets?departure=city:Q90&arrival=city:Q239';

/**
 * Annonce de la carte des trajets, dans le coin de la page d'accueil : une petite scène animée et deux
 * lignes de texte, jusqu'à ce que le visiteur la ferme ou ouvre l'exemple.
 */
export function MapNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      // en développement, l'annonce revient à chaque chargement pour pouvoir la régler
      if (!import.meta.env.DEV && localStorage.getItem(SEEN_KEY) === '1') return;
    } catch {
      return; // stockage indisponible : pas d'annonce qui reviendrait à chaque visite
    }
    // Sur un grand écran, le coin est libre : l'annonce arrive au bout d'une seconde. Ailleurs (téléphone,
    // ordinateur portable) elle recouvrirait le bouton « Rechercher » : elle attend que le visiteur ait
    // fait défiler la page au-delà du formulaire.
    if (window.innerWidth >= 1700 || (window.innerWidth >= 640 && window.innerHeight >= 1000)) {
      const timer = window.setTimeout(() => setOpen(true), 1000);
      return () => window.clearTimeout(timer);
    }
    const onScroll = () => {
      if (window.scrollY < 350) return;
      setOpen(true);
      window.removeEventListener('scroll', onScroll);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // stockage indisponible : l'annonce reviendra à la prochaine visite
    }
  };

  if (!open) return null;
  return (
    <div
      role="status"
      className="fixed z-40 bottom-4 inset-x-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[21rem] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
    >
      {/* hauteur réservée : l'encadré ne saute pas quand la scène arrive */}
      <div className="aspect-[320/190] bg-[#dcecf5]">
        <Suspense fallback={null}>
          <MapNoticeScene />
        </Suspense>
      </div>
      <button
        onClick={close}
        aria-label="Fermer"
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 text-slate-500 hover:text-slate-800 hover:bg-white shadow-sm cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>
      <div className="p-4">
        <p className="text-sm font-bold text-slate-900 m-0">Nouveau : vos trajets sur la carte</p>
        <p className="text-xs text-slate-500 leading-snug mt-1 mb-2">
          Après une recherche, le bouton « Carte » dessine le parcours du train sur les vraies voies ferrées.
        </p>
        <Link to={EXAMPLE} onClick={close} className="text-xs font-bold text-tone-600 hover:text-tone-700 inline-flex items-center gap-1">
          Voir un exemple <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
