// Compte : fournisseurs de connexion activés dans Supabase, nom de l'utilisateur, règles du mot de passe.
import type { User } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './supabase';

export type OAuthProvider = 'google' | 'facebook' | 'apple';
export const OAUTH_PROVIDERS: OAuthProvider[] = ['google', 'facebook', 'apple'];
export const PROVIDER_LABELS: Record<string, string> = {
  email: 'E-mail et mot de passe',
  google: 'Google',
  facebook: 'Facebook',
  apple: 'Apple',
};

let providersPromise: Promise<Record<OAuthProvider, boolean>> | null = null;

/**
 * Fournisseurs activés dans le tableau de bord Supabase (Authentication › Providers) : seuls ceux-là ont un bouton,
 * pour ne jamais envoyer l'utilisateur vers une page d'erreur.
 */
export function enabledProviders(): Promise<Record<OAuthProvider, boolean>> {
  providersPromise ??= fetch(`${SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY } })
    .then((res) => (res.ok ? res.json() : { external: {} }))
    .then((data: { external?: Record<string, boolean> }) => ({
      google: !!data.external?.google,
      facebook: !!data.external?.facebook,
      apple: !!data.external?.apple,
    }))
    .catch(() => ({ google: false, facebook: false, apple: false }));
  return providersPromise;
}

/** Prénom et nom : saisis à l'inscription, ou transmis par Google / Facebook */
export function profileOf(user: User | null | undefined): { firstName: string; lastName: string } {
  const m = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const first = m.first_name ?? m.given_name;
  const last = m.last_name ?? m.family_name;
  if (first || last) return { firstName: first ?? '', lastName: last ?? '' };
  const full = (m.full_name ?? m.name ?? '').trim();
  const [head, ...rest] = full.split(/\s+/);
  return { firstName: head ?? '', lastName: rest.join(' ') };
}

/** Règle commune à l'inscription, à la réinitialisation et au changement de mot de passe. */
export function passwordProblem(password: string, confirm?: string): string | null {
  if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (!/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) return 'Le mot de passe doit contenir au moins une lettre et un chiffre.';
  if (confirm !== undefined && confirm !== password) return 'Les deux mots de passe ne sont pas identiques.';
  return null;
}

/** Messages des erreurs d'authentification Supabase (codes stables, sinon texte). */
export function authErrorMessage(error: { message?: string; status?: number; code?: string } | null | undefined): string {
  const code = error?.code ?? '';
  const m = error?.message ?? '';
  const wait = m.match(/after (\d+) seconds?/i);
  if (wait) return `Patientez ${wait[1]} secondes avant de réessayer.`;
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(m)) return 'E-mail ou mot de passe incorrect.';
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(m)) return "Votre adresse n'est pas encore confirmée : ouvrez l'e-mail de confirmation (pensez aux indésirables).";
  if (code === 'user_already_exists' || /already registered/i.test(m)) return 'Un compte existe déjà avec cette adresse : connectez-vous, ou utilisez « Mot de passe oublié ».';
  if (code === 'weak_password' || /password should|weak/i.test(m)) return 'Mot de passe trop faible ou trop courant : choisissez-en un plus long.';
  if (code === 'same_password') return "Le nouveau mot de passe doit être différent de l'ancien.";
  if (code === 'reauthentication_needed') return 'Par sécurité, déconnectez-vous puis reconnectez-vous avant de changer de mot de passe.';
  if (code === 'over_email_send_rate_limit' || /email rate limit/i.test(m)) return "Trop d'e-mails envoyés récemment : réessayez dans une heure.";
  if (code === 'otp_expired' || /expired|invalid.*(otp|token)/i.test(m)) return 'Code ou lien expiré. Demandez-en un nouveau.';
  if (error?.status === 429 || /rate limit|too many/i.test(m)) return 'Trop de tentatives. Patientez quelques minutes.';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Connexion impossible. Vérifiez votre réseau.';
  return 'Une erreur est survenue. Réessayez dans quelques instants.';
}
