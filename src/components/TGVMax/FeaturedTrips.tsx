import { useEffect, useState } from 'react';
import CardTrajet from '../CardTrajets';
import { useNetwork } from '../../network/NetworkContext';
import type { Journey } from '../../types/api';
import { WakeUpNotice } from '../WakeUpNotice';

/** Trajets TGVmax du jour : tirés au sort par l'API (/featured) parmi les départs des prochains jours. */
export function FeaturedTrips() {
  const { api } = useNetwork();
  const [journeys, setJourneys] = useState<Journey[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api
      .featuredTrips(controller.signal)
      .then((res) => setJourneys(res.journeys ?? []))
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
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">Envie de partir ?</h2>
          <p className="text-slate-600">
            Chaque jour, des trajets tirés au sort parmi les places MAX disponibles dans les trois prochains jours.
          </p>
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
