import { useEffect, useState } from 'react';
import { track } from '../lib/analytics';

interface Props {
  /** Titre proposé avec le lien (menu de partage du téléphone) */
  title: string;
  /** Lien partagé ; par défaut l'adresse de la page, paramètres de recherche compris */
  url?: string;
  /** Nom de l'endroit partagé, pour la mesure d'audience (« trajets », « guide »…) */
  source: string;
  /** `light` : sur fond blanc ; `glass` : sur une photo (en-tête des guides) ; `dark` : bouton principal */
  variant?: 'light' | 'glass' | 'dark';
  /** Texte du bouton, « Partager » par défaut */
  label?: string;
  className?: string;
}

/** Téléphones et tablettes : menu de partage du système (WhatsApp, SMS…) ; ordinateurs : copie du lien. */
const canShareNatively = () =>
  typeof navigator !== 'undefined' && typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches;

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // presse-papiers refusé (page non sécurisée, ancien navigateur) : sélection d'un champ caché
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    return ok;
  }
}

const VARIANTS = {
  light: 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm',
  glass: 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30',
  dark: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
};

/** Bouton « Partager » : le lien ouvre la même page (recherche, carte, guide) chez la personne qui le reçoit. */
export function ShareButton({ title, url, source, variant = 'light', label = 'Partager', className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [copied]);

  const share = async () => {
    const link = url ?? window.location.href;
    if (canShareNatively()) {
      try {
        await navigator.share({ title, url: link });
        track('partage', { source, mode: 'menu' });
      } catch {
        // partage annulé par la personne : rien à faire
      }
      return;
    }
    if (await copy(link)) {
      setCopied(true);
      track('partage', { source, mode: 'copie' });
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold transition-colors flex-shrink-0 ${VARIANTS[variant]} ${className}`}
    >
      {copied ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.2 10.9a2.25 2.25 0 1 0 0 2.2m0-2.2c.18.32.28.7.28 1.1s-.1.78-.28 1.1m0-2.2 9.6-5.3m-9.6 7.5 9.6 5.3m0 0a2.25 2.25 0 1 0 3.9 2.2 2.25 2.25 0 0 0-3.9-2.2Zm0-12.8a2.25 2.25 0 1 0 3.9-2.2 2.25 2.25 0 0 0-3.9 2.2Z"
          />
        </svg>
      )}
      {/* aria-live : « Lien copié » est annoncé aux lecteurs d'écran */}
      <span aria-live="polite">{copied ? 'Lien copié' : label}</span>
    </button>
  );
}
