import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getLocalTimeZone, today as getToday, CalendarDate } from '@internationalized/date';
import { ChevronLeftIcon, ChevronRightIcon, Cross2Icon } from '@radix-ui/react-icons';
import { useNetwork } from '../../network/NetworkContext';

interface DateRangePickerProps {
  departDate: CalendarDate;
  returnDate: CalendarDate | null;
  onChange: (depart: CalendarDate, retour: CalendarDate | null) => void;
  onClose: () => void;
  singleDate?: boolean;
}

export function DateRangePicker({
  departDate: initialDepart,
  returnDate: initialReturn,
  onChange,
  onClose,
  singleDate = false,
}: DateRangePickerProps) {
  // Le calendrier est rendu dans <body> (portal) : on lui réapplique le thème du réseau courant.
  const { network } = useNetwork();
  const [tempDepart, setTempDepart] = useState<CalendarDate>(initialDepart);
  const [tempReturn, setTempReturn] = useState<CalendarDate | null>(initialReturn);
  const [activeTab, setActiveTab] = useState<'depart' | 'return'>('depart');
  const [currentMonth, setCurrentMonth] = useState<CalendarDate>(initialDepart);

  const modalRef = useRef<HTMLDivElement>(null);
  const todayDate = getToday(getLocalTimeZone());

  // Fermeture au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Logique de sélection : le 1er clic définit TOUJOURS l'aller
  const handleDateClick = useCallback((date: CalendarDate) => {
    if (singleDate) {
      setTempDepart(date);
      return;
    }

    if (activeTab === 'depart') {
      // Sélection de la date aller
      setTempDepart(date);
      if (tempReturn && date.compare(tempReturn) >= 0) {
        setTempReturn(null);
      }
      // Bascule automatiquement en mode attente du retour
      setActiveTab('return');
    } else {
      // Sélection de la date retour
      if (date.compare(tempDepart) > 0) {
        setTempReturn(date);
      } else {
        // Si clic antérieur/égal à la date aller, redéfinit la date aller
        setTempDepart(date);
        setTempReturn(null);
      }
    }
  }, [tempDepart, tempReturn, activeTab, singleDate]);

  const handleConfirm = useCallback(() => {
    onChange(tempDepart, singleDate ? null : tempReturn);
    onClose();
  }, [tempDepart, tempReturn, onChange, onClose, singleDate]);

  const handleClearReturn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempReturn(null);
    setActiveTab('depart');
  };

  const goToPrevMonth = () => setCurrentMonth(currentMonth.subtract({ months: 1 }));
  const goToNextMonth = () => setCurrentMonth(currentMonth.add({ months: 1 }));

  const getDaysInMonth = (date: CalendarDate) => {
    const year = date.year;
    const month = date.month;
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days: (CalendarDate | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new CalendarDate(year, month, d));
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const monthName = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    new Date(currentMonth.year, currentMonth.month - 1)
  );

  const isInRange = (date: CalendarDate) => {
    if (!tempReturn) return false;
    return date.compare(tempDepart) > 0 && date.compare(tempReturn) < 0;
  };

  const isStartDate = (date: CalendarDate) => date.compare(tempDepart) === 0;
  const isEndDate = (date: CalendarDate) => tempReturn && date.compare(tempReturn) === 0;
  const isDisabled = (date: CalendarDate) => date.compare(todayDate) < 0;
  const isToday = (date: CalendarDate) => date.compare(todayDate) === 0;

  // Utilisation de React Portal pour détacher le modal du flux HTML et le superposer à tout (z-index maximal)
  return createPortal(
    <div className={`${network.themeClass} fixed inset-0 z-[99999] flex items-center justify-center bg-black/30 backdrop-blur-xs p-4`}>
      <div
        ref={modalRef}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 w-full max-w-[380px] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Pilules de sélection (Aller / Retour) style TrainNomad */}
        {!singleDate && (
          <div className="flex items-center gap-2 mb-5">
            <button
              onClick={() => setActiveTab('depart')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'depart'
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Aller : {tempDepart.toString()}
            </button>

            {tempReturn ? (
              <div
                onClick={() => setActiveTab('return')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                  activeTab === 'return'
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Retour : {tempReturn.toString()}</span>
                <button
                  onClick={handleClearReturn}
                  className="p-0.5 rounded-full hover:bg-white/20 transition-colors"
                >
                  <Cross2Icon className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('return')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border border-dashed ${
                  activeTab === 'return'
                    ? 'border-brand text-brand bg-tone-50/50'
                    : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                }`}
              >
                + Ajouter retour
              </button>
            )}
          </div>
        )}

        {/* Navigation Mois */}
        <div className="flex items-center justify-between mb-4 px-1">
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h3 className="text-base font-bold text-slate-800 capitalize">
            {monthName}
          </h3>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, i) => (
            <div key={i} className="text-center text-xs font-semibold text-slate-400 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="h-10 w-10" />;

            const disabled = isDisabled(date);
            const start = isStartDate(date);
            const end = isEndDate(date);
            const inRange = isInRange(date);
            const today = isToday(date);

            return (
              <button
                key={date.toString()}
                onClick={() => !disabled && handleDateClick(date)}
                disabled={disabled}
                className={`
                  h-10 w-10 rounded-xl text-xs font-semibold transition-all relative flex items-center justify-center mx-auto
                  ${disabled ? 'text-slate-300 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-100'}
                  ${start || end ? 'bg-brand text-white shadow-sm' : ''}
                  ${inRange ? 'bg-tone-50 text-brand font-bold' : ''}
                  ${!start && !end && !inRange && !disabled ? 'text-slate-700' : ''}
                  ${today && !start && !end ? 'ring-2 ring-brand ring-offset-1' : ''}
                `}
              >
                {date.day}
              </button>
            );
          })}
        </div>

        {/* Boutons d'action */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-brand text-white hover:bg-brand-dark transition-all shadow-md hover:shadow-lg"
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}