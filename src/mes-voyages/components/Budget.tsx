// Budget du voyage : somme des prix saisis pour chaque trajet, et comparaison avec un pass Interrail
// (prix du pass et réservations obligatoires saisis par l'utilisateur depuis le site officiel).
import { useEffect, useState, type FormEvent } from 'react';
import { ExternalLink, Wallet } from 'lucide-react';
import { updateTripPass } from '../lib/api';
import { formatMoney, getRates, toEuros, type Rates } from '../lib/currency';
import { errorMessage } from '../lib/errors';
import { localDate } from '../lib/itinerary';
import type { Trip, TripLeg } from '../lib/types';
import { Alert, Button, Card, Field, formatEuros, inputClass, parseEuros } from '../ui';

const toText = (n: number | null) => (n != null ? String(n).replace('.', ',') : '');

export function Budget({ trip, legs, onTripChange }: { trip: Trip; legs: TripLeg[]; onTripChange: (t: Trip) => void }) {
  // Prix en devises étrangères : convertis en euros au taux de référence BCE du jour
  const [rates, setRates] = useState<Rates | null>(null);
  const [ratesFailed, setRatesFailed] = useState(false);
  const foreign = [...new Set(legs.filter((l) => l.price_amount != null && l.price_currency !== 'EUR').map((l) => l.price_currency))];
  useEffect(() => {
    if (foreign.length === 0) return;
    let active = true;
    getRates()
      .then((r) => active && setRates(r))
      .catch(() => active && setRatesFailed(true));
    return () => {
      active = false;
    };
  }, [foreign.length]);

  const converted = legs
    .filter((l) => l.price_amount != null)
    .map((l) => ({ leg: l, euros: toEuros(Number(l.price_amount), l.price_currency, rates) }));
  const priced = converted.filter((c) => c.euros != null).map((c) => c.leg);
  const unconverted = converted.filter((c) => c.euros == null).map((c) => c.leg);
  const missing = legs.length - converted.length;
  const total = converted.reduce((sum, c) => sum + (c.euros ?? 0), 0);
  const allPaid = priced.length > 0 && priced.every((l) => l.price_kind === 'paid');
  const travelDays = new Set(legs.map((l) => localDate(l.departure_local)).filter(Boolean)).size;

  const [pass, setPass] = useState(toText(trip.pass_price_amount));
  const [reservations, setReservations] = useState(toText(trip.pass_reservations_amount));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passTotal = trip.pass_price_amount != null ? Number(trip.pass_price_amount) + Number(trip.pass_reservations_amount ?? 0) : null;
  const diff = passTotal != null && priced.length > 0 ? total - passTotal : null;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const p = parseEuros(pass);
    const r = parseEuros(reservations);
    if (Number.isNaN(p) || Number.isNaN(r)) return setError('Montant invalide (exemple : 335 ou 23,50).');
    setBusy(true);
    setError(null);
    try {
      onTripChange(await updateTripPass(trip.id, { pass_price_amount: p, pass_reservations_amount: r }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5 flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
            <Wallet className="w-4 h-4 text-brand" aria-hidden />
            Billets {allPaid ? 'payés' : 'payés ou estimés'}
          </p>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{priced.length > 0 ? formatEuros(total) : '—'}</p>
        </div>
        <div className="text-xs text-slate-500 text-right space-y-1">
        <p>
          {legs.length === 0
            ? 'Ajoutez un trajet pour calculer le budget.'
            : missing > 0
              ? `${missing} trajet${missing > 1 ? 's' : ''} sans prix : utilisez « Ajouter le prix ».`
              : 'Tous les trajets ont un prix.'}
        </p>
        {foreign.length > 0 && rates && (
          <p>
            Montants en {foreign.join(', ')} convertis en euros au taux de référence BCE du{' '}
            {new Date(`${rates.date}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })} (indicatif).
          </p>
        )}
        {unconverted.length > 0 && (
          <p className="text-amber-700">
            {ratesFailed ? 'Taux de change indisponibles pour le moment : ' : 'Conversion en cours : '}
            {unconverted.map((l) => formatMoney(l.price_amount, l.price_currency)).join(', ')} non compté{unconverted.length > 1 ? 's' : ''} dans le total.
          </p>
        )}
        </div>
      </div>

      <form onSubmit={save} className="border-t border-slate-100 pt-4 flex flex-col gap-3">
        <p className="text-sm font-bold text-slate-900">Comparer avec un pass Interrail</p>
        <p className="text-xs text-slate-500">
          {travelDays > 0 && <>Ce voyage compte {travelDays} jour{travelDays > 1 ? 's' : ''} de train. </>}
          Relevez le prix du pass adapté et les réservations obligatoires (trains à grande vitesse, trains de nuit) sur le
          site officiel, puis saisissez-les ici.{' '}
          <a href="https://www.interrail.eu/fr" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold underline hover:text-brand">
            interrail.eu <ExternalLink className="w-3 h-3" aria-hidden />
          </a>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prix du pass (€)" htmlFor={`pass-${trip.id}`}>
            <input id={`pass-${trip.id}`} inputMode="decimal" value={pass} onChange={(e) => setPass(e.target.value)} className={inputClass} placeholder="335" />
          </Field>
          <Field label="Réservations en plus (€)" htmlFor={`resa-${trip.id}`}>
            <input id={`resa-${trip.id}`} inputMode="decimal" value={reservations} onChange={(e) => setReservations(e.target.value)} className={inputClass} placeholder="0" />
          </Field>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <div>
          <Button type="submit" size="sm" busy={busy}>Enregistrer et comparer</Button>
        </div>

        {passTotal != null && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm">
            <div className="flex justify-between gap-3"><span>Billets</span><strong className="tabular-nums">{priced.length > 0 ? formatEuros(total) : '—'}</strong></div>
            <div className="flex justify-between gap-3"><span>Pass + réservations</span><strong className="tabular-nums">{formatEuros(passTotal)}</strong></div>
            {diff != null && (
              <p className={`mt-2 font-bold ${diff > 0 ? 'text-brand' : 'text-slate-700'}`}>
                {diff > 0
                  ? `Le pass ferait économiser ${formatEuros(diff)}.`
                  : diff < 0
                    ? `Les billets coûtent ${formatEuros(-diff)} de moins que le pass.`
                    : 'Même prix dans les deux cas.'}
                {missing > 0 && <span className="block text-xs font-normal text-slate-500">Comparaison partielle : {missing} trajet{missing > 1 ? 's' : ''} sans prix.</span>}
              </p>
            )}
          </div>
        )}
        <p className="text-[11px] text-slate-400">
          Un pass Interrail est réservé aux résidents européens et ne couvre, dans votre pays de résidence, qu'un trajet aller
          et un trajet retour. Vérifiez les conditions sur le site officiel avant d'acheter.
        </p>
      </form>
    </Card>
  );
}
