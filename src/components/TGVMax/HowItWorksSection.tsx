export function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Choisissez votre trajet',
      description:
        "Départ, arrivée et date : le moteur de recherche TGVmax repère immédiatement les disponibilités avec votre abonnement MAX.",
      icon: 'fa-magnifying-glass',
    },
    {
      number: '02',
      title: 'Repérez les places',
      description:
        "Seuls les trains avec une place MAX disponible sont proposés, d'après les données SNCF mises à jour chaque matin.",
      icon: 'fa-eye',
    },
    {
      number: '03',
      title: 'Changez de siège en route',
      description:
        "Trajet complet ? Le moteur combine deux billets MAX dans le même train : vous changez simplement de siège à un arrêt intermédiaire.",
      icon: 'fa-shuffle',
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Votre abonnement.
            <br />
            <span className="text-[#F97316]">Votre liberté.</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Un outil pensé pour les abonnés MAX : trouver une place, même quand le trajet direct affiche complet.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
            >
              {/* Card */}
              <div className="h-full bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-8 hover:border-[#F97316]/30 hover:shadow-lg transition-all">
                {/* Step number */}
                <div className="text-5xl font-bold text-[#F97316]/10 mb-4">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-[#F97316]/10 flex items-center justify-center mb-6 group-hover:bg-[#F97316]/20 transition-colors">
                  <i className={`fa-solid ${step.icon} text-[#F97316] text-xl`} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-slate-600 leading-relaxed text-sm">
                  {step.description}
                </p>

                {/* Connector line (for desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-[#F97316]/30 to-transparent" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
