import { useState, useRef } from 'react';
import { AutocompleteInput } from './AutocompleteInput';
import type { Station } from '../types';

import { Calendar } from './ui/calendar-rac';
import { Dialog, DialogTrigger, Popover, Button, I18nProvider, DateValue } from 'react-aria-components';
import { getLocalTimeZone, today as getToday, CalendarDate } from '@internationalized/date';

export interface ExplorerSearchPayload {
  /** Gare choisie dans l'autocomplétion (source de vérité de la recherche) */
  station: Station;
  /** Libellé exact envoyé à l'API (station.search_val ?? station.label) */
  origin: string;
  date: string;
  time: string;
}

interface Props {
  onSearch: (data: ExplorerSearchPayload) => void;
}

export function SearchBoxOneStation({ onSearch }: Props) {
  // La recherche est pilotée par la SÉLECTION dans l'autocomplétion, jamais par
  // le texte libre : tant qu'aucune suggestion n'est choisie, le bouton est
  // désactivé. Le hook remet selectedFrom à null dès que l'utilisateur retape.
  const [selectedFrom, setSelectedFrom] = useState<Station | null>(null);

  const [departDate, setDepartDate] = useState<CalendarDate>(getToday(getLocalTimeZone()));
  const timeRef = useRef<HTMLInputElement>(null);

  const isSearchEnabled = selectedFrom !== null;

  const handleSearch = () => {
    if (!selectedFrom) return;
    const time = timeRef.current?.value ? timeRef.current.value + ':00' : '06:00:00';
    onSearch({
      station: selectedFrom,
      origin: selectedFrom.search_val || selectedFrom.label,
      date: departDate.toString(),
      time,
    });
  };

  return (
    <I18nProvider locale="fr-FR">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3">
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
          
          {/* Gare de départ */}
          <div className="flex-1 min-w-[240px] px-1">
            <AutocompleteInput
              id="input-explorer-from"
              label={isSearchEnabled ? 'Gare de départ' : 'Gare de départ — choisir dans la liste'}
              placeholder="Paris, Rennes, Lyon..."
              icon="location_on"
              onSelect={setSelectedFrom}
              isSelected={isSearchEnabled}
              onSubmit={handleSearch}
              compact
            />
          </div>

          <div className="w-px bg-slate-100 my-2 hidden lg:block h-10"></div>

          {/* Date aller */}
          <div className="w-full lg:w-52 px-3 py-1 relative group">
            <DialogTrigger>
              <Button className="flex flex-col items-start w-full text-left outline-none border-none bg-transparent cursor-pointer">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Date</span>
                <div className="flex items-center gap-2 w-full">
                  <span className="material-symbols-outlined text-slate-400 text-lg flex-shrink-0">
                    <i className="fa-regular fa-calendar fa-xs" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-slate-900 truncate">
                    {departDate ? departDate.toString() : 'Choisir'}
                  </span>
                </div>
              </Button>
              <Popover className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-40">
                <Dialog>
                  <Calendar
                    aria-label="Date de départ"
                    minValue={getToday(getLocalTimeZone())}
                    value={departDate}
                    onChange={(value: DateValue | readonly DateValue[]) => {
                      const newDate = Array.isArray(value) ? value[0] : value;
                      if (newDate) {
                        setDepartDate(newDate as CalendarDate);
                      }
                    }}
                  />
                </Dialog>
              </Popover>
            </DialogTrigger>
          </div>

          <div className="w-px bg-slate-100 my-2 hidden lg:block h-10"></div>

          {/* Heure départ */}
          <div className="w-full lg:w-40 px-3 py-1 relative group">
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

// Alias pour garder la compatibilité si importé sous le nom ExplorerSearch
export const ExplorerSearch = SearchBoxOneStation;