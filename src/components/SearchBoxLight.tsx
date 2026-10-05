import { useState, useCallback, useEffect, useRef } from 'react';
import { formatDateShort } from '../lib/format';
import { AutocompleteInput } from './AutocompleteInput';
import type { Station } from '../types';
import { ANYWHERE_ID, placeParam } from '../types';

import { I18nProvider } from 'react-aria-components';
import { getLocalTimeZone, today as getToday, CalendarDate, parseDate } from '@internationalized/date';
import { DateRangePicker } from './ui/DateRangePicker';
import { useNetwork } from '../network/NetworkContext';
import { SwapButton } from './ui/SwapButton';

interface Props {
  onSearch: (data: {
    origin: string;
    destination: string;
    originName: string;
    destinationName: string;
    date: string;
    returnDate?: string
  }) => void;
}

export default function SearchBox({ onSearch }: Props) {
  const { network } = useNetwork();
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

  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [selectedFrom, setSelectedFrom] = useState<Station | null>(null);
  const [selectedTo, setSelectedTo] = useState<Station | null>(null);

  // Clé unique pour forcer le remount des inputs seulement au chargement initial
  const mountKey = useRef(Date.now());

  // Ingestion des paramètres de l'URL au chargement du composant
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const departureName = params.get('departure_name') || params.get('from_name');
    const arrivalName = params.get('arrival_name') || params.get('to_name');
    const dateParam = params.get('date');
    const returnDateParam = params.get('return_date') || params.get('returnDate');

    if (departureName) {
      setFromQuery(departureName);
    }
    if (arrivalName) {
      setToQuery(arrivalName);
    }
    if (dateParam) {
      try {
        setDepartDate(parseDate(dateParam));
      } catch {
        // Format invalide, garder la date courante
      }
    }
    if (returnDateParam) {
      try {
        setReturnDate(parseDate(returnDateParam));
      } catch {
        // Format invalide, garder null
      }
    }
  }, []);

  const isAnywhere = selectedTo?.id === ANYWHERE_ID;
  const isSearchEnabled = fromQuery.trim().length >= 2 && (isAnywhere || toQuery.trim().length >= 2);

  // Inversion départ / arrivée : les champs sont remontés (key) avec leur nouvelle valeur initiale
  const [swapKey, setSwapKey] = useState(0);
  const canSwap = !isAnywhere && (fromQuery.trim() !== '' || toQuery.trim() !== '');
  const handleSwap = useCallback(() => {
    // Une gare choisie dans la liste garde son nom complet (la saisie, elle, peut être partielle : « par »)
    setFromQuery(selectedTo?.name ?? toQuery);
    setToQuery(selectedFrom?.name ?? fromQuery);
    setSelectedFrom(selectedTo);
    setSelectedTo(selectedFrom);
    setSwapKey((k) => k + 1);
  }, [fromQuery, toQuery, selectedFrom, selectedTo]);

  const handleSearch = useCallback(() => {
    if (!isSearchEnabled) return;
    const origin = placeParam(selectedFrom, fromQuery);
    const originName = selectedFrom?.name || fromQuery;
    if (isAnywhere) {
      const params = new URLSearchParams({
        from: origin,
        from_name: originName,
        date: departDate.toString(),
        ...(isRoundTrip && returnDate && { return_date: returnDate.toString() }),
      });
      window.location.href = `${network.paths.explorer}?${params.toString()}`;
      return;
    }
    const destination = placeParam(selectedTo, toQuery);
    const destinationName = selectedTo?.name || toQuery;
    onSearch({
      origin,
      destination,
      originName,
      destinationName,
      date: departDate.toString(),
      ...(returnDate && { returnDate: returnDate.toString() }),
    });
  }, [isSearchEnabled, isAnywhere, selectedFrom, selectedTo, fromQuery, toQuery, departDate, returnDate, isRoundTrip, onSearch, network]);

  return (
    <I18nProvider locale="fr-FR">
      <div className="w-full max-w-7xl mx-auto px-6 py-2">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1 flex flex-wrap lg:flex-nowrap items-center gap-1">

          {/* Départ */}
          <div className="flex-1 min-w-[180px] px-2 py-1">
            <AutocompleteInput
              key={`from-${mountKey.current}-${swapKey}`}
              id="input-from"
              label="Départ"
              placeholder="Ville de départ"
              icon="location_on"
              initialValue={fromQuery}
              onSelect={setSelectedFrom}
              onQueryChange={setFromQuery}
            />
          </div>

          <SwapButton onClick={handleSwap} disabled={!canSwap} />

          {/* Arrivée */}
          <div className="flex-1 min-w-[180px] px-2 py-1">
            <AutocompleteInput
              key={`to-${mountKey.current}-${swapKey}`}
              id="input-to"
              label="Arrivée"
              placeholder="Ville d'arrivée"
              icon="navigation"
              withAnywhere
              initialValue={toQuery}
              onSelect={setSelectedTo}
              onQueryChange={setToQuery}
            />
          </div>

          <div className="w-px bg-slate-100 my-1 hidden lg:block h-8"></div>

          {/* Dates */}
          <div className="w-full lg:w-auto px-2 py-1 relative">
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
                  {formatDateShort(departDate.toString())}
                </span>
                {isRoundTrip && returnDate && (
                  <>
                    <span className="text-slate-400 text-xs">→</span>
                    <span className="text-sm font-semibold text-primary">
                      {formatDateShort(returnDate.toString())}
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

          {/* Bouton recherche */}
          <div className="w-full lg:w-auto p-0.5">
            <button
              onClick={handleSearch}
              disabled={!isSearchEnabled}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1 whitespace-nowrap shadow-md w-full lg:w-auto text-xs"
            >
              <span className="material-symbols-outlined text-sm">search</span>RECHERCHER
            </button>
          </div>

        </div>
      </div>
    </I18nProvider>
  );
}