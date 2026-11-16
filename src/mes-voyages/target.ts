// Projet de voyage en cours de remplissage : posé quand on part d'un projet pour chercher un train
// (« Rechercher pour cette date »), lu par « Enregistrer ce trajet » pour ajouter le trajet à ce projet au lieu
// d'en créer un nouveau. Sans dépendance (importé aussi par la page Voyage du site).

const KEY = 'trainnomad-mes-voyages-projet';
/** Au-delà, la recherche n'est plus considérée comme liée au projet */
const TTL_MS = 3 * 60 * 60 * 1000;

export interface TargetTrip {
  id: string;
  title: string;
  setAt: number;
}

export function setTargetTrip(trip: { id: string; title: string } | null) {
  try {
    if (trip) localStorage.setItem(KEY, JSON.stringify({ id: trip.id, title: trip.title, setAt: Date.now() }));
    else localStorage.removeItem(KEY);
  } catch {
    // stockage indisponible : le trajet sera enregistré dans un nouveau voyage
  }
}

export function getTargetTrip(): TargetTrip | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return v && typeof v.id === 'string' && Date.now() - v.setAt < TTL_MS ? v : null;
  } catch {
    return null;
  }
}
