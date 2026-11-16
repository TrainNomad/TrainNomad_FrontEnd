// Accès aux données de l'espace « Mes voyages » : lecture et écriture directes dans la base, limitées au compte
// connecté par la RLS (supabase/migrations). Aucune fonction serveur dans cette version.
import { supabase } from './supabase';
import { fromSupabaseError } from './errors';
import type {
  LegSummary,
  SharedTrip,
  TripPassInput,
  SavedSearch,
  SavedSearchInput,
  Trip,
  TripInput,
  TripLeg,
  TripLegInput,
  TripSummary,
  TripWithDetails,
} from './types';

type Result<T> = PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>;

async function must<T>(query: Result<T>): Promise<T> {
  const { data, error } = await query;
  if (error) throw fromSupabaseError(error);
  return data as T;
}

const byPosition = <L extends Pick<TripLeg, 'position' | 'scheduled_departure_at'>>(legs: L[]) =>
  [...legs].sort((a, b) => a.position - b.position || (a.scheduled_departure_at ?? '').localeCompare(b.scheduled_departure_at ?? ''));

// La relation est nommée (!contrainte) : le jour où les billets relieront aussi user_trips et user_trip_legs, PostgREST
// ne devra pas hésiter entre deux chemins.
const LEG_SUMMARY =
  'id, position, origin_name, destination_name, departure_local, arrival_local, scheduled_departure_at, scheduled_arrival_at, source, source_fetched_at, price_amount, price_currency, transfers:itinerary_snapshot->transfers';

// ─── Voyages ────────────────────────────────────────────────────────────────────────────────────

export async function listTrips(): Promise<TripSummary[]> {
  const rows = await must(
    supabase()
      .from('user_trips')
      .select(`*, user_trip_legs!trip_legs_trip_fk(${LEG_SUMMARY})`)
      .order('start_date', { ascending: true }),
  );
  return (rows as Array<Trip & { user_trip_legs: LegSummary[] }>).map(({ user_trip_legs, ...trip }) => ({ ...trip, legs: byPosition(user_trip_legs) }));
}

export async function getTrip(id: string): Promise<TripWithDetails | null> {
  const row = await must(supabase().from('user_trips').select('*, user_trip_legs!trip_legs_trip_fk(*)').eq('id', id).maybeSingle());
  if (!row) return null;
  const { user_trip_legs, ...trip } = row as Trip & { user_trip_legs: TripLeg[] };
  return { ...trip, legs: byPosition(user_trip_legs) };
}

export async function createTrip(input: TripInput): Promise<Trip> {
  return must(supabase().from('user_trips').insert(input).select().single());
}

export async function updateTrip(id: string, patch: Partial<TripInput>): Promise<Trip> {
  return must(supabase().from('user_trips').update(patch).eq('id', id).select().single());
}

export async function updateTripPass(id: string, patch: Partial<TripPassInput>): Promise<Trip> {
  return must(supabase().from('user_trips').update(patch).eq('id', id).select().single());
}

// ─── Partage en lecture seule ───────────────────────────────────────────────────────────────────

/** Jeton aléatoire de 43 caractères (256 bits, générateur cryptographique du navigateur) */
function newShareToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Active (ou renouvelle) le lien de partage ; l'ancien lien cesse de fonctionner. */
export async function enableSharing(tripId: string): Promise<Trip> {
  return must(supabase().from('user_trips').update({ share_token: newShareToken() }).eq('id', tripId).select().single());
}

export async function disableSharing(tripId: string): Promise<Trip> {
  return must(supabase().from('user_trips').update({ share_token: null }).eq('id', tripId).select().single());
}

/** Voyage partagé, lisible sans compte avec le jeton (null : lien invalide ou désactivé). */
export async function getSharedTrip(token: string): Promise<SharedTrip | null> {
  return must(supabase().rpc('get_shared_trip', { p_token: token }));
}

/** Adresse du lien de partage : le jeton est après « # », il n'est envoyé ni au serveur ni à la mesure d'audience. */
export const shareUrl = (token: string) => `${window.location.origin}/mes-voyages/partage#${token}`;

/** Supprime le voyage et ses trajets. */
export async function deleteTrip(id: string): Promise<void> {
  await must(supabase().from('user_trips').delete().eq('id', id));
}

// ─── Trajets ────────────────────────────────────────────────────────────────────────────────────

export async function addLeg(input: TripLegInput): Promise<TripLeg> {
  return must(supabase().from('user_trip_legs').insert(input).select().single());
}

export async function addLegs(inputs: TripLegInput[]): Promise<TripLeg[]> {
  if (inputs.length === 0) return [];
  return must(supabase().from('user_trip_legs').insert(inputs).select());
}

export async function updateLeg(id: string, patch: Partial<TripLegInput>): Promise<TripLeg> {
  return must(supabase().from('user_trip_legs').update(patch).eq('id', id).select().single());
}

export async function deleteLeg(id: string): Promise<void> {
  await must(supabase().from('user_trip_legs').delete().eq('id', id));
}

/** Renumérote les trajets dans l'ordre donné. */
export async function reorderLegs(orderedIds: string[]): Promise<void> {
  await Promise.all(orderedIds.map((id, position) => must(supabase().from('user_trip_legs').update({ position }).eq('id', id))));
}

// ─── Recherches sauvegardées ────────────────────────────────────────────────────────────────────

export async function listSavedSearches(): Promise<SavedSearch[]> {
  return must(supabase().from('user_saved_searches').select('*').order('created_at', { ascending: false }));
}

export async function createSavedSearch(input: SavedSearchInput): Promise<SavedSearch> {
  return must(supabase().from('user_saved_searches').insert(input).select().single());
}

export async function deleteSavedSearch(id: string): Promise<void> {
  await must(supabase().from('user_saved_searches').delete().eq('id', id));
}

// ─── Compte ─────────────────────────────────────────────────────────────────────────────────────

/** Supprime le compte connecté et toutes ses données (fonction delete_my_account de la base). */
export async function deleteAccount(): Promise<void> {
  await must(supabase().rpc('delete_my_account'));
  await supabase().auth.signOut({ scope: 'local' });
}
