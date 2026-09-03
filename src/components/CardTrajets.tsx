import { useState } from 'react';
import { Stepper, StepperItem, StepperTrigger, StepperIndicator, StepperNav, StepperSeparator } from './ui/stepper';

interface CardTrajetProps {
  departTime?: string;
  arrivalTime?: string;
  departureCity?: string;
  arrivalCity?: string;
  duration?: string;
  trainName?: string; 
  trainNumber?: string;
  date?: string;
  isDirect?: boolean;
  transfersCount?: number;
  // Propriétés des correspondances
  transferStation?: string | null;
  train1Arr?: string | null; // Heure d'arrivée précise du premier train à la correspondance
  train2Name?: string | null;
  train2Number?: string | null;
  train2Dep?: string | null;  
  train2Arr?: string | null;
  layoverMinutes?: number;    
}

export default function CardTrajet({
  departTime = "05h33",
  arrivalTime = "07h45",
  departureCity = "Rennes",
  arrivalCity = "Paris Montparnasse",
  duration = "2h12",
  trainName = "TGV_InOui",
  trainNumber = "8072",
  date = "31 Août 2026",
  isDirect = true,
  transfersCount = 1,
  transferStation = null,
  train1Arr = "7h12",
  train2Name = null,
  train2Number = null,
  train2Dep = null,
  // train2Arr = null,
  layoverMinutes = 20,
}: CardTrajetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fonction robuste pour charger le logo depuis /assets/compagnies/
  const getTrainLogoPath = (name?: string) => {
     
    
    return `/assets/compagnies/${name}.png`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all w-full max-w-[80rem] mx-auto">
      
      {/* En-tête de la carte */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {isDirect ? (
            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Direct
            </span>
          ) : (
            <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {transfersCount} correspondance(s)
            </span>
          )}
          <span className="text-xs font-medium text-slate-400">{date}</span>
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

      {/* Corps principal (Version réduite / standard) */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        
        {/* Départ */}
        <div className="text-left min-w-[140px]">
          <div className="text-3xl font-extrabold text-slate-900">{departTime}</div>
          <div className="text-sm font-semibold text-slate-800">{departureCity}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Départ</div>
        </div>

        {/* Ligne visuelle du trajet */}
        <div className="flex-1 flex flex-col items-center px-4 w-full max-w-md">
          <span className="text-xs font-medium text-slate-500 mb-1.5">{duration}</span>
          <div className="w-full flex items-center relative">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-white z-10"></div>
            <div className="flex-1 h-0.5 bg-emerald-300 mx-[-2px]"></div>
            <div className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-emerald-500 z-10"></div>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mt-1.5">
            {isDirect ? 'Sans changement' : 'Avec correspondance'}
          </span>
        </div>

        {/* Arrivée */}
        <div className="text-right min-w-[140px]">
          <div className="text-3xl font-extrabold text-slate-900">{arrivalTime}</div>
          <div className="text-sm font-semibold text-slate-800">{arrivalCity}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Arrivée</div>
        </div>

        {/* Logo compagnie & Numéro de train + Bouton Choisir */}
        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <div className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl flex items-center gap-3">
            <img 
              src={getTrainLogoPath(trainName)} 
              alt={trainName} 
              className="h-5 object-contain"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <span className="text-xs font-bold text-slate-700">N° {trainNumber}</span>
          </div>

          <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer">
            Choisir <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
        </div>

      </div>

      {/* SECTION DÉROULÉ DU TRAJET */}
      {isExpanded && (
        <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Déroulé du trajet</span>
            <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {isDirect ? '1 train' : `${transfersCount + 1} trains`}
            </span>
          </div>

          <Stepper defaultValue={1} orientation="vertical" className="relative flex flex-col gap-6">
            <StepperNav className="relative flex flex-col gap-0 w-full">
              
              {/* ÉTAPE 1 : DÉPART */}
              <StepperItem step={1} className="relative items-start not-last:flex-1 pb-6">
                <StepperTrigger className="items-start gap-4 cursor-default pointer-events-none w-full">
                  <StepperIndicator className="bg-emerald-500 text-white size-6 text-xs z-10">1</StepperIndicator>
                  <div className="text-left flex-1">
                    <div className="text-sm font-extrabold text-slate-900">{departTime} — {departureCity}</div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Départ</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-600">Train N° {trainNumber}</span>
                    </div>
                  </div>
                  <img 
                    src={getTrainLogoPath(trainName)} 
                    alt={trainName} 
                    className="h-5 object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </StepperTrigger>
                <StepperSeparator className="absolute left-[11px] top-7 bottom-0 w-0.5 bg-slate-200 m-0 -translate-x-1/2" />
              </StepperItem>

              {/* SI CORRESPONDANCE */}
              {!isDirect && transferStation && (
                <>
                  {/* ARRIVÉE EN GARE DE CORRESPONDANCE (Utilisation de train1Arr) */}
                  <StepperItem step={2} className="relative items-start not-last:flex-1 pb-6">
                    <StepperTrigger className="items-start gap-4 cursor-default pointer-events-none w-full">
                      <StepperIndicator className="bg-amber-500 text-white size-6 text-xs z-10">!</StepperIndicator>
                      <div className="text-left flex-1">
                        <div className="text-sm font-extrabold text-amber-600">
                          {train1Arr ? `${train1Arr} — ` : ''}Arrivée à {transferStation}
                        </div>
                        <div className="text-xs text-amber-600/80 mt-0.5 font-medium">
                          Correspondance • Temps d'attente : {layoverMinutes} min
                        </div>
                      </div>
                    </StepperTrigger>
                    <StepperSeparator className="absolute left-[11px] top-7 bottom-0 w-0.5 bg-slate-200 m-0 -translate-x-1/2" />
                  </StepperItem>

                  {/* DÉPART DU SECOND TRAIN DEPUIS LA GARE DE CORRESPONDANCE */}
                  <StepperItem step={3} className="relative items-start not-last:flex-1 pb-6">
                    <StepperTrigger className="items-start gap-4 cursor-default pointer-events-none w-full">
                      <StepperIndicator className="bg-amber-500 text-white size-6 text-xs z-10">2</StepperIndicator>
                      <div className="text-left flex-1">
                        <div className="text-sm font-extrabold text-amber-600">{train2Dep} — Départ de {transferStation}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          <span className="font-semibold text-slate-600">Train N° {train2Number}</span>
                        </div>
                      </div>
                      <img 
                        src={getTrainLogoPath(train2Name || '')} 
                        alt={train2Name || ''} 
                        className="h-5 object-contain"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    </StepperTrigger>
                    <StepperSeparator className="absolute left-[11px] top-7 bottom-0 w-0.5 bg-slate-200 m-0 -translate-x-1/2" />
                  </StepperItem>
                </>
              )}

              {/* ÉTAPE FINALE : ARRIVÉE */}
              <StepperItem step={isDirect ? 2 : 4} className="relative items-start not-last:flex-1">
                <StepperTrigger className="items-start gap-4 cursor-default pointer-events-none w-full">
                  <StepperIndicator className="bg-slate-900 text-white size-6 text-xs z-10">🏁</StepperIndicator>
                  <div className="text-left flex-1">
                    <div className="text-sm font-extrabold text-slate-900">{arrivalTime} — {arrivalCity}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Arrivée finale (Durée totale : {duration})</div>
                  </div>
                </StepperTrigger>
              </StepperItem>

            </StepperNav>
          </Stepper>

        </div>
      )}

    </div>
  );
}