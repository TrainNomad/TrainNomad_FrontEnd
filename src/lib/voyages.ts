// Voyages choisis sur la page Trajets (aller, et retour s'il y en a un), gardés dans le navigateur :
// pas de compte ni de serveur. Chaque sens garde la recherche qui l'a donné (lieux, date), pour pouvoir
// plus tard changer un trajet sans refaire tout le voyage ; `favorite` servira aux coups de cœur.
import type { Journey, Place } from '../types/api';
import type { NetworkId } from '../network/networks';

/** Un sens du voyage : le trajet choisi et la recherche dont il vient. */
export interface VoyageLeg {
  from: Place;
  to: Place;
  /** Date demandée (AAAA-MM-JJ) */
  date: string;
  journey: Journey;
}

export interface Voyage {
  id: string;
  network: NetworkId;
  createdAt: string;
  updatedAt: string;
  outbound: VoyageLeg;
  inbound: VoyageLeg | null;
  favorite: boolean;
}

const VOYAGES_KEY = 'voyages';
/** Aller choisi en attendant le retour (onglet en cours seulement) */
const OUTBOUND_KEY = 'voyage_aller';
/** Au-delà, les voyages les plus anciens sont oubliés (le stockage du navigateur est limité) */
const MAX_VOYAGES = 50;

// Stockage indisponible (navigation privée, données bloquées) : on lit une liste vide et on n'écrit rien
function read<T>(storage: () => Storage, key: string): T | null {
  try {
    const raw = storage().getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: unknown) {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, JSON.stringify(value));
  } catch {
    // quota dépassé ou stockage bloqué : le voyage reste affiché tant que la page est ouverte
  }
}

const local = () => localStorage;
const session = () => sessionStorage;

/** Voyages enregistrés, du plus récent au plus ancien. */
export function listVoyages(): Voyage[] {
  return read<Voyage[]>(local, VOYAGES_KEY) ?? [];
}

export function getVoyage(id: string): Voyage | null {
  return listVoyages().find((v) => v.id === id) ?? null;
}

/** Enregistre (ou remplace) un voyage, placé en tête de liste. */
export function saveVoyage(voyage: Voyage): Voyage {
  const saved = { ...voyage, updatedAt: new Date().toISOString() };
  const others = listVoyages().filter((v) => v.id !== voyage.id);
  write(local, VOYAGES_KEY, [saved, ...others].slice(0, MAX_VOYAGES));
  return saved;
}

export function createVoyage(network: NetworkId, outbound: VoyageLeg, inbound: VoyageLeg | null): Voyage {
  const now = new Date().toISOString();
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return saveVoyage({ id, network, createdAt: now, updatedAt: now, outbound, inbound, favorite: false });
}

/** Aller choisi, en attendant le choix du retour (retrouvé si la page est rechargée). */
export function saveOutboundDraft(leg: VoyageLeg | null) {
  write(session, OUTBOUND_KEY, leg);
}

export function readOutboundDraft(): VoyageLeg | null {
  return read<VoyageLeg>(session, OUTBOUND_KEY);
}
