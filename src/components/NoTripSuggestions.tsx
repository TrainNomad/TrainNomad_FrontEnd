import { useEffect, useState } from 'react';
import { useNetwork } from '../network/NetworkContext';
import { track } from '../lib/analytics';
import { formatDateShort } from '../lib/format';

/** Jours regardés autour de la date sans résultat (avant et après). */
const AROUND = 3;
/** Au-delà, on affiche « 20+ » : l'API ne renvoie pas plus de trajets par appel. */
const LIMIT = 20;

interface Props {
  /** Départ et arrivée tels qu'envoyés à l'API (id ou nom) */
  origin: string;
  destination: string;
  originName: string;
  destinationName: string;
  /** Date cherchée (YYYY-MM-DD) ; vide = aujourd'hui */
  date: string;
  onPickDate: (date: string) => void;
}

interface DayResult {
  date: string;
  count: number;
}

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
}

/** Heure actuelle à Paris (HH:MM) : le jour même, on ne compte pas les trains déjà partis. */
function nowTime(): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).format(new Date());
}

/**
 * Recherche sans résultat : propose les jours voisins qui ont des trajets, et la carte des destinations
 * ouvertes depuis la même gare ce jour-là, au lieu de laisser le visiteur tout ressaisir.
 */
export function NoTripSuggestions({ origin, destination, originName, destinationName, date: rawDate, onPickDate }: Props) {
  const { api, network } = useNetwork();
  const date = rawDate || todayIso();
  const [days, setDays] = useState<DayResult[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const today = todayIso();
    const dates: string[] = [];
    for (let i = -AROUND; i <= AROUND; i++) {
      const d = addDays(date, i);
      if (i !== 0 && d >= today) dates.push(d);
    }

    Promise.all(
      dates.map((d) =>
        api
          .searchTrips({ from: origin, to: destination, date: d, time: d === today ? nowTime() : '00:00', limit: LIMIT })
          .then((res) => ({ date: d, count: res.journeys.filter((j) => j.departure.startsWith(d)).length }))
          // date hors de la période couverte, serveur en veille… : ce jour n'est simplement pas proposé
          .catch(() => ({ date: d, count: 0 })),
      ),
    ).then((results) => {
      if (cancelled) return;
      const found = results.filter((r) => r.count > 0);
      setDays(found);
      track('recherche-vide', {
        reseau: network.id,
        de: originName,
        vers: destinationName,
        jours_proches: found.length,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [api, network.id, origin, destination, originName, destinationName, date]);

  const explorerParams = new URLSearchParams({ from: origin, from_name: originName, date });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center">
      <span className="material-symbols-outlined text-5xl text-slate-300 block mb-4">train</span>
      <p className="text-slate-600 font-medium">
        {network.texts.noTrip}
        <span className="block text-sm font-normal text-slate-400 mt-1">
          {originName} → {destinationName}, <span className="whitespace-nowrap">{formatDateShort(date)}</span>
        </span>
      </p>

      <div className="mt-8">
        {days === null ? (
          <p className="text-sm text-slate-400">Recherche des jours voisins…</p>
        ) : days.length > 0 ? (
          <>
            <p className="text-sm font-semibold text-slate-700 mb-3">Sur le même trajet, des trajets existent&nbsp;:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {days.map((d) => (
                <button
                  key={d.date}
                  onClick={() => {
                    track('clic-jour-proche', { reseau: network.id, de: originName, vers: destinationName });
                    onPickDate(d.date);
                  }}
                  className="rounded-xl border border-brand/30 bg-white px-4 py-2 text-sm shadow-sm hover:border-brand hover:bg-brand/5 transition-colors"
                >
                  <span className="inline-block font-semibold text-slate-800 first-letter:uppercase">{formatDateShort(d.date)}</span>
                  <span className="ml-2 font-bold text-brand">
                    {d.count >= LIMIT ? `${LIMIT}+` : d.count} trajet{d.count > 1 ? 's' : ''}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">
            Rien non plus dans les {AROUND} jours avant et après. Essayez une gare voisine ou une autre destination.
          </p>
        )}
      </div>

      <a
        href={`${network.paths.explorer}?${explorerParams.toString()}`}
        className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-brand hover:text-brand-dark transition-colors"
      >
        <span className="material-symbols-outlined text-lg">explore</span>
        Voir toutes les destinations ouvertes depuis {originName} ce jour-là
      </a>
    </div>
  );
}
