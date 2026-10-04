// Mesure d'audience Umami : sans cookie, sans identifiant persistant, statistiques agrégées.
import { UMAMI_SCRIPT_URL, UMAMI_WEBSITE_ID } from '../config';

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, string | number>) => void };
  }
}

/** Domaine du site réel : ni le site de test ni localhost ne sont comptés. */
const TRACKED_DOMAIN = 'trainnomad.eu';

/** Clé lue par le script Umami : si elle vaut "1", rien n'est envoyé depuis ce navigateur. */
const OPT_OUT_KEY = 'umami.disabled';

export const ANALYTICS_ENABLED = UMAMI_WEBSITE_ID !== '';

/** Charge le script Umami, qui compte ensuite lui-même les pages vues (changements de page compris). */
export function initAnalytics() {
  if (!ANALYTICS_ENABLED || typeof document === 'undefined') return;
  const script = document.createElement('script');
  script.defer = true;
  script.src = UMAMI_SCRIPT_URL;
  script.dataset.websiteId = UMAMI_WEBSITE_ID;
  script.dataset.domains = `${TRACKED_DOMAIN},www.${TRACKED_DOMAIN}`;
  // Les paramètres d'URL (gares, dates) ne sont pas enregistrés avec les pages vues
  script.dataset.excludeSearch = 'true';
  script.dataset.doNotTrack = 'true';
  document.head.appendChild(script);
}

/** Enregistre un événement (sans effet si la mesure d'audience est inactive ou bloquée). */
export function track(event: string, data?: Record<string, string | number>) {
  try {
    window.umami?.track(event, data);
  } catch {
    // la mesure d'audience ne doit jamais gêner le site
  }
}

export function isOptedOut(): boolean {
  try {
    return localStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    return false;
  }
}

export function setOptedOut(optedOut: boolean) {
  try {
    if (optedOut) localStorage.setItem(OPT_OUT_KEY, '1');
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {
    // stockage local indisponible (navigation privée stricte)
  }
}
