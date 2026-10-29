import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LEGAL_LINKS } from './Footer';
// import type { NavLink } from '../pages';

// Changer les hrefs dans NAV_LINKS
const NAV_LINKS = [
  { label: 'Voyager', href: '/trajets', icon: 'train' },
  { label: 'Explorer', href: '/explorer', icon: 'explore' },
  { label: 'Guides', href: '/guides', icon: 'menu_book' },
  { label: 'Outils TGVmax', href: '/tgvmax', icon: 'bolt' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Page d'un voyage : barre verte (vert du logo), dans le prolongement du globe en haut de la page
  const green = useLocation().pathname.startsWith('/voyage/');

  const toggleMobile = () => setMobileOpen((prev) => !prev);

  return (
    <>
      <nav
        className={`sticky top-0 z-[100] ${green ? 'bg-[#1d7a5a] text-white' : 'bg-white/80 backdrop-blur-md border-b border-slate-100'}`}
      >
        <div className="relative max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

          {/* Logo - Redirige vers l'accueil (Route /) */}
          <Link to="/" className="flex items-center gap-3 cursor-pointer">
            <img
              src={green ? '/assets/Logo/SVG/Trainnomad_blanc_svg.svg' : '/assets/Logo/SVG/Trainnomad_vert_svg.svg'}
              alt="TrainNomad Logo"
              className="w-10 h-10"
            />
            <span className={`text-xl font-extrabold tracking-tight ${green ? 'text-white' : 'text-midnight'}`}>
              TrainNomad<span className={green ? 'text-emerald-200' : 'text-primary'}>.eu</span>
            </span>
          </Link>

          {/* Desktop links : centrés sur l'écran (grand écran), et non dans l'espace laissé par le logo */}
          <div className="hidden md:flex items-center gap-10 lg:absolute lg:left-1/2 lg:-translate-x-1/2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-bold transition-colors flex items-center gap-2 ${green ? 'text-white/85 hover:text-white' : 'hover:text-primary'}`}
              >
                <span className="material-symbols-outlined text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile burger */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMobile}
              className={`md:hidden flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${green ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
              aria-label="Menu"
            >
              <span className={`material-symbols-outlined text-2xl ${green ? 'text-white' : 'text-midnight'}`}>
                {mobileOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile nav */}
      {mobileOpen && (
        <div id="mobile-nav" className="md:hidden flex flex-col gap-2 px-6 py-4 bg-white border-b border-slate-100">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 py-3 text-sm font-bold text-midnight hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-xl">{link.icon}</span>
              {link.label}
            </Link>
          ))}
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-3 mt-1 border-t border-slate-100">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-xs font-medium text-slate-500 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}