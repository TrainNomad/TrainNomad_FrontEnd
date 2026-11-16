// « Actualiser la recherche » d'un trajet enregistré : relance la recherche du même jour, indique si le train
// enregistré est toujours proposé (et si ses horaires ont changé), et propose les résultats du moment.
// Rien n'est remplacé sans confirmation : par défaut, l'itinéraire enregistré est conservé.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, RefreshCw, TriangleAlert } from 'lucide-react';
import { createApiClient } from '../../services/api';
import { NETWORKS } from '../../network/networks';
import { formatDuration, formatTime } from '../../lib/format';
import { isTrainLeg, type Journey } from '../../types/api';
import { journeyFields, legSearchUrl, trainSignature } from '../lib/itinerary';
import { updateLeg } from '../lib/api';
import { errorMessage } from '../lib/errors';
import type { TripLeg } from '../lib/types';
import { Alert, Button, ConfirmButton, Spinner } from '../ui';

type Match =
  | { kind: 'same'; journey: Journey }
  | { kind: 'changed'; journey: Journey }
  | { kind: 'missing' };

function compare(saved: Journey | null, results: Journey[]): Match {
  if (!saved) return { kind: 'missing' };
  const signature = trainSignature(saved);
  const found = results.find((j) => signature !== '' && trainSignature(j) === signature);
  if (!found) return { kind: 'missing' };
  return found.departure === saved.departure && found.arrival === saved.arrival ? { kind: 'same', journey: found } : { kind: 'changed', journey: found };
}

function ResultRow({ journey, onKeep, current }: { journey: Journey; onKeep: () => Promise<void>; current: boolean }) {
  const trains = journey.legs.filter(isTrainLeg);
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="font-bold text-slate-900 tabular-nums">
          {formatTime(journey.departure)} → {formatTime(journey.arrival)}
          <span className="ml-2 text-xs font-semibold text-slate-500">
            {formatDuration(journey.duration_min)} · {journey.transfers === 0 ? 'direct' : `${journey.transfers} corresp.`}
          </span>
        </div>
        <div className="text-xs text-slate-500 break-words">{trains.map((t) => `${t.train_type} ${t.train_number}`.trim()).join(' · ')}</div>
      </div>
      {current ? (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-brand">
          <Check className="w-3.5 h-3.5" aria-hidden />
          Enregistré
        </span>
      ) : (
        <ConfirmButton label="Garder celui-ci" confirmLabel="Remplacer l'itinéraire enregistré ?" onConfirm={onKeep} />
      )}
    </li>
  );
}

export function RefreshPanel({ leg, onReplaced, onClose }: { leg: TripLeg; onReplaced: (leg: TripLeg) => void; onClose: () => void }) {
  const [results, setResults] = useState<Journey[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const params = leg.search_params!;
  const network = leg.network ?? 'europe';
  const saved = leg.itinerary_snapshot;

  useEffect(() => {
    let active = true;
    createApiClient(NETWORKS[network].apiUrl)
      .searchTrips({ from: params.departure, to: params.arrival, date: params.date, time: params.departure_time ?? '02:00', limit: 10 })
      // seuls les départs du jour demandé (l'API peut compléter avec le lendemain)
      .then((data) => active && setResults(data.journeys.filter((j) => j.departure.slice(0, 10) === params.date)))
      .catch(() => active && setError('La recherche n’a pas pu être relancée. Réessayez dans un instant.'));
    return () => {
      active = false;
    };
  }, [network, params.departure, params.arrival, params.date, params.departure_time]);

  const keep = async (journey: Journey) => {
    try {
      onReplaced(await updateLeg(leg.id, journeyFields(journey, new Date().toISOString())));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const match = results ? compare(saved, results) : null;

  return (
    <div className="border-t border-slate-100 px-4 sm:px-5 py-4 bg-slate-50/60 rounded-b-2xl">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
          <RefreshCw className="w-4 h-4 text-brand" aria-hidden />
          Résultats actuels
        </p>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Fermer
        </Button>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {!error && !results && (
        <div className="py-4 flex justify-center">
          <Spinner />
        </div>
      )}

      {match && (
        <div className="mb-3">
          {match.kind === 'same' && (
            <Alert tone="info">Le train enregistré est toujours proposé, aux mêmes horaires.</Alert>
          )}
          {match.kind === 'changed' && (
            <Alert tone="warning">
              Le train enregistré est toujours proposé, mais ses horaires ont changé : départ à {formatTime(match.journey.departure)}, arrivée à{' '}
              {formatTime(match.journey.arrival)}. Votre itinéraire enregistré n'a pas été modifié.
            </Alert>
          )}
          {match.kind === 'missing' && (
            <Alert tone="warning">
              Le train enregistré n'apparaît pas dans les résultats actuels. Votre itinéraire enregistré est conservé ; vérifiez
              auprès de la compagnie avant de partir.
            </Alert>
          )}
        </div>
      )}

      {results && results.length === 0 && (
        <p className="text-sm text-slate-600">
          Aucun résultat pour cette date dans les horaires actuellement disponibles.
        </p>
      )}

      {results && results.length > 0 && (
        <ul className="divide-y divide-slate-200">
          {results.slice(0, 6).map((j) => (
            <ResultRow
              key={j.id}
              journey={j}
              current={match?.kind === 'same' && match.journey.id === j.id}
              onKeep={() => keep(j)}
            />
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <Link to={legSearchUrl(leg.network, params)} className="font-semibold text-slate-500 hover:text-brand underline">
          Voir tous les résultats sur la page Trajets
        </Link>
        {match?.kind !== 'same' && results && (
          <span className="inline-flex items-center gap-1 text-slate-500">
            <TriangleAlert className="w-3.5 h-3.5" aria-hidden />
            « Garder celui-ci » remplace l'itinéraire enregistré, après confirmation.
          </span>
        )}
      </div>
    </div>
  );
}
