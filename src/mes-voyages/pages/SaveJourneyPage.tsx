// /mes-voyages/enregistrer?voyage=<id local>
// Cible du bouton « Enregistrer ce trajet ». Un visiteur non connecté passe d'abord par la connexion (RequireAuth) :
// l'adresse, donc le trajet choisi, est conservée, et l'enregistrement se fait au retour. Le trajet lui-même reste
// dans le navigateur (src/lib/voyages.ts) pendant la connexion.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getVoyage } from '../../lib/voyages';
import { errorMessage } from '../lib/errors';
import { saveJourney } from '../lib/saveJourney';
import { track } from '../../lib/analytics';
import { Alert, Button, PageLoader, PageShell } from '../ui';

export default function SaveJourneyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const voyage = useMemo(() => getVoyage(params.get('voyage') ?? ''), [params]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!voyage) return;
    let active = true;
    setError(null);
    saveJourney(voyage)
      .then(({ tripId, already, addedToProject }) => {
        if (!active) return;
        if (!already) {
          track('enregistrement-trajet', {
            dans: addedToProject ? 'projet' : 'nouveau-voyage',
            de: voyage.outbound.from.name,
            vers: voyage.outbound.to.name,
          });
        }
        navigate(`/mes-voyages/voyage/${tripId}?${already ? 'deja' : addedToProject ? 'ajoute' : 'enregistre'}=1`, { replace: true });
      })
      .catch((err) => active && setError(errorMessage(err)));
    return () => {
      active = false;
    };
  }, [voyage, attempt, navigate]);

  if (!voyage) {
    return (
      <PageShell title="Enregistrer ce trajet" back={{ to: '/mes-voyages', label: 'Mes voyages' }}>
        <Alert tone="warning">
          Ce trajet n'est plus disponible dans ce navigateur. Retrouvez-le depuis la{' '}
          <Link to="/trajets" className="underline">page Trajets</Link>, puis enregistrez-le de nouveau.
        </Alert>
      </PageShell>
    );
  }
  if (!error) return <PageLoader />;
  return (
    <PageShell title="Enregistrer ce trajet" back={{ to: '/mes-voyages', label: 'Mes voyages' }}>
      <div className="flex flex-col gap-4 max-w-xl">
        <Alert tone="error">{error}</Alert>
        <div>
          <Button variant="primary" onClick={() => setAttempt((n) => n + 1)}>
            Réessayer
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
