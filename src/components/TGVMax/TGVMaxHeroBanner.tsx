const tgvmaxLogo = '/assets/Logo/SVG/Trainnomad_blanc_svg.svg';

export function TGVMaxHeroBanner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#f5f5f5] via-[#fafaf8] to-[#f0ebe5] py-20 md:py-32">
      {/* Logo en filigrane - arrière-plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={tgvmaxLogo}
          alt=""
          className="absolute -right-32 top-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-5 rotate-12"
        />
      </div>

      {/* Contenu principal - layout 2 colonnes */}
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Colonne gauche - Texte */}
          <div>
            {/* Titre principal */}
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Les places à{' '}
              <span className="text-[#F97316]">o€</span>
              <br />
              sont là.
            </h1>

            {/* Sous-titre */}
            <p className="text-slate-600 text-lg md:text-xl leading-relaxed">
              Repérez les disponibilités TGV Inoui et Intercités en quelques secondes.<br />
              Votre abonnement MAX, votre prochaine escapade.
            </p>
          </div>

          {/* Colonne droite - Searchbox sera injectée ici */}
          {/* Le contenu de la searchbox sera ajouté via le layout de la page */}
        </div>
      </div>
    </div>
  );
}
