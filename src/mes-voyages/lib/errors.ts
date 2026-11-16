// Messages d'erreur affichés dans l'espace « Mes voyages ». Les codes viennent des fonctions serveur
// (supabase/functions) et de la base ; aucun détail technique n'est montré.

const MESSAGES: Record<string, string> = {
  unauthenticated: 'Votre session a expiré. Reconnectez-vous pour continuer.',
  length_required: "Le fichier n'a pas pu être envoyé. Réessayez.",
  too_large: 'Ce fichier dépasse la taille maximale autorisée (10 Mo).',
  unsupported_media_type: "Le fichier n'a pas pu être envoyé. Réessayez.",
  bad_request: "La demande est incomplète. Rechargez la page et réessayez.",
  empty: 'Ce fichier est vide.',
  not_pdf: "Ce fichier n'est pas un PDF. Seuls les billets au format PDF sont acceptés.",
  truncated: 'Ce PDF semble incomplet (envoi interrompu ou fichier endommagé).',
  trip_not_found: "Ce voyage n'existe plus ou ne vous appartient pas.",
  leg_not_found: "Cette étape n'existe plus.",
  rate_limited: "Trop d'envois en peu de temps. Réessayez dans une heure.",
  duplicate: 'Cet élément existe déjà.',
  quota_exceeded: "Vous avez atteint la limite de l'espace (nombre de voyages, de trajets ou de recherches).",
  confirmation_required: 'Confirmation manquante.',
  not_installed:
    "L'espace Mes voyages n'est pas encore installé sur le serveur (tables absentes). Il faut appliquer la migration de la base Supabase.",
  network: 'Connexion impossible. Vérifiez votre réseau et réessayez.',
  internal: 'Une erreur est survenue de notre côté. Réessayez dans quelques instants.',
};

export class MesVoyagesError extends Error {
  constructor(readonly code: string) {
    super(MESSAGES[code] ?? MESSAGES.internal);
  }
}

/** Erreur de la base (PostgREST) ou d'Auth → message lisible. */
export function fromSupabaseError(error: { message?: string; code?: string; status?: number } | null | undefined): MesVoyagesError {
  const message = error?.message ?? '';
  if (message.includes('quota_exceeded')) return new MesVoyagesError('quota_exceeded');
  if (error?.code === '23505') return new MesVoyagesError('duplicate');
  if (error?.code === 'PGRST205' || error?.code === 'PGRST202' || error?.code === '42P01') return new MesVoyagesError('not_installed');
  if (error?.code === 'PGRST301' || error?.status === 401 || /JWT/i.test(message)) return new MesVoyagesError('unauthenticated');
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) return new MesVoyagesError('network');
  return new MesVoyagesError('internal');
}

export const errorMessage = (err: unknown): string =>
  err instanceof MesVoyagesError ? err.message : fromSupabaseError(err as { message?: string }).message;
