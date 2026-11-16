// « Ajouter au calendrier » : fichier iCalendar (.ics, RFC 5545) avec un événement par trajet, lisible par
// Google Agenda, Apple Calendrier et Outlook. Fabriqué dans le navigateur : rien n'est envoyé à un serveur.
import { isTrainLeg } from '../../types/api';
import { formatTime } from '../../lib/format';
import { localDate } from './itinerary';

/** Champs utilisés (trajet complet ou trajet partagé) */
export interface CalendarLeg {
  id: string;
  origin_name: string;
  destination_name: string;
  scheduled_departure_at: string | null;
  scheduled_arrival_at: string | null;
  departure_local: string | null;
  arrival_local: string | null;
  operator_name: string | null;
  train_number: string | null;
  source_fetched_at: string | null;
  itinerary_snapshot: import('../../types/api').Journey | null;
}

const escapeText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Lignes de 75 octets au plus (pliage RFC 5545) */
function fold(line: string): string {
  const bytes = new TextEncoder();
  const out: string[] = [];
  let current = '';
  for (const ch of line) {
    if (bytes.encode(current + ch).length > (out.length ? 74 : 75)) {
      out.push(current);
      current = ch;
    } else current += ch;
  }
  out.push(current);
  return out.join('\r\n ');
}

/** Instant ISO → 20270115T052700Z */
const utcStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
/** AAAA-MM-JJ → AAAAMMJJ */
const day = (iso: string) => iso.slice(0, 10).replace(/-/g, '');

function describe(leg: CalendarLeg): string {
  const lines: string[] = [];
  const trains = leg.itinerary_snapshot?.legs.filter(isTrainLeg) ?? [];
  for (const t of trains) {
    lines.push(`${formatTime(t.departure)} ${t.from.name} → ${formatTime(t.arrival)} ${t.to.name} · ${[t.train_type, t.train_number].filter(Boolean).join(' ')}${t.operator_name ? ` (${t.operator_name})` : ''}`);
  }
  if (trains.length === 0 && (leg.operator_name || leg.train_number)) lines.push([leg.operator_name, leg.train_number].filter(Boolean).join(' · '));
  if (leg.source_fetched_at) {
    lines.push('', `Horaires enregistrés le ${new Date(leg.source_fetched_at).toLocaleDateString('fr-FR')} : vérifiez-les avant le départ.`);
  }
  lines.push('', 'TrainNomad.eu · Mes voyages');
  return lines.join('\n');
}

export function buildCalendar(title: string, legs: CalendarLeg[]): string {
  const now = utcStamp(new Date().toISOString());
  const events = legs.flatMap((leg) => {
    const start = leg.scheduled_departure_at;
    const date = localDate(leg.departure_local);
    if (!start && !date) return [];
    const timing = start
      ? [`DTSTART:${utcStamp(start)}`, `DTEND:${utcStamp(leg.scheduled_arrival_at ?? new Date(Date.parse(start) + 3600_000).toISOString())}`]
      : [`DTSTART;VALUE=DATE:${day(date!)}`];
    return [
      'BEGIN:VEVENT',
      `UID:${leg.id}@trainnomad.eu`,
      `DTSTAMP:${now}`,
      ...timing,
      `SUMMARY:${escapeText(`Train ${leg.origin_name} → ${leg.destination_name}`)}`,
      `LOCATION:${escapeText(leg.origin_name)}`,
      `DESCRIPTION:${escapeText(describe(leg))}`,
      'END:VEVENT',
    ];
  });
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TrainNomad//Mes voyages//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(title)}`,
    ...events,
    'END:VCALENDAR',
  ]
    .map(fold)
    .join('\r\n');
}

/** Télécharge le fichier .ics (ouvert par l'application de calendrier de l'appareil). */
export function downloadCalendar(title: string, legs: CalendarLeg[]) {
  const blob = new Blob([buildCalendar(title, legs)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'voyage'}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
