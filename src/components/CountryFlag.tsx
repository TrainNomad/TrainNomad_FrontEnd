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
  // Pays desservis par les trains allemands (DB, DB Regio) et européens de nuit
  PL: (
    <>
      <rect width="3" height="1" fill="#fff" />
      <rect y="1" width="3" height="1" fill="#DC143C" />
    </>
  ),
  LU: (
    <>
      <rect width="3" height="0.667" fill="#ED2939" />
      <rect y="0.667" width="3" height="0.667" fill="#fff" />
      <rect y="1.333" width="3" height="0.667" fill="#00A1DE" />
    </>
  ),
  DK: (
    <>
      <rect width="3" height="2" fill="#C8102E" />
      <rect x="0.86" width="0.29" height="2" fill="#fff" />
      <rect y="0.86" width="3" height="0.29" fill="#fff" />
    </>
  ),
  SE: (
    <>
      <rect width="3" height="2" fill="#006AA7" />
      <rect x="0.84" width="0.33" height="2" fill="#FECC02" />
      <rect y="0.84" width="3" height="0.33" fill="#FECC02" />
    </>
  ),
  HU: (
    <>
      <rect width="3" height="0.667" fill="#CE2939" />
      <rect y="0.667" width="3" height="0.667" fill="#fff" />
      <rect y="1.333" width="3" height="0.667" fill="#477050" />
    </>
  ),
  // Slovénie, Slovaquie, Croatie : bandes proches d'autres drapeaux, un écusson simplifié les distingue
  SI: (
    <>
      <rect width="3" height="0.667" fill="#fff" />
      <rect y="0.667" width="3" height="0.667" fill="#005DA4" />
      <rect y="1.333" width="3" height="0.667" fill="#ED1C24" />
      <path d="M0.55 0.3 H1.05 V0.8 Q0.8 1.05 0.55 0.8 Z" fill="#005DA4" stroke="#ED1C24" strokeWidth="0.04" />
    </>
  ),
  SK: (
    <>
      <rect width="3" height="0.667" fill="#fff" />
      <rect y="0.667" width="3" height="0.667" fill="#0B4EA2" />
      <rect y="1.333" width="3" height="0.667" fill="#EE1C25" />
      <path d="M0.7 0.4 H1.4 V1.1 Q1.05 1.5 0.7 1.1 Z" fill="#EE1C25" stroke="#fff" strokeWidth="0.05" />
      <path d="M1.05 0.5 V1.2 M0.88 0.72 H1.22 M0.82 0.92 H1.28" stroke="#fff" strokeWidth="0.07" />
    </>
  ),
  HR: (
    <>
      <rect width="3" height="0.667" fill="#FF0000" />
      <rect y="0.667" width="3" height="0.667" fill="#fff" />
      <rect y="1.333" width="3" height="0.667" fill="#171796" />
      <rect x="1.25" y="0.5" width="0.5" height="0.6" fill="#fff" stroke="#FF0000" strokeWidth="0.03" />
      <path d="M1.25 0.5 h0.167 v0.2 h-0.167 Z M1.583 0.5 h0.167 v0.2 h-0.167 Z M1.417 0.7 h0.166 v0.2 h-0.166 Z M1.25 0.9 h0.167 v0.2 h-0.167 Z M1.583 0.9 h0.167 v0.2 h-0.167 Z" fill="#FF0000" />
    </>
  ),
  MC: (
    <>
      <rect width="3" height="1" fill="#CE1126" />
      <rect y="1" width="3" height="1" fill="#fff" />
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
