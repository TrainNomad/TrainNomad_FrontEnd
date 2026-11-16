// ÉTAPE ULTÉRIEURE, NON BRANCHÉE (voir supabase/billets/README.md).
// Billets PDF d'un voyage : envoi (contrôlé par le serveur), ouverture, téléchargement de l'original, suppression.
// Le fichier est lu avec la session de l'utilisateur (aucun lien public ni signé) et n'est jamais modifié.
import { useRef, useState, type DragEvent } from 'react';
import { Download, FileText, LoaderCircle, Lock, Trash2, Upload, X } from 'lucide-react';
import { deleteDocument, fetchDocumentBlob, MAX_PDF_BYTES, updateDocument, uploadDocument, type TripDocument } from './api';
import { errorMessage, MesVoyagesError } from '../lib/errors';
import type { TripLeg } from '../lib/types';
import { Alert, Button, ConfirmButton, cx, EmptyState, formatBytes, formatStamp, inputClass } from '../ui';

const legLabel = (leg: TripLeg, i: number) => `Trajet ${i + 1} · ${leg.origin_name} → ${leg.destination_name}`;

/** Contrôle rapide avant l'envoi (le serveur refait le contrôle complet) : taille et en-tête %PDF-. */
async function precheck(file: File): Promise<string | null> {
  if (file.size === 0) return new MesVoyagesError('empty').message;
  if (file.size > MAX_PDF_BYTES) return new MesVoyagesError('too_large').message;
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...head) !== '%PDF-') return new MesVoyagesError('not_pdf').message;
  return null;
}

interface UploadItem {
  key: string;
  name: string;
  progress: number;
  error: string | null;
  controller: AbortController;
}

