import { useState, useRef, useCallback } from 'react';
import type { Station } from '../types';

const API_BASE_URL = 'https://trainnomad-sql.onrender.com';

export interface AutocompleteHook {
  query: string;
  suggestions: Station[];
  activeIndex: number;
  isOpen: boolean;
  setQuery: (value: string) => void;
  handleInputChange: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleBlur: () => void;
  selectSuggestion: (station: Station) => void;
  closeSuggestions: () => void;
}

export function useAutocomplete(
  onSelect: (station: Station | null) => void,
  withAnywhere = false,
): AutocompleteHook {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Station[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeSuggestions = useCallback(() => {
    setIsOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
  }, []);

  const fetchSuggestions = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        if (withAnywhere) {
          // Show "N'importe où" option only
          setSuggestions([{ label: "N'importe où 🗺️", type: 'city', country: 'Inspiration & Explorations' }]);
          setIsOpen(true);
        } else {
          closeSuggestions();
        }
        return;
      }

      try {
        const res = await fetch(
          `${API_BASE_URL}/stations?q=${encodeURIComponent(q)}&limit=6`,
        );
        const data = await res.json();
        const items: Station[] = data.results || data.stops || data || [];

        // Build tree: cities first, then their stations grouped below
        const cities = items.filter((s) => s.type === 'city');
        const stations = items.filter((s) => s.type === 'station');

        const ordered: Station[] = [];
        if (withAnywhere) {
          ordered.push({ label: "N'importe où 🗺️", type: 'city', country: 'Inspiration & Explorations' });
        }
        cities.forEach((city) => {
          ordered.push(city);
          const children = stations.filter((s) => s.city === city.label);
          ordered.push(...children);
        });
        // Stations without a parent city
        const orphans = stations.filter(
          (s) => !cities.some((c) => c.label === s.city),
        );
        ordered.push(...orphans);

        setSuggestions(ordered);
        setIsOpen(ordered.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        console.error('Autocomplete error:', err);
      }
    },
    [withAnywhere, closeSuggestions],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      onSelect(null); // reset selection on new typing

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fetchSuggestions(value.trim()), 180);
    },
    [fetchSuggestions, onSelect],
  );

  const selectSuggestion = useCallback(
    (station: Station) => {
      setQuery(station.label);
      onSelect(station);
      closeSuggestions();
    },
    [onSelect, closeSuggestions],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
      } else if (e.key === 'Escape') {
        closeSuggestions();
      }
    },
    [isOpen, suggestions, activeIndex, selectSuggestion, closeSuggestions],
  );

  const handleBlur = useCallback(() => {
    setTimeout(closeSuggestions, 150);
  }, [closeSuggestions]);

  return {
    query,
    suggestions,
    activeIndex,
    isOpen,
    setQuery,
    handleInputChange,
    handleKeyDown,
    handleBlur,
    selectSuggestion,
    closeSuggestions,
  };
}
