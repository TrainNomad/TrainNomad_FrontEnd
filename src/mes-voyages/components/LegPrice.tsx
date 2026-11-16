// Prix d'un trajet, saisi par l'utilisateur (payé ou estimé), dans sa devise. TrainNomad ne connaît pas les tarifs.
import { useState, type FormEvent } from 'react';
import { Euro, Pencil } from 'lucide-react';
import { updateLeg } from '../lib/api';
import { CURRENCIES, formatMoney, type Currency } from '../lib/currency';
import { errorMessage } from '../lib/errors';
import type { TripLeg } from '../lib/types';
import { Button, cx, inputClass, parseEuros } from '../ui';

export function LegPrice({ leg, onUpdated }: { leg: TripLeg; onUpdated: (leg: TripLeg) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(leg.price_amount != null ? String(leg.price_amount).replace('.', ',') : '');
  const [currency, setCurrency] = useState<Currency>((leg.price_currency as Currency) ?? 'EUR');
  const [kind, setKind] = useState<'paid' | 'estimated'>(leg.price_kind ?? 'estimated');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const amount = parseEuros(text);
    if (Number.isNaN(amount)) return setError('Prix invalide (exemple : 89,50).');
    setBusy(true);
    setError(null);
    try {
      onUpdated(await updateLeg(leg.id, { price_amount: amount, price_kind: amount === null ? null : kind, price_currency: currency }));
      setEditing(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return leg.price_amount != null ? (
      <button type="button" onClick={() => setEditing(true)} className="group inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
        {formatMoney(leg.price_amount, leg.price_currency)}
        <span className={cx('text-xs font-semibold', leg.price_kind === 'paid' ? 'text-brand' : 'text-slate-400')}>
          {leg.price_kind === 'paid' ? 'payé' : 'estimé'}
        </span>
        <Pencil className="w-3 h-3 text-slate-300 group-hover:text-slate-500" aria-label="Modifier le prix" />
      </button>
    ) : (
      <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand">
        <Euro className="w-3.5 h-3.5" aria-hidden />
        Ajouter le prix
      </button>
    );
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`price-${leg.id}`}>Prix</label>
      <input
        id={`price-${leg.id}`}
        autoFocus
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="89,50"
        className={cx(inputClass, 'w-28 py-1.5')}
      />
      <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={cx(inputClass, 'w-auto py-1.5')} aria-label="Devise">
        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={kind} onChange={(e) => setKind(e.target.value as 'paid' | 'estimated')} className={cx(inputClass, 'w-auto py-1.5')} aria-label="Type de prix">
        <option value="estimated">estimé</option>
        <option value="paid">payé</option>
      </select>
      <Button type="submit" size="sm" variant="primary" busy={busy}>Enregistrer</Button>
      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Annuler</Button>
      {error && <p className="w-full text-xs text-red-700">{error}</p>}
    </form>
  );
}
