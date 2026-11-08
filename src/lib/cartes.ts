// Carte des trains de la page /train/ : écrite par Backend/gtfs/traces/cartes_villes.py.
//   src/lib/cartes.json               index : villes du site, leur position et leur étiquette sur la carte
//   public/cartes/europe.svg          fond (terres en points, frontières), même projection que les positions
//   public/cartes/reseau/<ville>.json lignes d'une ville pour chaque filtre (chargées au clic)
//   public/cartes/depuis-<ville>….webp  images cadrées sur une ville, pour les moteurs d'images
import data from './cartes.json';
import { isHiddenPlace } from './masques';

/** correspondance : direct et une correspondance au plus ; 3h : 3 heures au plus ; nuit : trains de nuit */
export type CarteMode = 'correspondance' | 'direct' | '3h' | 'nuit';

/** Étiquette : [ancre du texte, x, y] */
export type CarteLabel = ['start' | 'middle' | 'end', number, number];

export interface CarteMap {
  mode: CarteMode;
  /** Destinations directes, et les autres (avec une correspondance) */
  direct: number;
  other: number;
  lines: number;
  title: string;
  alt: string;
  /** Image public/cartes/<image>.webp, s'il y en a une pour ce filtre */
  image: string | null;
}

export interface CarteCity {
  name: string;
  slug: string;
  /** Identifiant de la ville dans l'API Europe */
  id: string;
  x: number;
  y: number;
  /** null : pas de place pour le nom sur la carte de départ (affiché au survol) */
  label: CarteLabel | null;
  maps: CarteMap[];
  /** Destinations en direct ou avec une correspondance, de la plus proche à la plus lointaine (liste de /train/) */
  dests?: CarteDest[];
}

export interface CarteDest {
  name: string;
  /** Durée du trajet le plus rapide (minutes) */
  min: number;
  direct: boolean;
  /** Identifiant de la ville dans l'API Europe ; page de la liaison s'il y en a une */
  id: string;
  slug?: string;
}

export interface CarteLine {
  points: string;
  color: string;
  /** Tronçon après une correspondance (pointillés) */
  after: boolean;
  tip: string;
  /** Destination du trajet : nom, identifiant dans l'API, page de la liaison s'il y en a une */
  dest: string;
  id: string;
  slug?: string;
}

export interface CarteNode {
  name: string;
  /** direct, avec correspondance, ou ville de correspondance / desservie en chemin */
  kind: 'direct' | 'corresp' | 'via';
  x: number;
  y: number;
  label: CarteLabel;
  slug?: string;
  id?: string;
}

export interface CarteLayer {
  direct: number;
  other: number;
  origin: { x: number; y: number; label: CarteLabel };
  lines: CarteLine[];
  nodes: CarteNode[];
  /** [compagnie, couleur] */
  legend: [string, string][];
}

/** Fichier public/cartes/reseau/<ville>.json : un calque par filtre, et la signature du cadrage de la carte */
export type CarteLayers = Partial<Record<CarteMode, CarteLayer>> & { proj?: string };

/** proj : signature du cadrage de la carte ; un calque d'un autre cadrage (calculé avant l'ajout de villes) est décalé */
const raw = data as unknown as { built_at: string; width: number; height: number; proj?: string; cities: CarteCity[] };

/** Sans les villes masquées temporairement (src/lib/masques.json) : ni point, ni carte, ni destination */
export const CARTES = {
  ...raw,
  cities: raw.cities.filter((c) => !isHiddenPlace(c)).map((c) => (c.dests ? { ...c, dests: c.dests.filter((d) => !isHiddenPlace(d)) } : c)),
};

/** Calques d'une ville sans les lignes ni les points des villes masquées */
export function withoutHidden(layers: CarteLayers): CarteLayers {
  const out: CarteLayers = { ...layers };
  for (const { mode } of CARTE_MODES) {
    const layer = layers[mode];
    if (!layer) continue;
    const hidden = new Set(layer.lines.filter((l) => isHiddenPlace(l)).map((l) => l.dest));
    out[mode] = {
      ...layer,
      lines: layer.lines.filter((l) => !hidden.has(l.dest)),
      nodes: layer.nodes.filter((n) => !isHiddenPlace(n) && !hidden.has(n.name)),
    };
  }
  return out;
}

export const CARTE_MODES: { mode: CarteMode; label: string }[] = [
  { mode: 'correspondance', label: 'Direct et 1 correspondance' },
  { mode: 'direct', label: 'Trains directs' },
  { mode: '3h', label: 'Moins de 3 h' },
  { mode: 'nuit', label: 'Trains de nuit' },
];

export const carteLayerUrl = (c: CarteCity) => `/cartes/reseau/${c.slug}.json`;
export const carteImage = (file: string) => `/cartes/${file}.webp`;
