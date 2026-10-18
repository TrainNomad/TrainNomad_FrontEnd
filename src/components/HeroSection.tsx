import SearchBox from './SearchBox';
import { OperatorsStrip } from './OperatorsStrip';

export function HeroSection() {
  return (
    // Marges réduites sur mobile : le bouton « Rechercher » doit apparaître dès le premier écran
    <section className="relative z-20 pt-10 md:pt-24 hero-gradient">
      <div className="max-w-7xl mx-auto px-6 text-center">

        {/* Badge */}
        {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-8">
          <i className="fa-solid fa-leaf" style={{ color: '#1d7a5a' }} />
          Le voyage responsable, simplifié
        </div> */}

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 md:mb-8 leading-[1.1] max-w-5xl mx-auto">
          L'Europe en train,{' '}
          <span className="text-[#1d7a5a]">correspondances comprises.</span>
        </h1>

        <p className="text-slate-500 text-base sm:text-lg md:text-xl max-w-3xl mx-auto mb-8 md:mb-16 leading-relaxed">
          TrainNomad assemble les horaires des opérateurs ferroviaires européens pour trouver votre trajet, même quand il
          faut changer de train à la frontière.
        </p>

        <SearchBox />

        <OperatorsStrip />
      </div>
    </section>
  );
}