async function withBlob(doc: TripDocument, use: (url: string) => void) {
  const blob = await fetchDocumentBlob(doc);
  const url = URL.createObjectURL(blob);
  use(url);
  // le temps que l'onglet ou le téléchargement lise le fichier
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function DocumentRow({
  doc,
  legs,
  onChanged,
  onDeleted,
}: {
  doc: TripDocument;
  legs: TripLeg[];
  onChanged: (d: TripDocument) => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState<'open' | 'download' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ready = doc.upload_status === 'ready';

  const open = async () => {
    setError(null);
    // fenêtre ouverte pendant le clic (sinon bloquée sur mobile), remplie une fois le fichier reçu
    const win = window.open('', '_blank');
    setBusy('open');
    try {
      await withBlob(doc, (url) => {
        if (win) win.location.href = url;
        else window.location.assign(url);
      });
    } catch (err) {
      win?.close();
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const download = async () => {
    setError(null);
    setBusy('download');
    try {
      await withBlob(doc, (url) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.original_filename.toLowerCase().endsWith('.pdf') ? doc.original_filename : `${doc.original_filename}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <li className="px-4 sm:px-5 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-slate-900 break-all">{doc.label || doc.original_filename}</div>
          <div className="text-xs text-slate-500">
            {doc.label && <span className="break-all">{doc.original_filename} · </span>}
            {formatBytes(doc.size_bytes)} · ajouté le {formatStamp(doc.created_at)}
          </div>
          {doc.upload_status === 'pending' && <div className="text-xs text-amber-700 mt-1">Envoi en cours ou interrompu : le fichier n'est pas encore consultable.</div>}
          {doc.upload_status === 'quarantined' && <div className="text-xs text-red-700 mt-1">Fichier bloqué par le contrôle de sécurité.</div>}
          {legs.length > 0 && (
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <span className="sr-only">Trajet concerné</span>
              <select
                value={doc.trip_leg_id ?? ''}
                onChange={async (e) => {
                  try {
                    onChanged(await updateDocument(doc.id, { trip_leg_id: e.target.value || null }));
                  } catch (err) {
                    setError(errorMessage(err));
                  }
                }}
                className={cx(inputClass, 'py-1 text-xs max-w-full')}
              >
                <option value="">Tout le voyage</option>
                {legs.map((l, i) => (
                  <option key={l.id} value={l.id}>
                    {legLabel(l, i)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 sm:pl-[3.25rem]">
        <Button size="sm" variant="primary" disabled={!ready} busy={busy === 'open'} onClick={open}>
          {busy !== 'open' && <FileText className="w-3.5 h-3.5" aria-hidden />}
          Ouvrir le PDF
        </Button>
        <Button size="sm" disabled={!ready} busy={busy === 'download'} onClick={download}>
          {busy !== 'download' && <Download className="w-3.5 h-3.5" aria-hidden />}
          Télécharger l'original
        </Button>
        <ConfirmButton
          label="Supprimer"
          confirmLabel="Supprimer ce billet ?"
          icon={<Trash2 className="w-3.5 h-3.5" aria-hidden />}
          onConfirm={async () => {
            try {
              await deleteDocument(doc.id);
              onDeleted();
            } catch (err) {
              setError(errorMessage(err));
            }
          }}
        />
      </div>
      {error && <div className="mt-3"><Alert tone="error">{error}</Alert></div>}
    </li>
  );
}

export function DocumentsPanel({
  tripId,
  legs,
  documents,
  onChange,
}: {
  tripId: string;
  legs: TripLeg[];
  documents: TripDocument[];
  onChange: (docs: TripDocument[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [targetLeg, setTargetLeg] = useState('');
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  // dernière liste connue, pour ajouter les billets envoyés les uns après les autres
  const docsRef = useRef(documents);
  docsRef.current = documents;

  const patchUpload = (key: string, patch: Partial<UploadItem>) =>
    setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...patch } : u)));

  const sendFiles = async (files: File[]) => {
    const items = files.map((file) => ({
      file,
      item: { key: `${Date.now()}-${Math.random()}`, name: file.name, progress: 0, error: null, controller: new AbortController() } as UploadItem,
    }));
    setUploads((list) => [...list, ...items.map((i) => i.item)]);
    // un fichier à la fois : progression lisible et limitation du débit respectée
    for (const { file, item } of items) {
      const problem = await precheck(file);
      if (problem) {
        patchUpload(item.key, { error: problem });
        continue;
      }
      try {
        const doc = await uploadDocument({
          file,
          tripId,
          legId: targetLeg || null,
          signal: item.controller.signal,
          onProgress: (p) => patchUpload(item.key, { progress: p }),
        });
        onChange([...docsRef.current, doc]);
        setUploads((list) => list.filter((u) => u.key !== item.key));
      } catch (err) {
        if ((err as Error).name === 'AbortError') setUploads((list) => list.filter((u) => u.key !== item.key));
        else patchUpload(item.key, { error: errorMessage(err) });
      }
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = [...e.dataTransfer.files];
    if (files.length) void sendFiles(files);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
      {documents.length === 0 ? (
        <EmptyState icon={<FileText className="w-6 h-6" aria-hidden />} title="Aucun billet joint">
          Ajoutez vos billets PDF pour les retrouver avec le voyage.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-slate-100">
          {documents.map((d) => (
            <DocumentRow
              key={d.id}
              doc={d}
              legs={legs}
              onChanged={(next) => onChange(documents.map((x) => (x.id === next.id ? next : x)))}
              onDeleted={() => onChange(docsRef.current.filter((x) => x.id !== d.id))}
            />
          ))}
        </ul>
      )}

      {uploads.length > 0 && (
        <ul className="border-t border-slate-100 px-4 sm:px-5 py-3 space-y-3">
          {uploads.map((u) => (
            <li key={u.key} className="text-sm">
              <div className="flex items-center gap-2">
                {u.error ? <X className="w-4 h-4 text-red-600" aria-hidden /> : <LoaderCircle className="w-4 h-4 animate-spin text-slate-400" aria-hidden />}
                <span className="min-w-0 flex-1 truncate font-semibold text-slate-700">{u.name}</span>
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  onClick={() => (u.error ? setUploads((l) => l.filter((x) => x.key !== u.key)) : u.controller.abort())}
                >
                  {u.error ? 'Fermer' : 'Annuler'}
                </button>
              </div>
              {u.error ? (
                <p className="text-xs text-red-700 mt-1">{u.error}</p>
              ) : (
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={Math.round(u.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-brand transition-all" style={{ width: `${Math.max(4, u.progress * 100)}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-slate-100 p-4 sm:p-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cx(
            'rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors',
            dragging ? 'border-brand bg-brand/5' : 'border-slate-200',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="sr-only"
            id={`mv-upload-${tripId}`}
            onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              e.target.value = '';
              if (files.length) void sendFiles(files);
            }}
          />
          <label htmlFor={`mv-upload-${tripId}`} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">
            <Upload className="w-4 h-4" aria-hidden />
            Ajouter des billets PDF
          </label>
          <p className="mt-2 text-xs text-slate-500">ou glissez-les ici · PDF uniquement, {formatBytes(MAX_PDF_BYTES)} maximum par fichier</p>
          {legs.length > 0 && (
            <div className="mt-3 flex justify-center">
              <select value={targetLeg} onChange={(e) => setTargetLeg(e.target.value)} className={cx(inputClass, 'max-w-sm text-xs')} aria-label="Trajet concerné par les billets ajoutés">
                <option value="">Pour tout le voyage</option>
                {legs.map((l, i) => (
                  <option key={l.id} value={l.id}>
                    Pour le {legLabel(l, i).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-4">
          <Alert tone="info">
            <span className="inline-flex items-center gap-1.5 font-bold"><Lock className="w-3.5 h-3.5" aria-hidden /> Billets privés</span>
            <br />
            Vos PDF sont conservés tels quels, sans modification, et ne sont accessibles qu'à vous. Gardez aussi le billet
            d'origine (application ou e-mail de la compagnie) : l'affichage depuis TrainNomad n'est pas garanti aux portiques
            ni lors des contrôles.
          </Alert>
        </div>
      </div>
    </div>
  );
}
