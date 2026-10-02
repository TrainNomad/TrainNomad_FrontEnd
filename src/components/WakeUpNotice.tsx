import { useEffect, useState } from 'react';

/**
 * Message affiché quand un chargement dure : les API (offre gratuite Render) s'endorment après
 * 15 min sans visite et mettent jusqu'à une minute à redémarrer.
 */
export function WakeUpNotice({ loading, delayMs = 5000 }: { loading: boolean; delayMs?: number }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const timer = window.setTimeout(() => setSlow(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [loading, delayMs]);

  if (!slow) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <i className="fa-solid fa-mug-hot flex-shrink-0" />
      <span>Le serveur se réveille, cela peut prendre jusqu'à une minute lors de la première recherche…</span>
    </div>
  );
}
