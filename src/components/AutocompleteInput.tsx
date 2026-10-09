import { useEffect, useRef, useState } from 'react';
import type { Station } from '../types';
import { ANYWHERE_ID } from '../types';
import { useAutocomplete } from '../hooks/useAutocomplete';
import { CountryFlag } from './CountryFlag';

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

  // Une gare listée juste sous sa ville est affichée en retrait, rattachée à elle
  const rows: { station: Station; isChild: boolean }[] = [];
  let currentCity: Station | null = null;
  for (const station of ac.suggestions) {
    if (station.type === 'city') {
      currentCity = station.id === ANYWHERE_ID ? null : station;
      rows.push({ station, isChild: false });
    } else {
      const isChild = currentCity !== null && station.city === currentCity.name;
      if (!isChild) currentCity = null;
      rows.push({ station, isChild });
    }
  }

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
        {ac.isOpen && rows.length > 0 && (
          <div className="suggestions-container" role="listbox">
            {rows.map(({ station, isChild }, idx) => (
              <SuggestionRow
                key={`${station.id}-${idx}`}
                station={station}
                isChild={isChild}
                query={ac.query}
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

const regionNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['fr'], { type: 'region' }) : null;

/** "FR" -> "France" ; renvoie le code tel quel s'il est inconnu. */
function countryName(code: string): string {
  if (!code) return '';
  try {
    return regionNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Minuscules sans accents, caractère par caractère (la longueur du texte est conservée). */
function fold(text: string): string {
  return Array.from(text, (ch) => ch.normalize('NFD')[0].toLowerCase()).join('');
}

/** Nom avec la partie saisie mise en évidence (début du nom ou d'un mot). */
function HighlightedName({ name, query }: { name: string; query: string }) {
  const q = fold(query.trim());
  const folded = fold(name);
  let at = -1;
  if (q && folded.length === name.length) {
    for (let i = folded.indexOf(q); i >= 0; i = folded.indexOf(q, i + 1)) {
      if (i === 0 || !/[a-z0-9]/.test(folded[i - 1])) {
        at = i;
        break;
      }
    }
  }
  if (at < 0) return <>{name}</>;
  return (
    <>
      {name.slice(0, at)}
      <mark className="ac-match">{name.slice(at, at + q.length)}</mark>
      {name.slice(at + q.length)}
    </>
  );
}

interface SuggestionRowProps {
  station: Station;
  /** Gare affichée sous sa ville */
  isChild: boolean;
  query: string;
  isActive: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

function SuggestionRow({ station, isChild, query, isActive, onMouseDown }: SuggestionRowProps) {
  const isAnywhere = station.id === ANYWHERE_ID;
  const isCity = station.type === 'city' && !isAnywhere;
  const country = isAnywhere ? '' : countryName(station.country);

  let subtitle = '';
  if (isAnywhere) subtitle = station.country;
  else if (isCity) subtitle = station.stations ? `Toutes les gares (${station.stations})` : 'Toutes les gares';
  else if (station.city && station.city !== station.name) subtitle = station.city;

  const rowClass = [
    'ac-row',
    isActive ? 'ac-active' : '',
    isAnywhere ? 'ac-anywhere' : '',
    isCity ? 'ac-city' : '',
    station.type === 'station' ? 'ac-station' : '',
    isChild ? 'ac-child' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Navigation au clavier : la ligne active reste visible dans la liste
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isActive) rowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [isActive]);

  return (
    <div ref={rowRef} className={rowClass} role="option" aria-selected={isActive} onMouseDown={onMouseDown}>
      <span className="material-symbols-outlined ac-icon">
        {isAnywhere ? 'explore' : isCity ? 'location_city' : 'train'}
      </span>
      <div className="ac-details">
        <span className="ac-title-main">
          {isAnywhere ? station.name : <HighlightedName name={station.name} query={query} />}
        </span>
        {/* Sous une ville, la ville et le pays sont déjà indiqués sur la ligne du dessus */}
        {!isChild && (subtitle || country) && (
          <div className="ac-line-sub">
            {subtitle}
            {subtitle && country && <span aria-hidden="true">·</span>}
            {country && (
              <>
                <CountryFlag code={station.country} className="h-2.5" />
                {country}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
