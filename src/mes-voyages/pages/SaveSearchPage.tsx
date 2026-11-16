// /mes-voyages/sauvegarder?departure=…&arrival=…&date=…  (mêmes paramètres que la page Trajets)
// Enregistre une recherche à l'identique. Rien n'est écrit sans clic : recharger la page ne crée pas de doublon.
// Visiteur non connecté : RequireAuth le fait se connecter puis le ramène ici avec les mêmes paramètres.
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bookmark, Check } from 'lucide-react';
import { createSavedSearch } from '../lib/api';
import { track } from '../../lib/analytics';
import { errorMessage } from '../lib/errors';
import { savedSearchFromParams, savedSearchUrl } from '../lib/itinerary';
import type { SavedSearch } from '../lib/types';
import { Alert, Button, buttonClass, Card, Field, formatDay, inputClass, PageShell } from '../ui';

export default function SaveSearchPage() {
  const [params] = useSearchParams();
  const input = useMemo(() => savedSearchFromParams(params), [params]);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedSearch | null>(null);

  if (!input) {
    return (
      <PageShell title="Sauvegarder une recherche" back={{ to: '/mes-voyages', label: 'Mes voyages' }}>
        <Alert tone="warning">Cette recherche est incomplète (départ ou arrivée manquant). Relancez-la depuis la page Trajets.</Alert>
      </PageShell>
    );
  }

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      setSaved(await createSavedSearch({ ...input, label: label.trim() || null }));
      track('sauvegarde-recherche', { de: input.origin_name, vers: input.destination_name });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const details = [
    input.travel_date ? formatDay(input.travel_date) : 'Date libre',
    input.return_date && `retour ${formatDay(input.return_date)}`,
    input.departure_time_preference && `départ après ${input.departure_time_preference}`,
    input.filters.max_transfers === '0' ? 'direct uniquement' : input.filters.max_transfers && `${input.filters.max_transfers} correspondance(s) max.`,
    input.filters.train_types,
    input.filters.long_wait === '0' && 'sans nuit en gare',
    input.network === 'tgvmax' && 'TGVmax',
  ].filter(Boolean);

  return (
    <PageShell title="Sauvegarder cette recherche" back={{ to: '/mes-voyages', label: 'Mes voyages' }}>
      <Card className="p-5 sm:p-6 max-w-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
            <Bookmark className="w-5 h-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-slate-900 break-words">
              {input.origin_name} → {input.destination_name}
            </p>
            <p className="text-sm text-slate-500">{details.join(' · ')}</p>
          </div>
        </div>

        {saved ? (
          <div className="mt-5 flex flex-col gap-4">
            <Alert tone="info">
              <span className="inline-flex items-center gap-1.5 font-bold"><Check className="w-4 h-4" aria-hidden /> Recherche sauvegardée.</span>{' '}
              Rouvrez-la quand vous voulez : elle sera relancée avec les horaires disponibles à ce moment-là.
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Link to="/mes-voyages" className={buttonClass('primary')}>Voir Mes voyages</Link>
              <Link to={savedSearchUrl(saved)} className={buttonClass('secondary')}>Revenir aux résultats</Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            <Field label="Nom (facultatif)" htmlFor="mv-save-label">
              <input id="mv-save-label" maxLength={120} value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} placeholder={`${input.origin_name} → ${input.destination_name}`} />
            </Field>
            {error && <Alert tone="error">{error}</Alert>}
            <Button variant="primary" busy={busy} onClick={save}>
              Sauvegarder
            </Button>
          </div>
        )}
      </Card>
    </PageShell>
  );
}
