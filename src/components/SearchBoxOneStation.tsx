import { useState, useRef, useCallback, useEffect } from 'react';
import { AutocompleteInput } from './AutocompleteInput';
import type { Station } from '../types';
import { parseDate } from '@internationalized/date';

import { I18nProvider } from 'react-aria-components';
import { getLocalTimeZone, today as getToday, CalendarDate } from '@internationalized/date';
import { DateRangePicker } from './ui/DateRangePicker';

export interface ExplorerSearchPayload {
  station: Station;
  origin: string;
  date: string;
  time: string;
}

interface Props {
  onSearch: (data: ExplorerSearchPayload) => void;
}

export function SearchBoxOneStation({ onSearch }: Props) {
  const [selectedFrom, setSelectedFrom] = useState<Station | null>(null);
  const [fromQuery, setFromQuery] = useState('');

  const [departDate, setDepartDate] = useState<CalendarDate>(getToday(getLocalTimeZone()));
  const [returnDate, setReturnDate] = useState<CalendarDate | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const isRoundTrip = returnDate !== null;

  const clearReturnDate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setReturnDate(null);
  }, []);

  const handleDateChange = useCallback((depart: CalendarDate, retour: CalendarDate | null) => {
    setDepartDate(depart);
    setReturnDate(retour);
  }, []);

  const timeRef = useRef<HTMLInputElement>(null);
  const mountKey = useRef(Date.now());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromName = params.get('from_name');
    const dateParam = params.get('date');
    const timeParam = params.get('time');

    if (fromName) setFromQuery(fromName);
    if (dateParam) {
      try { setDepartDate(parseDate(dateParam)); } catch {}
    }
    if (timeParam && timeRef.current) {
      timeRef.current.value = timeParam;
    }
  }, []);

  const isSearchEnabled = selectedFrom !== null || fromQuery.trim().length >= 2;

  const handleSearch = () => {
    if (!isSearchEnabled) return;
    const time = timeRef.current?.value || '06:00';
    const origin = selectedFrom?.id || fromQuery.trim();
    const station: Station = selectedFrom || {
      type: 'city',
      id: fromQuery.trim(),
      name: fromQuery.trim(),
      country: '',
      lat: 0,
      lon: 0,
    };
    onSearch({
      station,
      origin,
      date: departDate.toString(),
      time,
    });
  };

  return (
    <I18nProvider locale="fr-FR">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3">
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">

          {/* Gare de départ */}
          <div className="flex-1 min-w-[220px] px-1">
            <AutocompleteInput
              key={`from-${mountKey.current}`}
              id="input-explorer-from"
              label={isSearchEnabled ? 'Gare de départ' : 'Gare de départ — choisir dans la liste'}
              placeholder="Paris, Rennes, Lyon..."
              icon="location_on"
              initialValue={fromQuery}
              onSelect={setSelectedFrom}
              onQueryChange={setFromQuery}
              isSelected={isSearchEnabled}
              onSubmit={handleSearch}
              compact
            />
          </div>

          <div className="w-px bg-slate-100 my-2 hidden lg:block h-10"></div>

          {/* Dates */}
          <div className="w-full lg:w-auto px-3 py-1 relative">
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="flex flex-col items-start w-full text-left cursor-pointer group"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                {isRoundTrip ? 'Dates' : 'Date aller'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 group-hover:text-primary text-lg flex-shrink-0 transition-colors">
                  <i className="fa-regular fa-calendar fa-xs" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {departDate.toString()}
                </span>
                {isRoundTrip && returnDate && (
                  <>
                    <span className="text-slate-400 text-xs">→</span>
                    <span className="text-sm font-semibold text-primary">
                      {returnDate.toString()}
                    </span>
                    <button
                      onClick={clearReturnDate}
                      className="w-4 h-4 rounded-full bg-slate-200 hover:bg-red-100 flex items-center justify-center transition-colors group/x flex-shrink-0"
                      title="Supprimer le retour"
                    >
                      <svg className="w-2.5 h-2.5 text-slate-500 group-hover/x:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </button>

            {isCalendarOpen && (
              <DateRangePicker
                departDate={departDate}
                returnDate={returnDate}
                onChange={handleDateChange}
                onClose={() => setIsCalendarOpen(false)}
              />
            )}
          </div>

          <div className="w-px bg-slate-100 my-2 hidden lg:block h-10"></div>

          {/* Heure départ */}
          <div className="w-full lg:w-28 px-3 py-1 relative">
            <div className="flex flex-col items-start w-full">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Heure</label>
              <div className="flex items-center gap-2 w-full">
                <span className="material-symbols-outlined text-slate-400 text-lg flex-shrink-0">schedule</span>
                <input
                  ref={timeRef}
                  type="time"
                  defaultValue="06:00"
                  className="w-full border-none p-0 text-sm font-semibold text-slate-900 focus:ring-0 outline-none bg-transparent cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Bouton Rechercher */}
          <div className="w-full lg:w-auto p-1">
            <button
              onClick={handleSearch}
              disabled={!isSearchEnabled}
              title={isSearchEnabled ? undefined : 'Sélectionnez une gare dans la liste'}
              className="bg-[#1d7a5a] hover:bg-[#155d44] disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-sm w-full lg:w-auto"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              Rechercher
            </button>
          </div>

        </div>
      </div>
    </I18nProvider>
  );
}

export const ExplorerSearch = SearchBoxOneStation;
