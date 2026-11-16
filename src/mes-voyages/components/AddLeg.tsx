// Ajout d'une étape : rechercher un train à une date (page Trajets), ou saisir un trajet à la main
// (train connu, billet déjà acheté ailleurs, horaires pas encore publiés).
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PenLine, Search } from 'lucide-react';
import { AutocompleteInput } from '../../components/AutocompleteInput';
import type { Place } from '../../types/api';
import { addLeg } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { defaultTimezone, searchUrl, TIMEZONES, validPlaceId, zonedToIso } from '../lib/itinerary';
import type { Trip, TripLeg } from '../lib/types';
import { Alert, Button, buttonClass, Field, inputClass, parseEuros } from '../ui';
import { PlacePicker } from './PlacePicker';
import { setTargetTrip } from '../target';
import { CURRENCIES, type Currency } from '../lib/currency';

/** Lieu choisi dans les suggestions, ou texte libre (étape manuelle) */
interface PlaceValue {
  place: Place | null;
  text: string;
}

function PlaceInput({ id, label, icon, value, onChange }: { id: string; label: string; icon: string; value: PlaceValue; onChange: (v: PlaceValue) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <AutocompleteInput
        id={id}
        label={label}
        placeholder="Ville ou gare"
        icon={icon}
        compact
        isSelected={!!value.place}
        onSelect={(place) => onChange({ place, text: place?.name ?? value.text })}
        onQueryChange={(text) => onChange({ place: null, text })}
      />
    </div>
  );
}

