import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'À propos', href: '/a-propos' },
  { label: 'Comment ça marche', href: '/comment-ca-marche' },
  { label: 'Voyager', href: '/trajets' },
  { label: 'Explorer', href: '/explorer' },
  { label: 'Guides', href: '/guides' },
  { label: 'Outils TGVmax', href: '/tgvmax' },
];

// Aussi affichés dans le menu mobile de la Navbar : ils restent accessibles sur les pages
// sans pied de page (carte Explorer sur téléphone).
export const LEGAL_LINKS = [
  { label: 'Mentions Légales', href: '/mentions-legales' },
  { label: 'Confidentialité', href: '/confidentialite' },
  { label: 'Conditions', href: '/conditions' },
];

export function Footer() {
  return (
    <footer className="w-full bg-slate-950 text-white py-20">
      <div className="max-w-7xl mx-auto px-6">

        <div
          className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-16 mb-12"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '2rem', paddingTop: '2rem' }}
        >
          {/* Brand */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-8 group w-fit">
              <img
                src="/assets/Logo/SVG/Trainnomad_blanc_svg.svg"
                alt="TrainNomad Logo"
                className="w-8 h-8 transition-transform group-hover:scale-105"
              />
              <span className="text-xl font-extrabold tracking-tight text-white">
                TrainNomad<span className="text-emerald-500">.eu</span>
              </span>
            </Link>
            <p className="text-slate-400 text-base leading-relaxed">
              Simplifier le rail européen pour donner envie d'aller plus loin, avec une empreinte plus légère.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h5 className="font-bold mb-8 text-lg">Navigation</h5>
            <ul className="flex flex-col gap-5 text-base text-slate-400">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-emerald-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quote */}
          <div className="md:col-span-2">
            <h5 className="font-bold mb-8 text-lg">Notre Engagement</h5>
            <p className="text-base text-slate-300 italic max-w-lg leading-relaxed">
              "Choisir le train, c’est faire du chemin autrement : avec curiosité, confort et conscience."
            </p>
          </div>
        </div>

        {/* Indépendance et sources (détail dans les mentions légales) */}
        <p className="text-xs text-slate-500 leading-relaxed mb-10 max-w-4xl">
          TrainNomad est un site indépendant, sans lien avec SNCF Voyageurs ni avec aucun opérateur ferroviaire : il ne vend
          aucun billet. Horaires et disponibilités indicatifs, issus de données ouvertes : horaires mis à jour chaque semaine, places TGVmax chaque matin.
          Contient des données SNCF Voyageurs, disponibles sous licence ODbL.{' '}
          <Link to="/mentions-legales" className="underline hover:text-white">Sources et licences</Link>
        </p>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-[11px] text-slate-500 uppercase tracking-[0.2em] font-bold">
          <p>© 2026 TrainNomad.eu - Engagé pour un futur durable.</p>
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} to={link.href} className="hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}