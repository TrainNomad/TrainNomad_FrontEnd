import { useEffect, useState } from 'react';
import type { Journey } from '../types/api';
import AnimatedFilterButton from './AnimatedFilterButton';

export interface JourneyFilterValue {
  /** 0 : directs uniquement · null : pas de limite */
  maxTransfers: number | null;
  /** Seuls ces types de train sont empruntés (vide : tous) */
  trainTypes: string[];
  /** Écarter les trajets avec une nuit en gare (plus de 5 h d'attente en correspondance) */
  noLongWait: boolean;
}

export const NO_FILTERS: JourneyFilterValue = { maxTransfers: null, trainTypes: [], noLongWait: false };

/** Nombre de critères actifs, affiché sur le bouton « Filtres » */
export const activeFilterCount = (f: JourneyFilterValue) =>
  Number(f.maxTransfers !== null) + Number(f.trainTypes.length > 0) + Number(f.noLongWait);

export const hasActiveFilters = (f: JourneyFilterValue) => activeFilterCount(f) > 0;

// Mêmes noms que les paramètres de l'API /search : l'adresse de la page se transmet telle quelle.
export function filtersFromParams(params: URLSearchParams): JourneyFilterValue {
  const max = Number.parseInt(params.get('max_transfers') ?? '', 10);
  return {
    maxTransfers: Number.isFinite(max) && max >= 0 ? max : null,
    trainTypes: (params.get('train_types') ?? '').split(',').map((t) => t.trim()).filter(Boolean),
    noLongWait: params.get('long_wait') === '0',
  };
}

export function writeFiltersToParams(params: URLSearchParams, f: JourneyFilterValue) {
  if (f.maxTransfers !== null) params.set('max_transfers', String(f.maxTransfers));
  else params.delete('max_transfers');
  if (f.trainTypes.length > 0) params.set('train_types', f.trainTypes.join(','));
  else params.delete('train_types');
  if (f.noLongWait) params.set('long_wait', '0');
  else params.delete('long_wait');
}

/** Filtrage côté client, en complément de l'API (trajets déjà chargés, API pas encore à jour). */
export function applyFilters(journeys: Journey[], f: JourneyFilterValue): Journey[] {
  return journeys.filter(
    (j) =>
      (f.maxTransfers === null || j.transfers <= f.maxTransfers) &&
      (f.trainTypes.length === 0 || j.train_types.every((t) => f.trainTypes.includes(t))) &&
      (!f.noLongWait || !j.long_wait),
  );
}

const TRANSFER_OPTIONS = [
  { value: null, label: 'Toutes' },
  { value: 0, label: 'Direct' },
  { value: 1, label: '1 max' },
  { value: 2, label: '2 max' },
];

interface JourneyFiltersProps {
  value: JourneyFilterValue;
  onChange: (filters: JourneyFilterValue) => void;
  /** Types de train possibles pour ce trajet → grande vitesse ou non */
  trainTypes: Record<string, boolean>;
}

/**
 * Barre de filtres : un bouton « Filtres » ouvre un panneau (feuille en bas d'écran sur mobile) où les
 * choix ne sont appliqués qu'à la validation, soit une seule recherche. « Direct » reste en raccourci.
 */
