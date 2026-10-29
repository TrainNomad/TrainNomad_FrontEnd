import { Link } from 'react-router-dom';
import { ShareButton } from '../components/ShareButton';
import { TGVMaxSearchForm } from '../components/TGVMax/TGVMaxSearchForm';
import { FeaturedTrips } from '../components/TGVMax/FeaturedTrips';
import { HowItWorksSection } from '../components/TGVMax/HowItWorksSection';
import { TGVMaxQuestions } from '../components/TGVMax/TGVMaxQuestions';

export default function TGVMaxPage() {
  return (
    <div className="bg-white text-slate-900">
      {/* Hero Section with SearchBox */}
      {/* pas d'overflow-hidden ici : les suggestions d'autocomplétion doivent pouvoir déborder */}
      {/* Marge réduite sur mobile : le formulaire doit apparaître dès le premier écran */}
      <div className="relative bg-gradient-to-br from-[#f5f5f5] via-[#fafaf8] to-[#f0ebe5] pt-8 pb-16 md:py-32">
        {/* Logo en filigrane */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src="/assets/Logo/SVG/Trainnomad_blanc_svg.svg"
            alt=""
            className="absolute -left-32 top-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-5 -rotate-12"
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Colonne gauche - Texte */}
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 md:mb-6 leading-[1.1]">
                Les places à{' '}
                <span className="text-[#F97316]">0 €</span>
                <br />
                sont là.
              </h1>

              <p className="text-slate-600 text-lg md:text-xl leading-relaxed">
                Toutes les places MAX JEUNE et MAX SENIOR des 30 prochains jours, même quand le trajet direct affiche
                complet.
              </p>
              <ShareButton title="Places TGVmax disponibles" source="tgvmax" className="mt-6" />
            </div>

            {/* Colonne droite - SearchBox */}
            <div id="search">
              <TGVMaxSearchForm />
              <Link
                to="/tgvmax/explorer"
                className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-brand hover:text-brand-dark transition-colors"
              >
                <span className="material-symbols-outlined text-lg">explore</span>
                Pas d'idée de destination ? Explorer la carte TGVmax
              </Link>
              {/* Mention placée sous le formulaire pour ne pas le repousser hors de l'écran sur mobile */}
              <p className="mt-4 text-center text-xs text-slate-400">
                Site indépendant, sans lien avec SNCF Voyageurs. TGVmax, MAX JEUNE et MAX SENIOR sont des marques de SNCF Voyageurs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trajets du jour (tirés au sort par l'API) */}
      <FeaturedTrips />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Questions des abonnés MAX, puis retour au formulaire */}
      <TGVMaxQuestions />
    </div>
  );
}
