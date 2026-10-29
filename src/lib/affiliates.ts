// Sites partenaires proposés derrière « Voir les prix » sur la page d'un voyage (liens d'affiliation).
// Pour en ajouter un (Trainline…) : une entrée de plus dans AFFILIATES, avec son lien de suivi.
import type { NetworkId } from '../network/networks';
import type { Ticket } from './tickets';
import { omioCityLink } from './omio';
import { sncfConnectLink } from './sncfConnect';

export interface Affiliate {
  id: string;
  name: string;
  /** Une ligne sous le nom : ce que l'on y trouve */
  description: string;
  /** Vendeurs (identifiants d'opérateur) dont ce site vend les billets ; absent = tous */
  sellers?: string[];
  /** Réseaux où ce site est proposé (TGVmax : seul SNCF Connect réserve les places MAX) */
  networks: NetworkId[];
  /** Lien de suivi vers les prix de ce billet, ou null si ce site ne connaît pas la liaison */
  link: (ticket: Ticket) => string | null;
}

export const AFFILIATES: Affiliate[] = [
  {
    id: 'sncf-connect',
    name: 'SNCF Connect',
    description: 'Ouvre les trains de ce trajet, à partir de l’heure du départ',
    sellers: ['SNCF'],
    networks: ['europe', 'tgvmax'],
    link: sncfConnectLink,
  },
  {
    id: 'omio',
    name: 'Omio',
    description: 'Compare les trains de plusieurs compagnies européennes',
    networks: ['europe'],
    link: (ticket) => omioCityLink(ticket.from, ticket.to),
  },
];

/** Sites partenaires qui proposent ce billet sur ce réseau, avec leur lien. */
export function affiliatesFor(ticket: Ticket, network: NetworkId): Array<{ affiliate: Affiliate; url: string }> {
  return AFFILIATES.flatMap((affiliate) => {
    if (!affiliate.networks.includes(network)) return [];
    if (affiliate.sellers && !affiliate.sellers.includes(ticket.seller)) return [];
    const url = affiliate.link(ticket);
    return url ? [{ affiliate, url }] : [];
  });
}
