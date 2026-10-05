import SearchBox from './SearchBox'; 

export function HeroSection() {
  return (
    <section className="relative z-20 pt-24 hero-gradient">
      <div className="max-w-7xl mx-auto px-6 text-center">

        {/* Badge */}
        {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-8">
          <i className="fa-solid fa-leaf" style={{ color: '#1d7a5a' }} />
          Le voyage responsable, simplifié
        </div> */}

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] max-w-4xl mx-auto">
          La voie vers l'{' '}
          <span className="text-[#1d7a5a]">Europe.</span>
        </h1>

        <p className="text-slate-500 text-lg md:text-xl max-w-3xl mx-auto mb-16 leading-relaxed">
          Itinéraires inspirants, correspondances entre réseaux et places TGVmax disponibles : tout ce qu'il faut pour préférer le rail, sans se compliquer le voyage.
        </p>

        <SearchBox />
      </div>
    </section>
  );
}
