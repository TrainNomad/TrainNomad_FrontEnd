import { useState, useCallback, useRef } from 'react';
import { AutocompleteInput } from './AutocompleteInput';
import type { Station, TripType } from '../types';
import { ANYWHERE_ID, placeParam } from '../types';

import { Calendar } from './ui/calendar-rac';
import { Dialog, DialogTrigger, Popover, Button, I18nProvider, DateValue } from 'react-aria-components';
import { getLocalTimeZone, today as getToday, CalendarDate } from '@internationalized/date';

interface Props {
  onSearch: (data: { origin: string; destination: string; date: string; time: string }) => void;
}

export default function SearchBox({ onSearch }: Props) {
  const [tripType, setTripType] = useState<TripType>('oneway');
  
  const [departDate, setDepartDate] = useState<CalendarDate>(getToday(getLocalTimeZone()));
  const [returnDate, setReturnDate] = useState<CalendarDate>(getToday(getLocalTimeZone()));

  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const [selectedFrom, setSelectedFrom] = useState<Station | null>(null);
  const [selectedTo, setSelectedTo] = useState<Station | null>(null);

  const timeRef = useRef<HTMLInputElement>(null);

  const isAnywhere = selectedTo?.id === ANYWHERE_ID;
  const isSearchEnabled = fromQuery.trim().length >= 2 && (isAnywhere || toQuery.trim().length >= 2);

  const handleSearch = useCallback(() => {
    if (!isSearchEnabled) return;
    const time = timeRef.current?.value || '06:00';
    const origin = placeParam(selectedFrom, fromQuery);
    if (isAnywhere) {
      // « N'importe où » : carte de toutes les destinations depuis la gare de départ
      const params = new URLSearchParams({ from: origin, date: departDate.toString(), time });
      window.location.href = '/explorer?' + params.toString();
      return;
    }
    onSearch({
      origin,
      destination: placeParam(selectedTo, toQuery),
      date: departDate.toString(),
      time,
    });
  }, [isSearchEnabled, isAnywhere, selectedFrom, selectedTo, fromQuery, toQuery, departDate, onSearch]);

  const tripBtnClass = (type: TripType) =>
    type === tripType
      ? 'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-slate-900 text-white'
      : 'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-slate-100 text-slate-500 hover:bg-slate-200';

  return (
    <I18nProvider locale="fr-FR">
      <div className="w-full max-w-7xl mx-auto px-6 py-2">
        
        {/* Toggle type de voyage */}
        <div className="flex items-center gap-2 mb-2 ml-1">
          <button onClick={() => setTripType('oneway')} className={tripBtnClass('oneway')}>
            <i className="fa-solid fa-arrow-right text-[10px]" aria-hidden="true" />
            Aller simple
          </button>
          <button onClick={() => setTripType('roundtrip')} className={tripBtnClass('roundtrip')}>
            <i className="fa-solid fa-arrow-right-arrow-left text-[10px]" aria-hidden="true" />
            Aller-retour
          </button>
        </div>

        {/* Barre unifiée */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1 flex flex-wrap lg:flex-nowrap items-center gap-1">
          
          {/* Départ */}
          <div className="flex-1 min-w-[200px] px-2 py-1">
            <AutocompleteInput
              id="input-from"
              label="Départ"
              placeholder="Ville de départ"
              icon="location_on"
              onSelect={setSelectedFrom}
              onQueryChange={setFromQuery}
            />
          </div>

          <div className="w-px bg-slate-100 my-1 hidden lg:block h-8"></div>

          {/* Arrivée */}
          <div className="flex-1 min-w-[200px] px-2 py-1">
            <AutocompleteInput
              id="input-to"
              label="Arrivée"
              placeholder="Ville d'arrivée"
              icon="navigation"
              withAnywhere
              onSelect={setSelectedTo}
              onQueryChange={setToQuery}
            />
          </div>

          <div className="w-px bg-slate-100 my-1 hidden lg:block h-8"></div>

          {/* Date aller */}
          <div className="w-full lg:w-44 px-2 py-1 relative group">
            <DialogTrigger>
              <Button className="flex flex-col items-start w-full text-left outline-none border-none bg-transparent cursor-pointer">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Date aller</span>
                <div className="flex items-center gap-2 w-full">
                  <span className="material-symbols-outlined text-slate-400 text-lg flex-shrink-0">
                    <i className="fa-regular fa-calendar fa-xs" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-slate-900 truncate">
                    {departDate ? departDate.toString() : 'Choisir'}
                  </span>
                </div>
              </Button>
              <Popover className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-50">
                <Dialog>
                  <Calendar
                    aria-label="Date de départ"
                    minValue={getToday(getLocalTimeZone())}
                    value={departDate}
                    onChange={(value: DateValue | readonly DateValue[]) => {
                      const newDate = Array.isArray(value) ? value[0] : value;
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
          </div>

          {/* Date retour */}
          {tripType === 'roundtrip' && (
            <>
              <div className="w-px bg-slate-100 my-2 hidden lg:block h-10"></div>
              <div className="w-full lg:w-44 px-4 py-2 relative group border-l lg:border-l-0 border-slate-100">
                <DialogTrigger>
                  <Button className="flex flex-col items-start w-full text-left outline-none border-none bg-transparent cursor-pointer">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Date retour</span>
                    <div className="flex items-center gap-2 w-full">
                      <span className="material-symbols-outlined text-slate-400 text-lg flex-shrink-0">
                        <i className="fa-regular fa-calendar fa-xs" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {returnDate ? returnDate.toString() : 'Choisir'}
                      </span>
                    </div>
                  </Button>
                  <Popover className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-50">
                    <Dialog>
                      <Calendar
                        aria-label="Date de retour"
                        minValue={departDate}
                        value={returnDate}
                        onChange={(value: DateValue | readonly DateValue[]) => {
                          const newDate = Array.isArray(value) ? value[0] : value;
                          if (newDate) {
                            setReturnDate(newDate as CalendarDate);
                          }
                        }}
                      />
                    </Dialog>
                  </Popover>
                </DialogTrigger>
              </div>
            </>
          )}

          <div className="w-px bg-slate-100 my-1 hidden lg:block h-8"></div>

          {/* Heure départ */}
          <div className="w-full lg:w-36 px-2 py-1 relative group">
            <div className="flex flex-col items-start w-full">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Heure départ</label>
              <div className="flex items-center gap-1 w-full">
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