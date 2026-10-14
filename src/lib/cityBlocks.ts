// Blocs personnalisés de l'encart « Sur place à {ville} » (résultats de trajets et panneau de l'explorateur),
// affichés sous le lien vers le guide de la ville. Pour en ajouter un, il suffit d'ajouter un objet à CITY_BLOCKS.
//
// Exemple :
//   {
//     id: 'hostelworld',
//     icon: 'bed',
//     title: 'Auberges à {ville}',
//     text: 'Dortoirs et chambres privées près de la gare.',
//     href: 'https://www.hostelworld.com/…{ville}…',
//     sponsored: true,
//   },

export interface CityBlock {
  /** Identifiant unique, envoyé avec le clic dans Umami (événement clic-bloc). */
  id: string;
  /** Icône Material Symbols (https://fonts.google.com/icons), ex. 'bed', 'hotel', 'local_activity'. */
  icon: string;
  /** Titre ; {ville} est remplacé par le nom de la ville. */
  title: string;
  /** Phrase sous le titre (facultative) ; {ville} est remplacé aussi. */
  text?: string;
  /** Adresse du lien ; {ville} y est remplacé par le nom de la ville encodé pour une URL. */
  href: string;
  /** Lien d'affiliation : mention « lien partenaire » et rel="sponsored". */
  sponsored?: boolean;
  /** Villes où afficher le bloc (ex. ['Berlin', 'Bruxelles']). Absent : toutes les villes. */
  cities?: string[];
}

export const CITY_BLOCKS: CityBlock[] = [];
