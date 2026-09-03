// import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'À propos', href: '/a-propos' },
  { label: 'Destinations', href: '/trajets' },
  { label: 'Explorer', href: '/explorer' },
  { label: 'Guides', href: '/guide' },
  { label: 'Outils TGVMax', href: '/tgvmax' },
];

const LEGAL_LINKS = [
  { label: 'Mentions Légales', href: '../mention_legal.html' },
  { label: 'Confidentialité', href: '../confidentialite.html' },
  { label: 'Conditions', href: '../conditions.html' },
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
            <a href="../index.html" className="flex items-center gap-2 mb-8 group w-fit">
              <img
                src="/assets/Logo/SVG/Trainnomad_blanc_svg.svg"
                alt="TrainNomad Logo"
                className="w-8 h-8 transition-transform group-hover:scale-105"
              />
              <span className="text-xl font-extrabold tracking-tight text-white">
                TrainNomad<span className="text-emerald-500">.eu</span>
              </span>
            </a>
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
                  <a href={link.href} className="hover:text-emerald-400 transition-colors">
                    {link.label}
                  </a>
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

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-[11px] text-slate-500 uppercase tracking-[0.2em] font-bold">
          <p>© 2026 TrainNomad.eu - Engagé pour un futur durable.</p>
          <div className="flex gap-10">
            {LEGAL_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-white transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}