export default function JourneyFilters({ value, onChange, trainTypes }: JourneyFiltersProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const openPanel = () => {
    setDraft(value);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const apply = () => {
    setOpen(false);
    if (JSON.stringify(draft) !== JSON.stringify(value)) onChange(draft);
  };

  // Les types sélectionnés restent affichés même s'ils ne figurent plus parmi les options
  const typeOptions = Array.from(new Set([...Object.keys(trainTypes), ...draft.trainTypes])).sort((a, b) =>
    a.localeCompare(b, 'fr'),
  );
  // Raccourci « Sans grande vitesse » : tous les types sauf TGV, OUIGO, ICE…
  const slowTypes = typeOptions.filter((t) => trainTypes[t] === false);
  const slowOnly =
    slowTypes.length > 0 &&
    draft.trainTypes.length === slowTypes.length &&
    slowTypes.every((t) => draft.trainTypes.includes(t));
  const hasHighSpeed = typeOptions.some((t) => trainTypes[t]);

  const count = activeFilterCount(value);
  const directOnly = value.maxTransfers === 0;

  return (
    <div className="relative mb-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={openPanel}
          aria-expanded={open}
          className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold shadow-sm transition-all ${
            count > 0 ? 'bg-brand text-white' : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-base">tune</span>
          Filtres
          {count > 0 && (
            <span className="ml-0.5 rounded-full bg-white/25 px-1.5 text-xs leading-5">{count}</span>
          )}
        </button>

        <AnimatedFilterButton
          isActive={directOnly}
          onClick={() => onChange({ ...value, maxTransfers: directOnly ? null : 0 })}
        >
          Direct
        </AnimatedFilterButton>

        {count > 0 && (
          <button onClick={() => onChange(NO_FILTERS)} className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2">
            Réinitialiser
          </button>
        )}
      </div>

      {open && (
        <>
          {/* fond : assombrit sur mobile, transparent sur grand écran ; un clic ferme sans appliquer */}
          <div className="fixed inset-0 z-40 bg-black/30 sm:bg-transparent" onClick={() => setOpen(false)} />

          <div
            role="dialog"
            aria-label="Filtres"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] flex flex-col rounded-t-2xl bg-white shadow-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full sm:left-0 sm:mt-2 sm:w-[28rem] sm:max-h-[70vh] sm:rounded-2xl sm:border sm:border-slate-200"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-base font-bold text-slate-800">Filtres</h3>
              <button onClick={() => setOpen(false)} aria-label="Fermer" className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-5">
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Correspondances</h4>
                <div className="flex flex-wrap gap-1">
                  {TRANSFER_OPTIONS.map((option) => (
                    <AnimatedFilterButton
                      key={option.label}
                      isActive={draft.maxTransfers === option.value}
                      onClick={() => setDraft({ ...draft, maxTransfers: option.value })}
                    >
                      {option.label}
                    </AnimatedFilterButton>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Attente</h4>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.noLongWait}
                    onChange={(e) => setDraft({ ...draft, noLongWait: e.target.checked })}
                    className="h-4 w-4 accent-brand"
                  />
                  <span className="material-symbols-outlined text-base text-slate-400">hotel</span>
                  Sans nuit en gare
                  <span className="text-xs text-slate-400">(attente de plus de 5 h)</span>
                </label>
              </section>

              {/* Trains autorisés : le trajet n'emprunte que les types choisis (uniquement s'il y a le choix) */}
              {typeOptions.length > 1 && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Trains autorisés</h4>
                  <p className="text-xs text-slate-400 mb-2">Aucun choix : tous les trains.</p>
                  <div className="flex flex-wrap gap-1">
                    {hasHighSpeed && slowTypes.length > 0 && (
                      <AnimatedFilterButton
                        isActive={slowOnly}
                        onClick={() => setDraft({ ...draft, trainTypes: slowOnly ? [] : slowTypes })}
                      >
                        Sans grande vitesse
                      </AnimatedFilterButton>
                    )}
                    {typeOptions.map((type) => {
                      const isActive = draft.trainTypes.includes(type);
                      return (
                        <AnimatedFilterButton
                          key={type}
                          isActive={isActive}
                          onClick={() =>
                            setDraft({
                              ...draft,
                              trainTypes: isActive ? draft.trainTypes.filter((t) => t !== type) : [...draft.trainTypes, type],
                            })
                          }
                        >
                          {type}
                        </AnimatedFilterButton>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
              <button
                onClick={() => setDraft(NO_FILTERS)}
                disabled={!hasActiveFilters(draft)}
                className="text-sm font-bold text-slate-500 hover:text-slate-700 disabled:opacity-40"
              >
                Tout effacer
              </button>
              <button onClick={apply} className="rounded-full bg-brand px-5 py-2 text-sm font-bold text-white shadow-sm">
                Voir les trajets
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
