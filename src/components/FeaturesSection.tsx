import type { Feature } from '../types';

const FEATURES: Feature[] = [
  {
    icon: 'psychiatry',
    title: 'Expertise TGVmax',
    description:
      "Un moteur dedie aux abonnes MAX pour trouver instantanement les places disponibles a 0\u20AC sur l'ensemble du reseau TGV Inoui et Intercites.",
  },
  {
    icon: 'eco',
    title: 'Voyage responsable',
    description:
      "Le train reste le mode de transport le plus sobre sur les longues distances. TrainNomad vous aide a choisir le rail en toute simplicite, pour chaque trajet.",
  },
  {
    icon: 'smart_toy',
    title: 'Recherche intelligente',
    description:
      "Horaires precis, durees de trajet et correspondances sur de nombreux pays europeens \u2014 tous les operateurs reunis en un seul coup d'\u0153il.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-32 bg-transparent">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.icon} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  feature: Feature;
}

function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="size-14 bg-primary/10 rounded-2xl flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-3xl">
          {feature.icon}
        </span>
      </div>
      <h4 className="font-bold text-2xl">{feature.title}</h4>
      <p className="text-slate-500 leading-relaxed text-lg">{feature.description}</p>
    </div>
  );
}