export function SearchForTrip({ trip }: { trip: Trip }) {
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [date, setDate] = useState(trip.start_date);
  return (
    <div className="flex flex-col gap-4">
      <PlacePicker idPrefix="mv-leg-search" from={from} to={to} onFrom={setFrom} onTo={setTo} />
      <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
        <Field label="Date" htmlFor="mv-leg-search-date">
          <input id="mv-leg-search-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </Field>
        {from && to && date ? (
          <Link to={searchUrl('europe', from, to, date)} onClick={() => setTargetTrip(trip)} className={buttonClass('primary')}>
            <Search className="w-4 h-4" aria-hidden />
            Rechercher pour cette date
          </Link>
        ) : (
          <Button variant="primary" disabled>
            <Search className="w-4 h-4" aria-hidden />
            Rechercher pour cette date
          </Button>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Choisissez votre train dans les résultats : sur la page du trajet, le bouton vert l’ajoutera directement à ce voyage. Si
        aucun horaire n'est encore publié pour cette date, saisissez le trajet à la main.
      </p>
    </div>
  );
}

export function ManualLegForm({ trip, position, onAdded, onCancel }: { trip: Trip; position: number; onAdded: (leg: TripLeg) => void; onCancel: () => void }) {
  const [from, setFrom] = useState<PlaceValue>({ place: null, text: '' });
  const [to, setTo] = useState<PlaceValue>({ place: null, text: '' });
  const [date, setDate] = useState(trip.start_date);
  const [depTime, setDepTime] = useState('');
  const [arrDate, setArrDate] = useState('');
  const [arrTime, setArrTime] = useState('');
  const tz = defaultTimezone();
  const [depTz, setDepTz] = useState(tz);
  const [arrTz, setArrTz] = useState(tz);
  const [operator, setOperator] = useState('');
  const [trainNumber, setTrainNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState('');
  const [priceKind, setPriceKind] = useState<'paid' | 'estimated'>('paid');
  const [currency, setCurrency] = useState<Currency>('EUR');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const originName = (from.place?.name ?? from.text).trim();
    const destinationName = (to.place?.name ?? to.text).trim();
    if (!originName || !destinationName) return setError('Indiquez le départ et l’arrivée.');
    const arrivalDate = arrDate || date;
    const departureAt = depTime ? zonedToIso(date, depTime, depTz) : null;
    const arrivalAt = arrTime ? zonedToIso(arrivalDate, arrTime, arrTz) : null;
    if (departureAt && arrivalAt && arrivalAt < departureAt) return setError("L'arrivée doit suivre le départ.");
    const amount = parseEuros(price);
    if (Number.isNaN(amount)) return setError('Prix invalide (exemple : 89,50).');
    setBusy(true);
    setError(null);
    try {
      const leg = await addLeg({
        trip_id: trip.id,
        position,
        network: null,
        origin_id: validPlaceId(from.place?.id),
        origin_name: originName.slice(0, 160),
        destination_id: validPlaceId(to.place?.id),
        destination_name: destinationName.slice(0, 160),
        scheduled_departure_at: departureAt,
        scheduled_arrival_at: arrivalAt,
        departure_timezone: depTime ? depTz : null,
        arrival_timezone: arrTime ? arrTz : null,
        departure_local: depTime ? `${date}T${depTime}` : date,
        arrival_local: arrTime ? `${arrivalDate}T${arrTime}` : arrDate || null,
        operator_name: operator.trim() || null,
        train_number: trainNumber.trim() || null,
        notes: notes.trim() || null,
        price_amount: amount,
        price_kind: amount === null ? null : priceKind,
        price_currency: currency,
        source: 'manual',
        source_fetched_at: null,
        search_params: null,
        itinerary_snapshot: null,
      });
      onAdded(leg);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <PlaceInput id="mv-leg-from" label="Départ" icon="trip_origin" value={from} onChange={setFrom} />
        <PlaceInput id="mv-leg-to" label="Arrivée" icon="location_on" value={to} onChange={setTo} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Date de départ" htmlFor="mv-leg-date">
          <input id="mv-leg-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Heure (facultative)" htmlFor="mv-leg-dep">
          <input id="mv-leg-dep" type="time" value={depTime} onChange={(e) => setDepTime(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Date d'arrivée" htmlFor="mv-leg-arr-date">
          <input id="mv-leg-arr-date" type="date" min={date} value={arrDate} onChange={(e) => setArrDate(e.target.value)} className={inputClass} placeholder="Même jour" />
        </Field>
        <Field label="Heure d'arrivée" htmlFor="mv-leg-arr">
          <input id="mv-leg-arr" type="time" value={arrTime} onChange={(e) => setArrTime(e.target.value)} className={inputClass} />
        </Field>
      </div>
      {(depTime || arrTime) && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Heure locale au départ" htmlFor="mv-leg-dep-tz">
            <select id="mv-leg-dep-tz" value={depTz} onChange={(e) => setDepTz(e.target.value)} className={inputClass}>
              {TIMEZONES.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
            </select>
          </Field>
          <Field label="Heure locale à l'arrivée" htmlFor="mv-leg-arr-tz">
            <select id="mv-leg-arr-tz" value={arrTz} onChange={(e) => setArrTz(e.target.value)} className={inputClass}>
              {TIMEZONES.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
            </select>
          </Field>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Compagnie (facultative)" htmlFor="mv-leg-op">
          <input id="mv-leg-op" maxLength={120} value={operator} onChange={(e) => setOperator(e.target.value)} className={inputClass} placeholder="SNCF, Trenitalia…" />
        </Field>
        <Field label="Train (facultatif)" htmlFor="mv-leg-train">
          <input id="mv-leg-train" maxLength={40} value={trainNumber} onChange={(e) => setTrainNumber(e.target.value)} className={inputClass} placeholder="TGV INOUI 9241" />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Prix (facultatif)" htmlFor="mv-leg-price">
          <input id="mv-leg-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} placeholder="89,50" />
        </Field>
        <Field label="Devise" htmlFor="mv-leg-currency">
          <select id="mv-leg-currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={inputClass}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Ce prix est" htmlFor="mv-leg-price-kind">
          <select id="mv-leg-price-kind" value={priceKind} onChange={(e) => setPriceKind(e.target.value as 'paid' | 'estimated')} className={inputClass}>
            <option value="paid">payé</option>
            <option value="estimated">estimé</option>
          </select>
        </Field>
      </div>
      <Field label="Notes (facultatives)" htmlFor="mv-leg-notes">
        <textarea id="mv-leg-notes" rows={2} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder="Voiture 12, place 45…" />
      </Field>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit" variant="primary" busy={busy}>
          <PenLine className="w-4 h-4" aria-hidden />
          Ajouter ce trajet
        </Button>
      </div>
    </form>
  );
}
