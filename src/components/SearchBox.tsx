import { useState, useCallback } from 'react';
import { AutocompleteInput } from './AutocompleteInput';
import type { ActiveTab, Station, TripType } from '../types';

// Importer le calendrier et les composants popover de react-aria-components
import { Calendar } from './ui/calendar-rac';
import { Dialog, DialogTrigger, Popover, Button, I18nProvider, DateValue } from 'react-aria-components';
import { getLocalTimeZone, today as getToday, CalendarDate } from '@internationalized/date';

export default function SearchBox() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('europe');
  const [tripType, setTripType] = useState<TripType>('oneway');
  
  // Dates gérées sous forme d'objets CalendarDate pour react-aria
  const [departDate, setDepartDate] = useState<CalendarDate>(getToday(getLocalTimeZone()));
  const [returnDate, setReturnDate] = useState<CalendarDate>(getToday(getLocalTimeZone()));

  // From/to pour l'onglet Europe
  const [fromQuery, setFromQuery] = useState('Paris');
  const [toQuery, setToQuery] = useState('');
  const [_selectedFrom, setSelectedFrom] = useState<Station | null>(null);
  const [_selectedTo, setSelectedTo] = useState<Station | null>(null);

  // From pour l'onglet Carte
  const [carteFromQuery, setCarteFromQuery] = useState('');
  const [_carteSelectedFrom, setCarteSelectedFrom] = useState<Station | null>(null);

  const isSearchEnabled = fromQuery.trim().length >= 2 && toQuery.trim().length >= 2;
  const isCarteEnabled = carteFromQuery.trim().length >= 2;

  const handleSearch = useCallback(() => {
    if (!fromQuery || !toQuery) return;
    const params = new URLSearchParams({
      departure: fromQuery,
      arrival: toQuery,
      date: departDate.toString(),
      ...(tripType === 'roundtrip' && { return_date: returnDate.toString() }),
      departure_time: '06:00:00',
    });
    window.location.href = 'trajets.html?' + params.toString();
  }, [fromQuery, toQuery, departDate, returnDate, tripType]);

  const handleCarteSearch = useCallback(() => {
    const params = new URLSearchParams({ 
      from: carteFromQuery, 
      date: departDate.toString() 
    });
    window.location.href = 'explorer.html?' + params.toString();
  }, [carteFromQuery, departDate]);

  const tabClass = (tab: ActiveTab) =>
    tab === activeTab
      ? 'tab-btn flex items-center gap-2 px-5 py-2.5 rounded-t-2xl text-midnight bg-white font-bold transition-all border-b-2 border-emerald-500 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]'
      : 'tab-btn flex items-center gap-2 px-5 py-2.5 rounded-t-2xl text-slate-500 text-sm font-bold transition-all border-b-2 border-transparent bg-white/50 hover:bg-white';

  const tripBtnClass = (type: TripType) =>
    type === tripType
      ? 'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-midnight text-white'
      : 'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-slate-100 text-slate-500 hover:bg-slate-200';

  return (
    <I18nProvider locale="fr-FR">
      <div className="max-w-5xl mx-auto">
        {/* Onglets */}
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
          {/* Toggle type de voyage */}
          {activeTab === 'europe' && (
            <div className="flex items-center gap-1 px-3 pt-2 pb-2">
              <button onClick={() => setTripType('oneway')} className={tripBtnClass('oneway')}>
                <i className="fa-solid fa-arrow-right text-[10px]" />
                Aller simple
              </button>
              <button onClick={() => setTripType('roundtrip')} className={tripBtnClass('roundtrip')}>
                <i className="fa-solid fa-arrow-right-arrow-left text-[10px]" />
                Aller-retour
              </button>
            </div>
          )}

          {/* Grille Europe */}
          {activeTab === 'europe' && (
            <div
              className={`grid grid-cols-1 gap-0 relative ${
                tripType === 'roundtrip'
                  ? 'md:grid-cols-[1fr_1fr_1fr_1fr_auto]'
                  : 'md:grid-cols-[1fr_1fr_1fr_auto]'
              }`}
            >
              <AutocompleteInput
                id="input-from"
                label="Départ"
                placeholder="D'où partez-vous ?"
                icon="trip_origin"
                onSelect={setSelectedFrom}
                onQueryChange={setFromQuery}
              />

              <AutocompleteInput
                id="input-to"
                label="Arrivée"
                placeholder="Où allez-vous ?"
                icon="location_on"
                withAnywhere
                onSelect={setSelectedTo}
                onQueryChange={setToQuery}
              />

              {/* Calendar Popover Aller */}
              <DialogTrigger>
                <Button className="flex flex-col items-start px-6 py-5 hover:bg-slate-50/50 rounded-2xl transition-colors cursor-pointer group border-r border-slate-100 h-full text-left outline-none">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 group-hover:text-primary transition-colors">
                    {tripType === 'roundtrip' ? 'Aller' : 'Date'}
                  </span>
                  <div className="flex items-center gap-3 w-full">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors flex-shrink-0">
                      calendar_month
                    </span>
                    <span className="text-midnight font-bold text-lg">
                      {departDate ? departDate.toString() : 'Choisir une date'}
                    </span>
                  </div>
                </Button>
                <Popover className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-50">
                  <Dialog>
                    <Calendar
                      aria-label="Date de départ"
                      minValue={getToday(getLocalTimeZone())}
                      value={departDate}
                      onChange={(newDate: DateValue) => {
                        if (newDate) {
                          const dateObj = newDate as CalendarDate;
                          setDepartDate(dateObj);
                          if (returnDate.compare(dateObj) < 0) {
                            setReturnDate(dateObj);
                          }
                        }
                      }}
                    />
                  </Dialog>
                </Popover>
              </DialogTrigger>

              {/* Calendar Popover Retour */}
              {tripType === 'roundtrip' && (
                <DialogTrigger>
                  <Button className="flex flex-col items-start px-6 py-5 hover:bg-slate-50/50 rounded-2xl transition-colors cursor-pointer group border-r border-slate-100 h-full text-left outline-none">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 group-hover:text-primary transition-colors">
                      Retour
                    </span>
                    <div className="flex items-center gap-3 w-full">
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors flex-shrink-0">
                        calendar_month
                      </span>
                      <span className="text-midnight font-bold text-lg">
                        {returnDate ? returnDate.toString() : 'Choisir une date'}
                      </span>
                    </div>
                  </Button>
                  <Popover className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-50">
                    <Dialog>
                      <Calendar
                        aria-label="Date de retour"
                        minValue={departDate}
                        value={returnDate}
                        onChange={(newDate: DateValue) => {
                          if (newDate) {
                            setReturnDate(newDate as CalendarDate);
                          }
                        }}
                      />
                    </Dialog>
                  </Popover>
                </DialogTrigger>
              )}

              {/* Bouton de recherche */}
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

          {/* Grille Carte */}
          {activeTab === 'carte' && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-0 relative">
              <AutocompleteInput
                id="carte-input-from"
                label="Départ"
                placeholder="D'où partez-vous ?"
                icon="trip_origin"
                onSelect={setCarteSelectedFrom}
                onQueryChange={setCarteFromQuery}
              />

              <DialogTrigger>
                <Button className="flex flex-col items-start px-6 py-5 hover:bg-slate-50/50 rounded-2xl transition-colors cursor-pointer group border-r border-slate-100 h-full text-left outline-none">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 group-hover:text-primary transition-colors">
                    Date
                  </span>
                  <div className="flex items-center gap-3 w-full">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors flex-shrink-0">
                      calendar_month
                    </span>
                    <span className="text-midnight font-bold text-lg">
                      {departDate ? departDate.toString() : 'Choisir une date'}
                    </span>
                  </div>
                </Button>
                <Popover className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-50">
                  <Dialog>
                    <Calendar
                      aria-label="Date d'exploration"
                      minValue={getToday(getLocalTimeZone())}
                      value={departDate}
                      onChange={(newDate: DateValue) => {
                        if (newDate) {
                          setDepartDate(newDate as CalendarDate);
                        }
                      }}
                    />
                  </Dialog>
                </Popover>
              </DialogTrigger>

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

