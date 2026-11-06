import { useState } from 'react';
import { Ship } from 'lucide-react';
import { isFerry, trainLogo } from '../lib/trainLogos';

interface Props {
  trainType: string;
  operator?: string;
  className?: string;
  /** Sans logo disponible : afficher le nom du train (par défaut) ou rien */
  textFallback?: boolean;
}

/** Logo du train, ou son nom en texte si aucun logo n'est disponible. Traversée en ferry sans logo de compagnie :
 *  icône de bateau devant le nom. */
export function TrainLogo({ trainType, operator, className = 'h-5', textFallback = true }: Props) {
  const [failed, setFailed] = useState(false);
  const src = trainLogo(trainType, operator);

  if ((!src || failed) && isFerry(trainType, operator)) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-sky-700" title={trainType}>
        <Ship className="h-4 w-4 shrink-0" aria-hidden="true" />
        {textFallback && trainType}
      </span>
    );
  }
  if (!src || failed) {
    return textFallback ? (
      <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{trainType}</span>
    ) : null;
  }
  return <img src={src} alt={trainType} title={trainType} className={`${className} object-contain`} onError={() => setFailed(true)} />;
}
