import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NETWORKS } from '../network/networks';
import { createApiClient } from '../services/api';
import type { Journey } from '../types/api';
import { isTrainLeg } from '../types/api';
import { formatDateShort, formatTime } from '../lib/format';

const tgvmaxApi = createApiClient(NETWORKS.tgvmax.apiUrl);

/** Nombre de trajets affichés sur le ticket */
const TICKET_TRIPS = 3;

export function TGVMaxSection() {
  // Trajets TGVmax du jour (/featured) : mêmes données que la page TGVmax
  const [journeys, setJourneys] = useState<Journey[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    tgvmaxApi
      .featuredTrips(controller.signal)
      .then((res) => setJourneys((res.journeys ?? []).slice(0, TICKET_TRIPS)))
      .catch(() => {
        // API injoignable : le ticket n'est pas affiché
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#ea5541] text-white py-20 my-16 w-full">
      {/* Cercles décoratifs en arrière-plan à droite */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] rounded-full border-[60px] border-white/10 pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-[400px] h-[400px] rounded-full border-[40px] border-white/10 pointer-events-none" />

      {/* Le conteneur limite la largeur du texte et des éléments tout en les centrant */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Colonne gauche : Texte et Bouton */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            Les places à 0 € ne devraient jamais être un secret.
          </h2>

          <p className="text-white/90 text-lg max-w-xl leading-relaxed">
            Visualisez les disponibilités TGV Inoui et Intercités, repérez les créneaux intéressants et partez au bon moment avec votre abonnement MAX.
          </p>

          <div className="pt-4">
            <Link
              to="/tgvmax"
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-white text-[#ea5541] font-bold text-sm tracking-wide uppercase hover:bg-orange-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Voir les disponibilités
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Colonne droite : ticket des places MAX du jour */}
        {journeys.length > 0 && (
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md bg-[#f7f4ed] text-[#1A2B3C] p-7 pl-9 rounded-3xl shadow-xl transform lg:rotate-3 transition-all duration-300 ease-out hover:rotate-0 hover:-translate-y-2 hover:shadow-2xl">

              {/* Les encoches sur le bord gauche reprennent le fond orange */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col justify-between h-40 -translate-x-1/2 pointer-events-none">
                <div className="w-5 h-5 bg-[#ea5541] rounded-full" />
                <div className="w-5 h-5 bg-[#ea5541] rounded-full" />
                <div className="w-5 h-5 bg-[#ea5541] rounded-full" />
              </div>

              {/* Header du ticket */}
              <div className="flex items-center justify-between mb-6 border-b border-slate-200/80 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                    Mis à jour chaque matin
                  </span>
                  <h3 className="text-xl font-bold text-[#ea5541]">
                    Places repérées
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-orange-100 text-[#ea5541] text-[10px] font-extrabold tracking-wider uppercase">
                  MAX
                </span>
              </div>

              {/* Liste des trajets */}
              <div className="space-y-3 mb-6">
                {journeys.map((journey) => {
                  const train = journey.legs.find(isTrainLeg);
                  return (
                    <div key={journey.id} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/70 border border-slate-200/60 shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-bold text-lg text-slate-800">{formatTime(journey.departure)}</span>
                        <div className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-800 truncate">
                            {journey.from.city} → {journey.to.city}
                          </span>
                          <span className="block text-xs text-slate-400 font-medium truncate first-letter:uppercase">
                            {formatDateShort(journey.departure)}
                            {train && ` · train ${train.train_number}`}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-[#ea5541] text-base flex-shrink-0">0 €</span>
                    </div>
                  );
                })}
              </div>

              {/* Pied du ticket */}
              <Link
                to="/tgvmax"
                className="block w-full py-3 text-center border border-dashed border-[#ea5541]/40 text-[#ea5541] rounded-2xl text-[11px] font-extrabold uppercase tracking-wider hover:bg-[#ea5541]/10 transition-colors"
              >
                Rechercher d'autres disponibilités
              </Link>

            </div>
          </div>
        )}

      </div>
    </section>
  );
}