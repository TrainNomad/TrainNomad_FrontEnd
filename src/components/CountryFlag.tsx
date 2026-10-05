import type { ReactNode } from 'react';

// Drapeaux dessinés en SVG : les émojis drapeaux ne s'affichent pas sous Windows (lettres « FR » à la place).
// Format 3:2, versions simplifiées (sans armoiries).
const FLAGS: Record<string, ReactNode> = {
  FR: (
    <>
      <rect width="1" height="2" fill="#0055A4" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#EF4135" />
    </>
  ),
  IT: (
    <>
      <rect width="1" height="2" fill="#009246" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#CE2B37" />
    </>
  ),
  BE: (
    <>
      <rect width="1" height="2" fill="#000" />
      <rect x="1" width="1" height="2" fill="#FDDA24" />
      <rect x="2" width="1" height="2" fill="#EF3340" />
    </>
  ),
  DE: (
    <>
      <rect width="3" height="0.667" fill="#000" />
      <rect y="0.667" width="3" height="0.667" fill="#DD0000" />
      <rect y="1.333" width="3" height="0.667" fill="#FFCE00" />
    </>
  ),
  NL: (
    <>
      <rect width="3" height="0.667" fill="#AE1C28" />
      <rect y="0.667" width="3" height="0.667" fill="#fff" />
      <rect y="1.333" width="3" height="0.667" fill="#21468B" />
    </>
  ),
  AT: (
    <>
      <rect width="3" height="2" fill="#ED2939" />
      <rect y="0.667" width="3" height="0.667" fill="#fff" />
    </>
  ),
  ES: (
    <>
      <rect width="3" height="2" fill="#AA151B" />
      <rect y="0.5" width="3" height="1" fill="#F1BF00" />
    </>
  ),
  PT: (
    <>
      <rect width="3" height="2" fill="#DA291C" />
      <rect width="1.2" height="2" fill="#046A38" />
      <circle cx="1.2" cy="1" r="0.42" fill="#FFE900" />
    </>
  ),
  CH: (
    <>
      <rect width="3" height="2" fill="#DA291C" />
      <rect x="1.3" y="0.4" width="0.4" height="1.2" fill="#fff" />
      <rect x="0.9" y="0.8" width="1.2" height="0.4" fill="#fff" />
    </>
  ),
  CZ: (
    <>
      <rect width="3" height="1" fill="#fff" />
      <rect y="1" width="3" height="1" fill="#D7141A" />
      <path d="M0 0 L1.5 1 L0 2 Z" fill="#11457E" />
    </>
  ),
  GB: (
    <>
      <rect width="3" height="2" fill="#012169" />
      <path d="M0 0 L3 2 M3 0 L0 2" stroke="#fff" strokeWidth="0.4" />
      <path d="M0 0 L3 2 M3 0 L0 2" stroke="#C8102E" strokeWidth="0.14" />
      <path d="M1.5 0 V2 M0 1 H3" stroke="#fff" strokeWidth="0.66" />
      <path d="M1.5 0 V2 M0 1 H3" stroke="#C8102E" strokeWidth="0.4" />
    </>
  ),
};

/** Drapeau du pays (code ISO à deux lettres). Rien n'est affiché pour un pays sans drapeau dessiné. */
export function CountryFlag({ code, className = 'h-3' }: { code: string; className?: string }) {
  const flag = FLAGS[code];
  if (!flag) return null;
  return (
    <svg viewBox="0 0 3 2" className={`${className} w-auto rounded-[2px] ring-1 ring-black/10 flex-shrink-0`} aria-hidden="true">
      {flag}
    </svg>
  );
}
