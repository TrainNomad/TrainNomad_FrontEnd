import { useEffect, useState } from 'react';

/** Message affiché quand un chargement dure (API en cours de redémarrage, réseau lent). */
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
      <span>La recherche prend plus de temps que prévu, merci de patienter…</span>
    </div>
  );
}
