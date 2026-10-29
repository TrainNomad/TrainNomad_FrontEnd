// Liens vers SNCF Connect (programme d'affiliation, via Effiliation). SNCF Connect lit une recherche en une phrase
// dans le paramètre `userInput` (« Rennes Marseille 15 novembre 07h48 ») et ouvre directement les résultats,
// à partir de l'heure demandée : le train choisi sur TrainNomad est alors dans les premiers de la liste.
// On ne peut pas présélectionner un train précis : la liste des trains du billet s'affiche à côté du lien.
import { SNCF_CONNECT_TRACKING_URL } from '../config';
import type { Ticket } from './tickets';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** Lien de suivi vers la recherche SNCF Connect de ce billet (villes, date et heure de départ), ou null. */
export function sncfConnectLink(ticket: Ticket): string | null {
  const from = ticket.from.city || ticket.from.name;
  const to = ticket.to.city || ticket.to.name;
  // Heure locale du départ, lue telle quelle dans l'ISO renvoyé par l'API ("2026-11-15T07:48:00+01:00")
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(ticket.departure);
  if (!from || !to || !m) return null;
  const when = `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[4]}h${m[5]}`;
  const page = `https://www.sncf-connect.com/home/search?userInput=${encodeURIComponent(`${from} ${to} ${when}`)}`;
  return `${SNCF_CONNECT_TRACKING_URL}&url=${encodeURIComponent(page)}`;
}
