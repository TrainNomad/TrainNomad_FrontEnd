import { AutocompleteInput } from './AutocompleteInput';
import type { Station } from '../types';

interface Props {
  fromQuery: string;
  loading: boolean;
  resultCount: number;
  originName: string;
  onQueryChange: (v: string) => void;
  onSelect: (station: Station | null) => void;
  onSearch: () => void;
}

/**
 * Departure-only search bar used in the Explorer header.
 * Wraps AutocompleteInput with a search button and a results count badge.
 */
export function ExplorerSearchBar({
  fromQuery,
  loading,
  resultCount,
  originName,
  onQueryChange,
  onSelect,
  onSearch,
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="flex-1 min-w-0 flex items-center gap-3">
      {/* Autocomplete input */}
      <div
        className="flex-1 min-w-[220px] max-w-[380px] bg-white border border-slate-200 rounded-xl shadow-sm flex items-center overflow-visible relative"
        onKeyDown={handleKeyDown}
      >
        <AutocompleteInput
          id="explorer-from"
          label="Gare de départ"
          placeholder="Paris, Rennes, Lyon…"
          icon="trip_origin"
          onSelect={onSelect}
          onQueryChange={onQueryChange}
        />
      </div>

      {/* Search button */}
      <button
        onClick={onSearch}
        disabled={fromQuery.trim().length < 2 || loading}
        className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-[#1A2B3C] text-white hover:bg-[#1d7a5a] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex-shrink-0"
      >
        {loading ? <SpinnerIcon /> : <SearchIcon />}
        {loading ? 'Chargement…' : 'Explorer'}
      </button>

      {/* Results count */}
      {resultCount > 0 && (
        <span className="text-sm text-slate-500 font-medium flex-shrink-0">
          {resultCount} destinations depuis{' '}
          <strong className="text-[#1A2B3C]">{originName}</strong>
        </span>
      )}
    </div>
  );
}

// ─── Inline icons ─────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
