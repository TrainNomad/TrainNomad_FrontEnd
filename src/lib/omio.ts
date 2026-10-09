// Liens vers Omio (programme d'affiliation, via Impact) : TrainNomad n'a pas les prix, la carte d'un
// trajet renvoie donc vers la page Omio de la liaison, où l'on voit les tarifs et où l'on réserve.
import { OMIO_TRACKING_URL } from '../config';
import type { Journey } from '../types/api';

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
 * Lien de suivi vers la page Omio des trains entre les villes de départ et d'arrivée du trajet
 * (https://www.omio.fr/trains/rennes/paris), ou null si une ville est inconnue.
 */
export function omioLink(journey: Journey): string | null {
  const from = slug(journey.from.city || journey.from.name);
  const to = slug(journey.to.city || journey.to.name);
  if (!from || !to || from === to) return null;
  const page = `https://www.omio.fr/trains/${from}/${to}`;
  return `${OMIO_TRACKING_URL}?u=${encodeURIComponent(page)}`;
}
