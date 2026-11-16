import { Link } from 'react-router-dom';
import { CONTACT_EMAIL, LINKEDIN_URL } from '../lib/siteInfo';

// Entrées du menu du haut (Navbar), plus la page des liaisons
const NAV_LINKS = [
  { label: 'Voyager', href: '/trajets' },
  { label: 'Explorer', href: '/explorer' },
  { label: 'Guides', href: '/guides' },
  { label: 'Liaisons en train', href: '/train' },
  { label: 'Outils TGVmax', href: '/tgvmax' },
];

const SITE_LINKS = [
  { label: 'À propos', href: '/a-propos' },
  { label: 'Comment ça marche', href: '/comment-ca-marche' },
  { label: 'Questions fréquentes', href: '/#faq' },
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
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TrainNomad sur LinkedIn (nouvel onglet)"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
              </svg>
              Suivez-nous sur LinkedIn
            </a>
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

          {/* Le site */}
          <div>
            <h5 className="font-bold mb-8 text-lg">Le site</h5>
            <ul className="flex flex-col gap-5 text-base text-slate-400">
              {SITE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-emerald-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-emerald-400 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Quote */}
          <div>
            <h5 className="font-bold mb-8 text-lg">Notre Engagement</h5>
            <p className="text-base text-slate-300 italic leading-relaxed">
              "Choisir le train, c’est faire du chemin autrement : avec curiosité, confort et conscience."
            </p>
          </div>
        </div>

        {/* Indépendance et sources (détail dans les mentions légales) */}
        <p className="text-xs text-slate-500 leading-relaxed mb-10 max-w-4xl">
          TrainNomad est un site indépendant, sans lien avec SNCF Voyageurs ni avec aucun opérateur ferroviaire : il ne vend
          aucun billet, certains liens de réservation sont des liens partenaires. Horaires et disponibilités indicatifs, issus de données ouvertes : horaires mis à jour chaque semaine, places TGVmax chaque matin.
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