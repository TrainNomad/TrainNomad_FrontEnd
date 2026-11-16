// Billets PDF — ÉTAPE ULTÉRIEURE, NON BRANCHÉE. Aucun fichier du parcours principal n'importe ce dossier : il
// n'est donc pas inclus dans le site. Activation : voir supabase/billets/README.md.
import { functionUrl, supabase, SUPABASE_PUBLISHABLE_KEY } from '../lib/supabase';
import { fromSupabaseError, MesVoyagesError } from '../lib/errors';

export const TICKETS_BUCKET = 'tickets';

/** Taille maximale d'un billet, contrôlée aussi par le serveur (réglage max_pdf_bytes). */
export const MAX_PDF_BYTES = Number(import.meta.env.VITE_MAX_PDF_BYTES || 10 * 1024 * 1024);

export type UploadStatus = 'pending' | 'ready' | 'quarantined';

export interface TripDocument {
  id: string;
  trip_id: string;
  trip_leg_id: string | null;
  storage_path: string;
  original_filename: string;
  label: string | null;
  mime_type: string;
  size_bytes: number;
  upload_status: UploadStatus;
  created_at: string;
  updated_at: string;
}

const DOCUMENT_COLUMNS =
  'id, trip_id, trip_leg_id, storage_path, original_filename, label, mime_type, size_bytes, upload_status, created_at, updated_at';

type Result<T> = PromiseLike<{ data: T | null; error: { message: string; code?: string } | null }>;
async function must<T>(query: Result<T>): Promise<T> {
  const { data, error } = await query;
  if (error) throw fromSupabaseError(error);
  return data as T;
}

async function accessToken(): Promise<string> {
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new MesVoyagesError('unauthenticated');
  return token;
}

export async function listDocuments(tripId: string): Promise<TripDocument[]> {
  return must(supabase().from('user_documents').select(DOCUMENT_COLUMNS).eq('trip_id', tripId).order('created_at'));
}

export interface UploadOptions {
  file: File;
  tripId: string;
  legId?: string | null;
  label?: string | null;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

/** Envoie un billet PDF à la fonction tickets-upload (avec suivi de progression). Le fichier est transmis tel quel. */
export async function uploadDocument({ file, tripId, legId, label, onProgress, signal }: UploadOptions): Promise<TripDocument> {
  const token = await accessToken();
  const form = new FormData();
  form.append('trip_id', tripId);
  if (legId) form.append('trip_leg_id', legId);
  if (label) form.append('label', label);
  form.append('file', file, file.name);

  const response = await new Promise<{ status: number; body: { document?: TripDocument; error?: string } }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', functionUrl('tickets-upload'));
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', SUPABASE_PUBLISHABLE_KEY);
    xhr.responseType = 'json';
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => resolve({ status: xhr.status, body: (xhr.response ?? {}) as { document?: TripDocument; error?: string } });
    xhr.onerror = () => reject(new MesVoyagesError('network'));
    xhr.onabort = () => reject(new DOMException('Envoi annulé', 'AbortError'));
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(form);
  });

  if (response.status === 201 && response.body.document) {
    return must(supabase().from('user_documents').select(DOCUMENT_COLUMNS).eq('id', response.body.document.id).single());
  }
  throw new MesVoyagesError(response.body.error ?? (response.status === 413 ? 'too_large' : 'internal'));
}

/** Contenu du billet, lu avec la session (pas de lien public ni signé). */
export async function fetchDocumentBlob(doc: TripDocument): Promise<Blob> {
  const { data, error } = await supabase().storage.from(TICKETS_BUCKET).download(doc.storage_path);
  if (error || !data) throw fromSupabaseError(error);
  return new Blob([data], { type: 'application/pdf' });
}

export async function updateDocument(id: string, patch: { label?: string | null; trip_leg_id?: string | null }): Promise<TripDocument> {
  return must(supabase().from('user_documents').update(patch).eq('id', id).select(DOCUMENT_COLUMNS).single());
}

export async function deleteDocument(id: string): Promise<void> {
  await must(supabase().from('user_documents').delete().eq('id', id));
  void purgeDeletedFiles();
}

/** Efface tout de suite les fichiers des billets supprimés (sinon : tâche planifiée). Sans effet en cas d'échec. */
export async function purgeDeletedFiles(): Promise<void> {
  try {
    const token = await accessToken();
    await fetch(functionUrl('tickets-purge'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
      body: '{}',
    });
  } catch {
    // la file reste en base : la tâche planifiée effacera les fichiers
  }
}
