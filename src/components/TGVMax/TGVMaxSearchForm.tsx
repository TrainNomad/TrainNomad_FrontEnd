import { useState, useCallback } from 'react';
import { AutocompleteInput } from '../AutocompleteInput';
import { DateRangePicker } from '../ui/DateRangePicker';
import { SwapButton } from '../ui/SwapButton';
import { I18nProvider } from 'react-aria-components';
import { getLocalTimeZone, today as getToday, CalendarDate } from '@internationalized/date';
import type { Station } from '../../types';
import { ANYWHERE_ID, placeParam } from '../../types';
import { useNetwork } from '../../network/NetworkContext';

/** Formulaire de la page /tgvmax : ouvre /tgvmax/trajets, ou /tgvmax/explorer pour « N'importe où ». */
export function TGVMaxSearchForm() {
  const { network } = useNetwork();
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [selectedFrom, setSelectedFrom] = useState<Station | null>(null);
  const [selectedTo, setSelectedTo] = useState<Station | null>(null);

  const [departDate, setDepartDate] = useState<CalendarDate>(getToday(getLocalTimeZone()));
  const [returnDate, setReturnDate] = useState<CalendarDate | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const isRoundTrip = returnDate !== null;
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

  const handleDateChange = useCallback((depart: CalendarDate, retour: CalendarDate | null) => {
    setDepartDate(depart);
    setReturnDate(retour);
  }, []);

  const clearReturnDate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setReturnDate(null);
  }, []);

  const handleSearch = useCallback(() => {
    if (!isSearchEnabled) return;
    const departure = placeParam(selectedFrom, fromQuery);
    const departureName = selectedFrom?.name || fromQuery;
    if (isAnywhere) {
      const params = new URLSearchParams({ from: departure, from_name: departureName, date: departDate.toString() });
      window.location.href = `${network.paths.explorer}?${params.toString()}`;
      return;
    }
    const arrival = placeParam(selectedTo, toQuery);
    const arrivalName = selectedTo?.name || toQuery;
    const params = new URLSearchParams({
      departure,
      departure_name: departureName,
      arrival,
      arrival_name: arrivalName,
      date: departDate.toString(),
      ...(isRoundTrip && returnDate && { return_date: returnDate.toString() }),
      departure_time: '02:00',
    });
    window.location.href = `${network.paths.trajets}?${params.toString()}`;
  }, [isSearchEnabled, isAnywhere, selectedFrom, selectedTo, fromQuery, toQuery, departDate, returnDate, isRoundTrip, network]);

  return (
    <I18nProvider locale="fr-FR">
      <div className="w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
        {/* Search fields - Column layout */}
        <div className="space-y-4">
          {/* Départ */}
          <div>
            <AutocompleteInput
              key={`from-${swapKey}`}
              id="tgvmax-input-from"
              label="Départ"
              placeholder="D'où partez-vous ?"
              icon="trip_origin"
              initialValue={fromQuery}
              onSelect={setSelectedFrom}
              onQueryChange={setFromQuery}
            />
          </div>

          {/* Arrivée, avec le bouton d'inversion posé entre les deux champs */}
          <div className="relative">
            <SwapButton
              onClick={handleSwap}
              disabled={!canSwap}
              className="absolute z-10 right-6 -top-2 -translate-y-1/2 rotate-90 hover:!text-[#F97316] hover:!border-[#F97316]"
            />
            <AutocompleteInput
              key={`to-${swapKey}`}
              id="tgvmax-input-to"
              label="Arrivée"
              placeholder="Où allez-vous ?"
              icon="location_on"
              withAnywhere
              initialValue={toQuery}
              onSelect={setSelectedTo}
              onQueryChange={setToQuery}
            />
          </div>

          {/* Date */}
          <div className="relative">
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="w-full flex flex-col items-start px-5 py-4 bg-white hover:bg-[#F97316]/5 rounded-2xl transition-colors cursor-pointer group text-left border border-[#F97316]/20"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F97316] mb-1.5 group-hover:text-[#EA8514] transition-colors">
                {isRoundTrip ? 'Dates' : 'Date aller'}
              </span>
              <div className="flex items-center gap-2 w-full">
                <span className="material-symbols-outlined text-[#F97316] group-hover:text-[#EA8514] transition-colors flex-shrink-0 text-xl">
                  calendar_month
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-slate-900">
                    {departDate.toString()}
                  </span>
                  {isRoundTrip && returnDate && (
                    <>
                      <span className="text-slate-400">→</span>
                      <span className="font-bold text-base text-[#F97316]">
                        {returnDate.toString()}
                      </span>
                      <button
                        onClick={clearReturnDate}
                        className="ml-1 w-5 h-5 rounded-full bg-[#F97316]/10 hover:bg-red-100 flex items-center justify-center transition-colors group/x"
                        title="Supprimer le retour"
                      >
                        <svg className="w-3 h-3 text-[#F97316] group-hover/x:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
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

          {/* Bouton Chercher */}
          <button
            onClick={handleSearch}
            disabled={!isSearchEnabled}
            className={`w-full py-4 px-6 rounded-xl font-bold text-white uppercase tracking-wide transition-all flex items-center justify-center gap-2 ${
              isSearchEnabled
                ? 'bg-[#F97316] hover:bg-[#EA8514] shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <i className="fa-solid fa-magnifying-glass" />
            Chercher
          </button>
        </div>
      </div>
    </I18nProvider>
  );
}
