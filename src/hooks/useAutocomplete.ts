import { useState, useRef, useCallback } from 'react';
import type { Station } from '../types';
import { ANYWHERE_STATION } from '../types';
import { searchStations } from '../services/api';

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
  const abortRef = useRef<AbortController | null>(null);

  const closeSuggestions = useCallback(() => {
    setIsOpen(false);
    setSuggestions([]);
    setActiveIndex(-1);
  }, []);

  const fetchSuggestions = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        if (withAnywhere) {
          setSuggestions([ANYWHERE_STATION]);
          setIsOpen(true);
        } else {
          closeSuggestions();
        }
        return;
      }

      // Annule la requête précédente si l'utilisateur tape plus vite que l'API ne répond
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const items = await searchStations(q, 20, controller.signal);

        // Villes d'abord, avec leurs gares juste en dessous
        const cities = items.filter((s) => s.type === 'city');
        const stations = items.filter((s) => s.type === 'station');

        const ordered: Station[] = [];
        if (withAnywhere) ordered.push(ANYWHERE_STATION);
        cities.forEach((city) => {
          ordered.push(city);
          ordered.push(...stations.filter((s) => s.city === city.name));
        });
        // Gares sans ville proposée
        ordered.push(...stations.filter((s) => !cities.some((c) => c.name === s.city)));

        setSuggestions(ordered);
        setIsOpen(ordered.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error('Autocomplete error:', err);
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
      setQuery(station.name);
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
