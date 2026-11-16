// Connexion Google « intégrée » (Google Identity Services) : la fenêtre Google affiche « Se connecter à
// trainnomad.eu » (l'adresse du site) au lieu de l'adresse technique de Supabase. Google renvoie un jeton
// d'identité signé, que Supabase vérifie (signInWithIdToken) avant d'ouvrir la session.
//
// Le script de Google n'est chargé que sur la page de connexion, et seulement si VITE_GOOGLE_CLIENT_ID est défini ;
// sinon, le bouton Google utilise la redirection classique de Supabase.
import { supabase } from './supabase';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

interface CredentialResponse {
  credential: string;
}
interface GoogleId {
  initialize(options: {
    client_id: string;
    callback: (r: CredentialResponse) => void;
    nonce: string;
    ux_mode?: 'popup';
    use_fedcm_for_prompt?: boolean;
    itp_support?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number>): void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  scriptPromise ??= new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('google_script'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Affiche le bouton officiel Google dans `parent`. Au clic, Google ouvre sa fenêtre ; le jeton reçu ouvre la session
 * Supabase (le « nonce » empêche la réutilisation d'un jeton intercepté).
 */
export async function mountGoogleButton(
  parent: HTMLElement,
  handlers: { onSignedIn: () => void; onError: (error: { message?: string; code?: string }) => void },
): Promise<void> {
  await loadScript();
  const nonce = crypto.randomUUID() + crypto.randomUUID();
  window.google!.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    nonce: await sha256Hex(nonce),
    ux_mode: 'popup',
    itp_support: true,
    use_fedcm_for_prompt: true,
    callback: async ({ credential }) => {
      const { error } = await supabase().auth.signInWithIdToken({ provider: 'google', token: credential, nonce });
      if (error) handlers.onError(error);
      else handlers.onSignedIn();
    },
  });
  parent.replaceChildren();
  window.google!.accounts.id.renderButton(parent, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    shape: 'rectangular',
    text: 'continue_with',
    logo_alignment: 'center',
    locale: 'fr',
    width: Math.min(parent.clientWidth || 320, 400),
  });
}
