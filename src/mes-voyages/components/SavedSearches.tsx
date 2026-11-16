// Recherches sauvegardées : une intention (trajet, date, filtres), relancée avec les horaires du moment.
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Plus, Search, Trash2 } from 'lucide-react';
import type { Place } from '../../types/api';
import { createSavedSearch, deleteSavedSearch } from '../lib/api';
import { track } from '../../lib/analytics';
import { errorMessage } from '../lib/errors';
import { savedSearchUrl, todayIso, validPlaceId } from '../lib/itinerary';
import type { SavedSearch } from '../lib/types';
import { Alert, Button, Card, ConfirmButton, EmptyState, Field, formatDay, inputClass } from '../ui';
import { PlacePicker } from './PlacePicker';

function describeFilters(search: SavedSearch): string[] {
  const out: string[] = [];
  const max = search.filters.max_transfers;
  if (max === '0') out.push('direct uniquement');
  else if (max) out.push(`${max} correspondance${max === '1' ? '' : 's'} max.`);
  if (search.filters.train_types) out.push(search.filters.train_types.split(',').join(', '));
  if (search.filters.long_wait === '0') out.push('sans nuit en gare');
  if (search.departure_time_preference) out.push(`départ après ${search.departure_time_preference.slice(0, 5)}`);
  if (search.network === 'tgvmax') out.push('TGVmax');
  return out;
}

function SavedSearchRow({ search, onDeleted }: { search: SavedSearch; onDeleted: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const past = search.travel_date !== null && search.travel_date < todayIso();
  const details = describeFilters(search);
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="font-bold text-slate-900 break-words">
          {search.label || `${search.origin_name} → ${search.destination_name}`}
        </div>
        <div className="text-xs text-slate-500 mt-0.5">
          {search.travel_date ? formatDay(search.travel_date) : 'Date libre'}
          {search.return_date && ` · retour ${formatDay(search.return_date)}`}
          {details.length > 0 && ` · ${details.join(' · ')}`}
        </div>
        {past && <div className="text-xs text-amber-700 mt-1">Date passée : la recherche s'ouvrira à la date du jour.</div>}
        {error && <div className="mt-2"><Alert tone="error">{error}</Alert></div>}
      </div>
      <div className="flex items-center gap-1">
        <Link to={savedSearchUrl(search, past ? todayIso() : undefined)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-brand text-white hover:bg-brand-dark">
          <Search className="w-3.5 h-3.5" aria-hidden />
          Rechercher
        </Link>
        <ConfirmButton
          label={<span className="sr-only sm:not-sr-only">Supprimer</span>}
          confirmLabel="Supprimer ?"
          icon={<Trash2 className="w-3.5 h-3.5" aria-hidden />}
          onConfirm={async () => {
            try {
              await deleteSavedSearch(search.id);
              onDeleted();
            } catch (err) {
              setError(errorMessage(err));
            }
          }}
        />
      </div>
    </li>
  );
}

function NewSavedSearch({ onCreated, onCancel }: { onCreated: (s: SavedSearch) => void; onCancel: () => void }) {
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [date, setDate] = useState('');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const origin = validPlaceId(from?.id);
    const destination = validPlaceId(to?.id);
    if (!from || !to || !origin || !destination) return setError('Choisissez le départ et l’arrivée dans les suggestions.');
    setBusy(true);
    setError(null);
    try {
      const saved = await createSavedSearch({
        label: label.trim() || null,
        network: 'europe',
        origin_id: origin,
        origin_name: from.name,
        destination_id: destination,
        destination_name: to.name,
        travel_date: date || null,
        return_date: null,
        departure_time_preference: null,
        filters: {},
      });
      track('sauvegarde-recherche', { de: from.name, vers: to.name });
      onCreated(saved);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-4 sm:p-5 border-t border-slate-100 flex flex-col gap-4 bg-slate-50/50 rounded-b-2xl">
      <PlacePicker idPrefix="mv-search" from={from} to={to} onFrom={setFrom} onTo={setTo} />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Date (facultative)" htmlFor="mv-search-date">
          <input id="mv-search-date" type="date" value={date} min={todayIso()} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Nom (facultatif)" htmlFor="mv-search-label">
          <input id="mv-search-label" maxLength={120} value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} placeholder="Week-end à Milan" />
        </Field>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>Annuler</Button>
        <Button type="submit" variant="primary" busy={busy}>Sauvegarder la recherche</Button>
      </div>
    </form>
  );
}

export function SavedSearches({ searches, onChange }: { searches: SavedSearch[]; onChange: (next: SavedSearch[]) => void }) {
  const [adding, setAdding] = useState(false);
  return (
    <Card>
      {searches.length === 0 && !adding ? (
        <EmptyState icon={<Bookmark className="w-6 h-6" aria-hidden />} title="Aucune recherche sauvegardée">
          Gardez un trajet et ses critères pour le relancer plus tard, avec les horaires du moment.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-slate-100">
          {searches.map((s) => (
            <SavedSearchRow key={s.id} search={s} onDeleted={() => onChange(searches.filter((x) => x.id !== s.id))} />
          ))}
        </ul>
      )}
      {adding ? (
        <NewSavedSearch
          onCancel={() => setAdding(false)}
          onCreated={(s) => {
            onChange([s, ...searches]);
            setAdding(false);
          }}
        />
      ) : (
        <div className="p-3 border-t border-slate-100 flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4" aria-hidden />
            Sauvegarder une recherche
          </Button>
        </div>
      )}
    </Card>
  );
}
