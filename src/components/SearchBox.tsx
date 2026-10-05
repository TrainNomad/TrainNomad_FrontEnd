import { useState, useCallback } from 'react';
import { formatDateShort } from '../lib/format';
import { AutocompleteInput } from './AutocompleteInput';
import type { ActiveTab, Station } from '../types';
import { ANYWHERE_ID, placeParam } from '../types';

import { I18nProvider } from 'react-aria-components';
import { getLocalTimeZone, today as getToday, CalendarDate } from '@internationalized/date';

import { DateRangePicker } from './ui/DateRangePicker';
import { SwapButton } from './ui/SwapButton';

export default function SearchBox() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('europe');

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

  const [carteFromQuery, setCarteFromQuery] = useState('');
  const [carteSelectedFrom, setCarteSelectedFrom] = useState<Station | null>(null);

  const isAnywhere = selectedTo?.id === ANYWHERE_ID;
  const isSearchEnabled = fromQuery.trim().length >= 2 && (isAnywhere || toQuery.trim().length >= 2);
  const isCarteEnabled = carteFromQuery.trim().length >= 2;

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

  const goToExplorer = useCallback((from: string, fromName: string) => {
    const params = new URLSearchParams({ from, from_name: fromName, date: departDate.toString() });
    window.location.href = '/explorer?' + params.toString();
  }, [departDate]);

  const handleSearch = useCallback(() => {
    if (!isSearchEnabled) return;
    const departure = placeParam(selectedFrom, fromQuery);
    const departureName = selectedFrom?.name || fromQuery;
    if (isAnywhere) {
      goToExplorer(departure, departureName);
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
    window.location.href = '/trajets?' + params.toString();
  }, [isSearchEnabled, isAnywhere, selectedFrom, selectedTo, fromQuery, toQuery, departDate, returnDate, isRoundTrip, goToExplorer]);

  const handleCarteSearch = useCallback(() => {
    const from = placeParam(carteSelectedFrom, carteFromQuery);
    const fromName = carteSelectedFrom?.name || carteFromQuery;
    goToExplorer(from, fromName);
  }, [carteSelectedFrom, carteFromQuery, goToExplorer]);

  const tabClass = (tab: ActiveTab) =>
    tab === activeTab
      ? 'tab-btn flex items-center gap-2 px-5 py-2.5 rounded-t-2xl text-midnight bg-white font-bold transition-all border-b-2 border-emerald-500 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]'
      : 'tab-btn flex items-center gap-2 px-5 py-2.5 rounded-t-2xl text-slate-500 text-sm font-bold transition-all border-b-2 border-transparent bg-white/50 hover:bg-white';

  return (
    <I18nProvider locale="fr-FR">
      <div className="max-w-5xl mx-auto relative z-30">
        <div className="flex items-center gap-2 mb-0 ml-2">
          <button onClick={() => setActiveTab('europe')} className={tabClass('europe')}>
            <span className="material-symbols-outlined text-xl">
              <i className="fa-solid fa-route" />
            </span>
            Trajets Europe
          </button>
          <button onClick={() => setActiveTab('carte')} className={tabClass('carte')}>
            <span className="material-symbols-outlined text-xl">
              <i className="fa-regular fa-map" />
            </span>
            Explorer la carte
          </button>
        </div>

        <div className="bg-white rounded-3xl rounded-tl-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-3 border border-slate-100">
          {activeTab === 'europe' && (
            <div className="grid grid-cols-1 gap-0 relative md:grid-cols-[1fr_1fr_auto_auto]">
              <AutocompleteInput
                key={`from-${swapKey}`}
                id="input-from"
                label="Départ"
                placeholder="D'où partez-vous ?"
                icon="trip_origin"
                initialValue={fromQuery}
                onSelect={setSelectedFrom}
                onQueryChange={setFromQuery}
              />

              {/* Bouton d'inversion posé sur la limite entre les deux champs (au-dessus en mobile, à gauche sinon) */}
              <div className="relative grid">
                <AutocompleteInput
                  key={`to-${swapKey}`}
                  id="input-to"
                  label="Arrivée"
                  placeholder="Où allez-vous ?"
                  icon="location_on"
                  withAnywhere
                  initialValue={toQuery}
                  onSelect={setSelectedTo}
                  onQueryChange={setToQuery}
                />
                <SwapButton
                  onClick={handleSwap}
                  disabled={!canSwap}
                  className="absolute z-10 right-5 top-0 -translate-y-1/2 rotate-90 md:rotate-0 md:right-auto md:left-0 md:top-1/2 md:-translate-x-1/2"
                />
              </div>

              <div className="flex items-center border-r border-slate-100 relative">
                <button
                  onClick={() => setIsCalendarOpen(true)}
                  className="flex flex-col items-start px-5 py-4 hover:bg-slate-50/50 rounded-2xl transition-colors cursor-pointer group h-full text-left"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 group-hover:text-primary transition-colors">
                    {isRoundTrip ? 'Dates' : 'Date aller'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors flex-shrink-0 text-xl">
                      calendar_month
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-midnight">
                        {formatDateShort(departDate.toString())}
                      </span>
                      {isRoundTrip && returnDate && (
                        <>
                          <span className="text-slate-400">→</span>
                          <span className="font-bold text-base text-primary">
                            {formatDateShort(returnDate.toString())}
                          </span>
                          <button
                            onClick={clearReturnDate}
                            className="ml-1 w-5 h-5 rounded-full bg-slate-200 hover:bg-red-100 flex items-center justify-center transition-colors group/x"
                            title="Supprimer le retour"
                          >
                            <svg className="w-3 h-3 text-slate-500 group-hover/x:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

              <div className="flex p-1.5">
                <button
                  onClick={handleSearch}
                  disabled={!isSearchEnabled}
                  className="bg-midnight hover:bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:-translate-y-[2px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 w-full h-full min-h-[56px] min-w-[140px] px-5"
                >
                  <span className="text-sm font-bold">Rechercher</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'carte' && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-0 relative">
              <AutocompleteInput
                id="carte-input-from"
                label="Départ"
                placeholder="D'où partez-vous ?"
                icon="trip_origin"
                onSelect={setCarteSelectedFrom}
                onQueryChange={setCarteFromQuery}
              />

              <div className="flex items-center border-r border-slate-100 relative">
                <button
                  onClick={() => setIsCalendarOpen(true)}
                  className="flex flex-col items-start px-6 py-5 hover:bg-slate-50/50 rounded-2xl transition-colors cursor-pointer group h-full text-left"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 group-hover:text-primary transition-colors">
                    Date
                  </span>
                  <div className="flex items-center gap-3 w-full">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors flex-shrink-0">
                      calendar_month
                    </span>
                    <span className="text-midnight font-bold text-lg">
                      {formatDateShort(departDate.toString())}
                    </span>
                  </div>
                </button>

                {isCalendarOpen && (
                  <DateRangePicker
                    departDate={departDate}
                    returnDate={null}
                    onChange={(d) => { setDepartDate(d); }}
                    onClose={() => setIsCalendarOpen(false)}
                    singleDate
                  />
                )}
              </div>

              <div className="flex p-1.5">
                <button
                  onClick={handleCarteSearch}
                  disabled={!isCarteEnabled}
                  className="bg-midnight hover:bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:-translate-y-[2px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 w-full h-full min-h-[56px] min-w-[140px] px-5"
                >
                  <span className="text-sm font-bold">Explorer</span>
                  <span className="material-symbols-outlined text-[20px]">explore</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </I18nProvider>
  );
}