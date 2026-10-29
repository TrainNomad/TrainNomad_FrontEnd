// Liens vers Omio (programme d'affiliation, via Impact) : TrainNomad n'a pas les prix, la carte d'un
// trajet renvoie donc vers la page Omio de la liaison, où l'on voit les tarifs et où l'on réserve.
import { OMIO_TRACKING_URL } from '../config';
import type { Journey, StopRef } from '../types/api';

/** "Saint-Malo" -> "saint-malo", "Gérone" -> "gerone" (forme des adresses omio.fr). */
function slug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Lien de suivi vers la page Omio des trains entre deux villes (https://www.omio.fr/trains/rennes/paris),
 * ou null si une ville est inconnue.
 */
export function omioCityLink(from: StopRef, to: StopRef): string | null {
  const a = slug(from.city || from.name);
  const b = slug(to.city || to.name);
  if (!a || !b || a === b) return null;
  const page = `https://www.omio.fr/trains/${a}/${b}`;
  return `${OMIO_TRACKING_URL}?u=${encodeURIComponent(page)}`;
}

/** Lien Omio entre les villes de départ et d'arrivée du trajet. */
export function omioLink(journey: Journey): string | null {
  return omioCityLink(journey.from, journey.to);
}
