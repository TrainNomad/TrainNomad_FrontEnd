// Les deux réseaux servis par le front. Les pages Trajets et Explorer et tous leurs composants
// sont communs : seuls l'API interrogée, les URLs, les textes et la couleur (thème CSS) changent.
import { API_BASE_URL, EXPLORER_MAX_TRANSFERS, TGVMAX_API_URL } from '../config';

export type NetworkId = 'europe' | 'tgvmax';

export interface NetworkConfig {
  id: NetworkId;
  /** URL de l'API Go (Backend/Europe ou Backend/tgvmax) */
  apiUrl: string;
  /** Classe CSS qui redéfinit les couleurs de la marque (voir styles/global.css) */
  themeClass: string;
  /** Pages de ce réseau */
  paths: { trajets: string; explorer: string };
  explorerMaxTransfers: number;
  /** Badge affiché sur les cartes de trajet (null = aucun) */
  badge: string | null;
  texts: {
    explorerTitle: string;
    explorerHint: string;
    noTrip: string;
  };
}

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  europe: {
    id: 'europe',
    apiUrl: API_BASE_URL,
    themeClass: 'theme-europe',
    paths: { trajets: '/trajets', explorer: '/explorer' },
    explorerMaxTransfers: EXPLORER_MAX_TRANSFERS,
    badge: null,
    texts: {
      explorerTitle: "Explorer l'Europe en train",
      explorerHint: 'Saisissez une gare de départ pour découvrir toutes les destinations accessibles.',
      noTrip: 'Aucun trajet trouvé pour cette recherche.',
    },
  },
  tgvmax: {
    id: 'tgvmax',
    apiUrl: TGVMAX_API_URL,
    themeClass: 'theme-tgvmax',
    paths: { trajets: '/tgvmax/trajets', explorer: '/tgvmax/explorer' },
    explorerMaxTransfers: EXPLORER_MAX_TRANSFERS,
    badge: 'MAX',
    texts: {
      explorerTitle: 'Où partir avec TGVmax ?',
      explorerHint: 'Saisissez une gare de départ pour voir toutes les destinations avec des places TGVmax disponibles.',
      noTrip: 'Aucune place TGVmax disponible pour cette recherche.',
    },
  },
};
