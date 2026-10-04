import { useState } from 'react';
import type { Station } from '../types';
import { ANYWHERE_ID } from '../types';
import { useAutocomplete } from '../hooks/useAutocomplete';

interface Props {
  id: string;
  placeholder: string;
  icon: string;
  label: string;
  initialValue?: string;
  withAnywhere?: boolean;
  onSelect: (station: Station | null) => void;
  onQueryChange?: (value: string) => void;
  /** Affiche une pastille de validation quand une suggestion a été choisie */
  isSelected?: boolean;
  /** Appelé sur Entrée lorsqu'aucune suggestion n'est ouverte (validation) */
  onSubmit?: () => void;
  /** Padding réduit : gagne ~20px de hauteur (barre de recherche de l'explorer) */
  compact?: boolean;
}

export function AutocompleteInput({
  id,
  placeholder,
  icon,
  label,
  initialValue = '',
  withAnywhere = false,
  onSelect,
  onQueryChange,
  isSelected = false,
  onSubmit,
  compact = false,
}: Props) {
  const ac = useAutocomplete(onSelect, withAnywhere);

  // initialValue n'est affiché que tant que le champ n'a pas été modifié (le parent le remonte via `key`)
  const [touched, setTouched] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTouched(true);
    ac.handleInputChange(e.target.value);
    onQueryChange?.(e.target.value);
  };

  const displayValue = touched || ac.query ? ac.query : initialValue;

  // Entrée : la liste ouverte -> le hook sélectionne la suggestion active ;
  // la liste fermée -> on valide le formulaire parent.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !ac.isOpen && onSubmit) {
      e.preventDefault();
      onSubmit();
      return;
    }
    ac.handleKeyDown(e);
  };

  return (
    <div
      className={`flex flex-col items-start hover:bg-slate-50/50 rounded-2xl transition-colors cursor-pointer group relative ${
        compact ? 'px-4 py-2' : 'px-6 py-5 border-r border-slate-100'
      }`}
    >
      <span
        className={`text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors ${
          compact ? 'mb-1' : 'mb-2'
        }`}
      >
        {label}
      </span>
      {/* Liste ouverte : passe au-dessus des champs voisins (chacun a son propre z-index) */}
      <div
        className="flex items-center gap-3 w-full input-ac-wrapper relative"
        style={ac.isOpen ? { zIndex: 60 } : undefined}
      >
        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors flex-shrink-0">
          {icon}
        </span>
        <input
          id={id}
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={ac.handleBlur}
          className={`w-full bg-transparent border-none p-0 focus:ring-0 text-midnight font-bold placeholder:text-slate-300 outline-none ${
            compact ? 'text-base' : 'text-lg'
          }`}
        />

        {/* Pastille de validation : la gare vient bien de la liste de suggestions */}
        {isSelected && (
          <span
            title="Gare sélectionnée"
            className="flex-shrink-0 w-5 h-5 rounded-full bg-brand flex items-center justify-center"
          >
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
            </svg>
          </span>
        )}

        {/* Suggestions dropdown */}
        {ac.isOpen && ac.suggestions.length > 0 && (
          <div className="suggestions-container">
            {ac.suggestions.map((station, idx) => (
              <SuggestionRow
                key={`${station.id}-${idx}`}
                station={station}
                isActive={idx === ac.activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  ac.selectSuggestion(station);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SuggestionRow ────────────────────────────────────────────────────────────

interface SuggestionRowProps {
  station: Station;
  isActive: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

function SuggestionRow({ station, isActive, onMouseDown }: SuggestionRowProps) {
  const isAnywhere = station.id === ANYWHERE_ID;
  const isCity = station.type === 'city' && !isAnywhere;
  const isStation = station.type === 'station';

  let subtitle = station.country;
  if (isCity) subtitle = `${station.stations ? `${station.stations} gares` : 'Toutes les gares'} · ${station.country}`;
  else if (isStation && station.city && station.city !== station.name) subtitle = station.country;

  const rowClass = [
    'ac-row',
    isActive ? 'ac-active' : '',
    isAnywhere ? 'ac-anywhere' : '',
    isCity ? 'ac-city' : '',
    isStation ? 'ac-station' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rowClass} onMouseDown={onMouseDown}>
      <span className="material-symbols-outlined ac-icon">
        {isAnywhere ? 'explore' : isCity ? 'location_city' : 'train'}
      </span>
      <div className="ac-details">
        <div className="ac-title-row">
          <span className="ac-title-main">{station.name}</span>
          {isCity && <span className="ac-badge ac-badge-city">Ville</span>}
          {isStation && <span className="ac-badge ac-badge-station">Gare</span>}
        </div>
        {subtitle && <div className="ac-line-sub">{subtitle}</div>}
      </div>
    </div>
  );
}
