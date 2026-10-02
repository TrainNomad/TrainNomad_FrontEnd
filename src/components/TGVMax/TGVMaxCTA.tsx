export function TGVMaxCTA() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-[#F97316] to-[#EA8514] text-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white/10 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/10 translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Main message */}
        <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-[1.1]">
          Prêt à partir au bon moment?
        </h2>

        <p className="text-xl text-white/90 max-w-2xl mx-auto mb-12 leading-relaxed">
          Le prochain départ n'attend que vous. Lancez une recherche et découvrez les disponibilités de votre abonnement MAX.
        </p>

        {/* CTA Button */}
        <a
          href="#search"
          className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#F97316] font-bold text-lg rounded-full hover:bg-slate-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
        >
          <i className="fa-solid fa-search" />
          Lancer une recherche
        </a>
      </div>
    </section>
  );
}
