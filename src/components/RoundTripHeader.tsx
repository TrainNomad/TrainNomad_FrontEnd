import type { Journey } from '../types/api';
import { formatDateShort, formatDuration, formatTime } from '../lib/format';

const STEPS = ['Aller', 'Retour', 'Mon voyage'];

/** Étapes d'un aller-retour : faites (coche), en cours (numéro sur fond plein), à venir. */
export function TripStepper({ step }: { step: 0 | 1 | 2 }) {
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-bold">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2 sm:gap-4">
          {i > 0 && <span className="w-4 sm:w-10 h-px bg-slate-300" aria-hidden="true" />}
          <span aria-current={i === step ? 'step' : undefined} className="flex items-center gap-2">
            <span
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                i === step
                  ? 'bg-brand text-white ring-4 ring-brand/15'
                  : i < step
                    ? 'bg-tone-50 text-tone-600 border border-tone-200'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i < step ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <span className={i <= step ? 'text-tone-600' : 'text-slate-400'}>{label}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

interface RoundTripHeaderProps {
  /** 0 : choix de l'aller, 1 : choix du retour */
  step: 0 | 1;
  /** Aller déjà choisi (étape du retour) */
  outbound: Journey | null;
  onEditOutbound: () => void;
}

/** Étapes d'un aller-retour sur la page Trajets, et rappel de l'aller choisi pendant le choix du retour. */
export function RoundTripHeader({ step, outbound, onEditOutbound }: RoundTripHeaderProps) {
  return (
    <div className="mb-4 space-y-4">
      <TripStepper step={step} />

      {step === 1 && outbound && (
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-tone-600">Aller choisi</span>
          <span className="text-sm text-slate-500 first-letter:uppercase">{formatDateShort(outbound.departure)}</span>
          <span className="text-sm font-bold text-slate-800">
            {formatTime(outbound.departure, 'h')} {outbound.from.name} → {formatTime(outbound.arrival, 'h')} {outbound.to.name}
          </span>
          <span className="text-xs text-slate-400">
            {formatDuration(outbound.duration_min)}
            {outbound.transfers > 0 && ` · ${outbound.transfers} correspondance${outbound.transfers > 1 ? 's' : ''}`}
          </span>
          <button onClick={onEditOutbound} className="ml-auto text-xs font-bold text-slate-500 hover:text-slate-800 underline">
            Modifier
          </button>
        </div>
      )}
    </div>
  );
}
