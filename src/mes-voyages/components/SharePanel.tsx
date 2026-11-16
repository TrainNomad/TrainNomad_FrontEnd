// Partager un voyage en lecture seule : un lien secret à envoyer à ses compagnons de voyage. Il montre le titre,
// les dates et les trajets ; jamais les notes, les prix ni l'identité du propriétaire. Désactivable à tout moment.
import { useState } from 'react';
import { Check, Copy, Link2, Link2Off, RefreshCw, Share2 } from 'lucide-react';
import { disableSharing, enableSharing, shareUrl } from '../lib/api';
import { errorMessage } from '../lib/errors';
import type { Trip } from '../lib/types';
import { Alert, Button, Card, inputClass } from '../ui';

export function SharePanel({ trip, onTripChange, onClose }: { trip: Trip; onTripChange: (t: Trip) => void; onClose: () => void }) {
  const [busy, setBusy] = useState<'on' | 'off' | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = trip.share_token ? shareUrl(trip.share_token) : null;

  const act = async (kind: 'on' | 'off') => {
    setBusy(kind);
    setError(null);
    try {
      onTripChange(kind === 'on' ? await enableSharing(trip.id) : await disableSharing(trip.id));
      setCopied(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Copie impossible : sélectionnez le lien et copiez-le à la main.');
    }
  };

  const nativeShare = async () => {
    if (!url || !navigator.share) return;
    try {
      await navigator.share({ title: trip.title, text: `Mon voyage en train : ${trip.title}`, url });
    } catch {
      // partage annulé
    }
  };

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 font-bold text-slate-900">
            <Share2 className="w-4 h-4 text-brand" aria-hidden />
            Partager ce voyage
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Toute personne qui a le lien voit le titre, les dates et les trajets, sans compte. Les notes, les prix et votre nom
            ne sont jamais partagés.
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>Fermer</Button>
      </div>

      {url ? (
        <>
          <div className="flex gap-2">
            <label htmlFor={`share-${trip.id}`} className="sr-only">Lien de partage</label>
            <input id={`share-${trip.id}`} readOnly value={url} onFocus={(e) => e.target.select()} className={`${inputClass} font-mono text-xs`} />
            <Button variant="primary" onClick={copy}>
              {copied ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
              {copied ? 'Copié' : 'Copier'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {typeof navigator.share === 'function' && (
              <Button size="sm" onClick={nativeShare}>
                <Share2 className="w-3.5 h-3.5" aria-hidden />
                Envoyer…
              </Button>
            )}
            <Button size="sm" variant="ghost" busy={busy === 'on'} onClick={() => act('on')} title="L'ancien lien ne fonctionnera plus">
              <RefreshCw className="w-3.5 h-3.5" aria-hidden />
              Nouveau lien
            </Button>
            <Button size="sm" variant="danger" busy={busy === 'off'} onClick={() => act('off')}>
              <Link2Off className="w-3.5 h-3.5" aria-hidden />
              Arrêter le partage
            </Button>
          </div>
        </>
      ) : (
        <div>
          <Button variant="primary" busy={busy === 'on'} onClick={() => act('on')}>
            <Link2 className="w-4 h-4" aria-hidden />
            Créer un lien de partage
          </Button>
        </div>
      )}
      {error && <Alert tone="error">{error}</Alert>}
    </Card>
  );
}
