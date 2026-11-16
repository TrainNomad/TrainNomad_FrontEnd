// Création (/mes-voyages/nouveau) et modification (/mes-voyages/voyage/:id/modifier) d'un voyage.
// Un voyage peut exister sans train : seules une date de début et un titre sont demandés.
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createTrip, getTrip, updateTrip } from '../lib/api';
import { errorMessage } from '../lib/errors';
import { addDays, todayIso } from '../lib/itinerary';
import { TRIP_STATUS_LABELS, type TripInput, type TripStatus } from '../lib/types';
import { Alert, Button, Card, Field, inputClass, PageLoader, PageShell } from '../ui';

const EMPTY: TripInput = { title: '', start_date: '', end_date: null, status: 'planned', notes: null };

export default function TripFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [value, setValue] = useState<TripInput>(() => ({
    ...EMPTY,
    title: (params.get('titre') ?? '').slice(0, 120),
    start_date: params.get('debut') ?? addDays(todayIso(), 60),
    end_date: params.get('fin'),
  }));
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getTrip(id)
      .then((trip) => {
        if (!trip) return navigate('/mes-voyages', { replace: true });
        setValue({ title: trip.title, start_date: trip.start_date, end_date: trip.end_date, status: trip.status, notes: trip.notes });
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const set = <K extends keyof TripInput>(key: K, v: TripInput[K]) => setValue((prev) => ({ ...prev, [key]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (value.end_date && value.end_date < value.start_date) return setError('La date de fin doit suivre la date de début.');
    setBusy(true);
    setError(null);
    const input: TripInput = {
      ...value,
      title: value.title.trim(),
      end_date: value.end_date || null,
      notes: value.notes?.trim() || null,
    };
    try {
      const trip = id ? await updateTrip(id, input) : await createTrip(input);
      navigate(`/mes-voyages/voyage/${trip.id}`, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <PageShell
      title={editing ? 'Modifier le voyage' : 'Nouveau voyage'}
      subtitle={editing ? undefined : 'Un projet suffit : le train pourra être ajouté plus tard, une fois les horaires publiés.'}
      back={editing && id ? { to: `/mes-voyages/voyage/${id}`, label: 'Retour au voyage' } : { to: '/mes-voyages', label: 'Mes voyages' }}
    >
      <Card className="p-5 sm:p-6">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <Field label="Titre" htmlFor="mv-title">
            <input
              id="mv-title"
              required
              maxLength={120}
              value={value.title}
              onChange={(e) => set('title', e.target.value)}
              className={inputClass}
              placeholder="Week-end à Milan"
              autoFocus={!editing}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Début" htmlFor="mv-start">
              <input id="mv-start" type="date" required value={value.start_date} onChange={(e) => set('start_date', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Fin (facultative)" htmlFor="mv-end">
              <input
                id="mv-end"
                type="date"
                min={value.start_date || undefined}
                value={value.end_date ?? ''}
                onChange={(e) => set('end_date', e.target.value || null)}
                className={inputClass}
              />
            </Field>
          </div>
          <Field
            label="Statut"
            htmlFor="mv-status"
            hint="« Billets pris » est une indication pour vous : ce n'est pas une confirmation de la compagnie."
          >
            <select id="mv-status" value={value.status} onChange={(e) => set('status', e.target.value as TripStatus)} className={inputClass}>
              {(Object.keys(TRIP_STATUS_LABELS) as TripStatus[]).map((s) => (
                <option key={s} value={s}>
                  {TRIP_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes (facultatives)" htmlFor="mv-notes">
            <textarea
              id="mv-notes"
              rows={4}
              maxLength={5000}
              value={value.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              className={inputClass}
              placeholder="Hôtel, idées de visites, numéros de réservation…"
            />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" busy={busy}>
              {editing ? 'Enregistrer' : 'Créer le voyage'}
            </Button>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}
