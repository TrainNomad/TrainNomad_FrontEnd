// Découpage d'un trajet en billets à réserver : les trains qui se suivent chez un même vendeur se réservent
// ensemble (TER puis TGV : un billet SNCF ; plusieurs compagnies britanniques : un billet National Rail).
// Un Angers → Londres devient ainsi SNCF Angers → Paris (ou Lille, selon l'itinéraire), puis Eurostar.
import type { Journey, StopRef, TrainLeg } from '../types/api';
import { isTrainLeg } from '../types/api';

/** Flux d'opérateurs vendus ensemble (identifiant `operator` des trains → vendeur) */
const SELLER: Record<string, string> = { DB_REGIO: 'DB' };

export interface Ticket {
  /** Vendeur (identifiant d'opérateur) et nom affiché */
  seller: string;
  sellerName: string;
  from: StopRef;
  to: StopRef;
  departure: string;
  arrival: string;
  trains: TrainLeg[];
}

export function ticketsOf(journey: Journey): Ticket[] {
  const tickets: Ticket[] = [];
  for (const leg of journey.legs.filter(isTrainLeg)) {
    const seller = SELLER[leg.operator] ?? leg.operator;
    const last = tickets[tickets.length - 1];
    if (last && last.seller === seller) {
      last.to = leg.to;
      last.arrival = leg.arrival;
      last.trains.push(leg);
    } else {
      tickets.push({
        seller,
        sellerName: leg.operator_name,
        from: leg.from,
        to: leg.to,
        departure: leg.departure,
        arrival: leg.arrival,
        trains: [leg],
      });
    }
  }
  return tickets;
}
