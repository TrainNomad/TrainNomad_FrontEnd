// Empreinte carbone du voyage : somme des trajets issus d'une recherche (même calcul que la page Voyage :
// estimation immédiate, puis distance mesurée sur les voies), comparée à la voiture ou à l'avion.
import { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';
import { estimateCarbon, estimateCarbonOnTracks, formatKg, type CarbonEstimate } from '../../lib/carbon';
import type { Journey } from '../../types/api';
import { Card } from '../ui';

export function CarbonSummary({ journeys, manualCount }: { journeys: Journey[]; manualCount: number }) {
  const [estimates, setEstimates] = useState<CarbonEstimate[]>([]);

  useEffect(() => {
    setEstimates(journeys.map(estimateCarbon).filter((c): c is CarbonEstimate => c !== null));
    let active = true;
    Promise.all(journeys.map(estimateCarbonOnTracks))
      .then((list) => active && setEstimates(list.filter((c): c is CarbonEstimate => c !== null)))
      .catch(() => {
        // tracés indisponibles : on garde l'estimation immédiate
      });
    return () => {
      active = false;
    };
  }, [journeys]);

  if (estimates.length === 0) return null;
  const trainKg = estimates.reduce((s, c) => s + c.trainKg, 0);
  const otherKg = estimates.reduce((s, c) => s + c.otherKg, 0);
  const byPlane = estimates.some((c) => c.other === 'plane');
  const ratio = trainKg > 0 ? Math.round(otherKg / trainKg) : null;

  return (
    <Card className="p-5 flex flex-wrap items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
        <Leaf className="w-5 h-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-500">Empreinte carbone en train</p>
        <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{formatKg(trainKg)} CO₂e</p>
        <p className="text-sm text-slate-600">
          contre {formatKg(otherKg)} {byPlane ? "en avion (ou en voiture pour les plus courts trajets)" : 'en voiture'}
          {ratio && ratio > 1 && <strong className="text-brand"> · {ratio} fois moins</strong>}
        </p>
        {manualCount > 0 && (
          <p className="text-xs text-slate-400 mt-1">
            {manualCount} trajet{manualCount > 1 ? 's' : ''} saisi{manualCount > 1 ? 's' : ''} à la main non compté{manualCount > 1 ? 's' : ''}.
          </p>
        )}
      </div>
    </Card>
  );
}
