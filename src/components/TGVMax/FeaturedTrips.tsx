import { useEffect, useState } from 'react';
import CardTrajet from '../CardTrajets';
import { useNetwork } from '../../network/NetworkContext';
import type { FeaturedResponse, Journey } from '../../types/api';
import { WakeUpNotice } from '../WakeUpNotice';
import { formatDateShort } from '../../lib/format';

/** Trajets TGVmax du jour : tirés au sort par l'API (/featured) parmi les départs des prochains jours. */
export function FeaturedTrips() {
  const { api } = useNetwork();
  const [journeys, setJourneys] = useState<Journey[] | null>(null);
  const [days, setDays] = useState<FeaturedResponse['days']>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api
      .featuredTrips(controller.signal)
      .then((res) => {
        setJourneys(res.journeys ?? []);
        setDays(res.days ?? []);
      })
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') setFailed(true);
      });
    return () => controller.abort();
  }, [api]);

  // API injoignable ou aucun trajet : la section disparaît plutôt que d'afficher une erreur
  if (failed || (journeys && journeys.length === 0)) return null;

  return (
    <div className="bg-gradient-to-br from-[#f5f5f5] via-[#fafaf8] to-[#f0ebe5] py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
            Des places MAX disponibles sur les 30 prochains jours
          </h2>
          <p className="text-slate-600">
            En voici quelques-unes, tirées au sort chaque jour parmi les départs des trois prochains jours.
          </p>

          {/* Trains avec au moins une place MAX, jour par jour (absent si l'API ne le fournit pas) */}
          {days && days.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-3">
              {days.map((d) => (
                <li
                  key={d.date}
                  className="flex items-baseline gap-2 rounded-xl border border-[#F97316]/20 bg-white px-4 py-2.5 shadow-sm"
                >
                  <span className="text-sm font-medium text-slate-500 first-letter:uppercase">
                    {formatDateShort(d.date)}
                  </span>
                  <span className="text-lg font-bold text-[#F97316]">{d.trains}</span>
                  <span className="text-sm text-slate-600">train{d.trains > 1 ? 's' : ''} avec des places</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {journeys === null ? (
          <div className="flex flex-col items-center justify-center gap-6 py-16">
            <i className="fa-solid fa-circle-notch animate-spin text-[#F97316] text-3xl" />
            <WakeUpNotice loading />
          </div>
        ) : (
          <div className="space-y-4">
            {journeys.map((journey) => (
              <CardTrajet key={journey.id} journey={journey} />
            ))}
          </div>
        )}

        <p className="mt-6 text-xs text-slate-400 leading-relaxed">
          <i className="fa-solid fa-circle-info mr-1.5" />
          Les disponibilités proviennent de l'open data SNCF, mis à jour une fois par jour, le matin : une place peut être
          partie depuis. Les trains OUIGO ne figurent pas dans ces données et ne peuvent pas être affichés.
          Contient des données SNCF Voyageurs, disponibles sous licence ODbL.
        </p>
      </div>
    </div>
  );
}
