import { useState } from 'react';
import { trainLogo } from '../lib/trainLogos';

interface Props {
  trainType: string;
  operator?: string;
  className?: string;
  /** Sans logo disponible : afficher le nom du train (par défaut) ou rien */
  textFallback?: boolean;
}

/** Logo du train, ou son nom en texte si aucun logo n'est disponible. */
export function TrainLogo({ trainType, operator, className = 'h-5', textFallback = true }: Props) {
  const [failed, setFailed] = useState(false);
  const src = trainLogo(trainType, operator);

  if (!src || failed) {
    return textFallback ? (
      <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{trainType}</span>
    ) : null;
  }
  return <img src={src} alt={trainType} title={trainType} className={`${className} object-contain`} onError={() => setFailed(true)} />;
}
