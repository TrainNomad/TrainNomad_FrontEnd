import { useState } from 'react';
import { Link } from 'react-router-dom';
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

  const toggleMobile = () => setMobileOpen((prev) => !prev);

  return (
    <>
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

          {/* Logo - Redirige vers l'accueil (Route /) */}
          <Link to="/" className="flex items-center gap-3 cursor-pointer">
            <img
              src="/assets/Logo/SVG/Trainnomad_vert_svg.svg"
              alt="TrainNomad Logo"
              className="w-10 h-10"
            />
            <span className="text-xl font-extrabold tracking-tight text-midnight">
              TrainNomad<span className="text-primary">.eu</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-bold hover:text-primary transition-colors flex items-center gap-2"
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
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Menu"
            >
              <span className="material-symbols-outlined text-midnight text-2xl">
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
        </div>
      )}
    </>
  );
}