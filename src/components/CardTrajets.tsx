import { useState } from 'react';
import type { Journey } from '../types/api';
import { isSeatChange, isTrainLeg } from '../types/api';
import { useNetwork } from '../network/NetworkContext';
import { dayOffset, formatDate, formatDuration, formatTime } from '../lib/format';
import { JourneySteps } from './JourneySteps';
import { TrainLogo } from './TrainLogo';

/** Bloc de droite (logos des trains et bouton « Choisir ») : à réactiver avec les prix et la réservation. */
const SHOW_BOOKING = false;

interface CardTrajetProps {
  journey: Journey;
}

export default function CardTrajet({ journey }: CardTrajetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { network } = useNetwork();

  const trains = journey.legs.filter(isTrainLeg);
  const isDirect = journey.transfers === 0;
  const seatChanges = journey.seat_changes ?? 0;
  // Gares intermédiaires : correspondance classique ou changement de siège (TGVmax, même train)
  const via = journey.legs
    .filter((l) => l.type === 'transfer')
    .map((l) => ({ name: l.from.name, seat: isSeatChange(l) }));
  const viaLabel = via.map((v) => (v.seat ? `${v.name} (changement de siège)` : v.name)).join(', ');
  const arrivalOffset = dayOffset(journey.departure, journey.arrival);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all w-full max-w-[80rem] mx-auto">

      {/* En-tête de la carte */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {network.badge && (
            <span className="bg-brand text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase">
              {network.badge}
            </span>
          )}
          {isDirect ? (
            <span className="bg-tone-50 text-tone-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-tone-500"></span> Direct
            </span>
          ) : (
            <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              {journey.transfers} correspondance{journey.transfers > 1 ? 's' : ''}
              {/* « 1 correspondance · changement de siège » / « 2 correspondances · dont 1 changement de siège » */}
              {seatChanges > 0 &&
                (seatChanges === journey.transfers
                  ? ` · changement${seatChanges > 1 ? 's' : ''} de siège`
                  : ` · dont ${seatChanges} changement${seatChanges > 1 ? 's' : ''} de siège`)}
            </span>
          )}
          <span className="text-xs font-medium text-slate-400 first-letter:uppercase">{formatDate(journey.departure)}</span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
        >
          {isExpanded ? 'Réduire' : 'Détailler'}
          <span className={`material-symbols-outlined text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>
      </div>

      {/* Corps principal (version réduite) */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">

        {/* Départ */}
        <div className="text-left min-w-[140px]">
          <div className="text-3xl font-extrabold text-slate-900">{formatTime(journey.departure, 'h')}</div>
          <div className="text-sm font-semibold text-slate-800">{journey.from.name}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Départ</div>
        </div>

        {/* Ligne visuelle du trajet : un point par gare de correspondance */}
        <div className="flex-1 flex flex-col items-center px-4 w-full max-w-md">
          <span className="text-xs font-medium text-slate-500 mb-1.5">{formatDuration(journey.duration_min)}</span>
          <div className="w-full flex items-center relative">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-tone-500 bg-white z-10"></div>
            {via.map((v, i) => (
              <div key={i} className="flex-1 flex items-center">
                <div className="flex-1 h-0.5 bg-tone-300"></div>
                <div
                  title={v.seat ? `${v.name} : changement de siège` : v.name}
                  className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 bg-white z-10"
                ></div>
              </div>
            ))}
            <div className="flex-1 h-0.5 bg-tone-300"></div>
            <div className="w-2.5 h-2.5 rounded-full border-2 border-tone-500 bg-tone-500 z-10"></div>
          </div>
          <span className="text-[11px] font-bold text-tone-600 uppercase tracking-wider mt-1.5 text-center">
            {isDirect ? 'Sans changement' : `Via ${viaLabel}`}
          </span>
        </div>

        {/* Arrivée */}
        <div className="text-right min-w-[140px]">
          <div className="text-3xl font-extrabold text-slate-900">
            {formatTime(journey.arrival, 'h')}
            {arrivalOffset > 0 && (
              <sup className="ml-1 text-xs font-bold text-amber-600" title="Arrivée un jour suivant">
                +{arrivalOffset}j
              </sup>
            )}
          </div>
          <div className="text-sm font-semibold text-slate-800">{journey.to.name}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Arrivée</div>
        </div>

        {/* Trains & bouton Choisir : masqués tant qu'il n'y a ni prix ni lien de réservation */}
        {SHOW_BOOKING && <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl flex flex-col gap-1.5">
            {trains.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <TrainLogo trainType={t.train_type} operator={t.operator} />
                <span className="text-xs font-bold text-slate-700">N° {t.train_number}</span>
              </div>
            ))}
          </div>

          <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer">
            Choisir <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>}
      </div>

      {/* Déroulé détaillé */}
      {isExpanded && <JourneySteps journey={journey} />}
    </div>
  );
}
