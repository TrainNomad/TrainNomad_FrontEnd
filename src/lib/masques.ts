// Masquage temporaire de pays ou de villes (src/lib/masques.json). Pour réactiver : vider les listes du JSON.
import MASQUES from './masques.json';

const PAYS = new Set<string>(MASQUES.pays);
const LIEUX = new Set<string>(MASQUES.lieux);
const VILLES_GLOBE = new Set<string>(MASQUES.villesGlobe);

/** Lieu de l'API (identifiant, et pays s'il est connu) à ne pas montrer */
export const isHiddenPlace = (p: { id?: string; country?: string }) =>
  (!!p.country && PAYS.has(p.country)) || (!!p.id && LIEUX.has(p.id));

/** Ville du globe de l'accueil (clé de src/lib/globeNetwork.json) à ne pas montrer */
export const isHiddenGlobeCity = (key: string) => VILLES_GLOBE.has(key);
