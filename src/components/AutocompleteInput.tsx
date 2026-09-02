import type { Station } from '../types';
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
}: Props) {
  const ac = useAutocomplete(onSelect, withAnywhere);

  // Sync initial value once
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    ac.handleInputChange(e.target.value);
    onQueryChange?.(e.target.value);
  };

  // Use initialValue only once (controlled by parent via key if needed)
  const displayValue = ac.query || (ac.query === '' ? initialValue : ac.query);

  return (
    <div className="flex flex-col items-start px-6 py-5 hover:bg-slate-50/50 rounded-2xl transition-colors cursor-pointer group border-r border-slate-100 relative">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 group-hover:text-primary transition-colors">
        {label}
      </span>
      <div className="flex items-center gap-3 w-full input-ac-wrapper relative">
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
          onKeyDown={ac.handleKeyDown}
          onBlur={ac.handleBlur}
          className="w-full bg-transparent border-none p-0 focus:ring-0 text-midnight font-bold placeholder:text-slate-300 text-lg outline-none"
        />

        {/* Suggestions dropdown */}
        {ac.isOpen && ac.suggestions.length > 0 && (
          <div className="suggestions-container">
            {ac.suggestions.map((station, idx) => (
              <SuggestionRow
                key={`${station.type}-${station.label}-${idx}`}
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
  const isAnywhere = station.label.includes("N'importe où");
  const isCity = station.type === 'city' && !isAnywhere;
  const isStation = station.type === 'station';

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
        {isAnywhere ? 'explore' : isCity ? 'location_on' : 'train'}
      </span>
      <div className="ac-details">
        <div className="ac-title-main">{station.label}</div>
        {station.country && (
          <div className="ac-line-sub">
            {isCity ? `Toutes les gares (${station.country})` : station.country}
          </div>
        )}
      </div>
    </div>
  );
}
