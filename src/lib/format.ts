// Affichage des heures et durées renvoyées par l'API. Les heures sont déjà en heure
// locale de chaque gare : on lit directement la chaîne ISO, sans conversion vers le
// fuseau du navigateur (Londres reste à l'heure de Londres).

/** "2026-09-17T09:31:00+01:00" -> "09:31" (ou "09h31" avec sep = 'h') */
export function formatTime(iso?: string | null, sep = ':'): string {
  if (!iso) return '';
  // Accepte aussi une heure seule "09:31" / "09:31:00"
  const hhmm = iso.length >= 16 && iso[10] === 'T' ? iso.slice(11, 16) : iso.slice(0, 5);
  return sep === ':' ? hhmm : hhmm.replace(':', sep);
}

/** 144 -> "2h24", 45 -> "45 min" */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m} min`;
}

/** Nombre de jours calendaires entre deux horaires ISO (0 = même jour, 1 = lendemain…) */
export function dayOffset(fromIso: string, toIso: string): number {
  const a = Date.UTC(+fromIso.slice(0, 4), +fromIso.slice(5, 7) - 1, +fromIso.slice(8, 10));
  const b = Date.UTC(+toIso.slice(0, 4), +toIso.slice(5, 7) - 1, +toIso.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

/** "2026-09-17T…" -> "jeu. 17 septembre 2026" */
export function formatDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
