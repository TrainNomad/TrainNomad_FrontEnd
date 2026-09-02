import type { Destination } from '../types';

const DESTINATIONS_PATH = 'assets/Destinations';

const DESTINATIONS: Destination[] = [
  {
    id: 'rennes',
    name: 'Rennes, France',
    country: 'France',
    description: 'La Bretagne à portée de main pour un week-end',
    duration: '1h25',
    image: `${DESTINATIONS_PATH}/rennes.webp`,
    href: 'trajets.html?to=stop_area%3AOCE87471003&toName=Rennes&carte=Tarif%20Normal&tripType=oneway',
  },
  {
    id: 'milan',
    name: 'Milano Centrale, Italie',
    country: 'Italie',
    description: 'La Dolce Vita italienne en direct',
    duration: '7h00',
    image: `${DESTINATIONS_PATH}/milan.webp`,
    href: 'trajets.html?to=stop_area%3AOCE83000455&toName=Milano%20Centrale&carte=Tarif%20Normal&tripType=oneway',
  },
  {
    id: 'geneve',
    name: 'Genève, Suisse',
    country: 'Suisse',
    description: 'Évasion immédiate entre lac et montagnes',
    duration: '3h10',
    image: `${DESTINATIONS_PATH}/geneve.webp`,
    href: 'trajets.html?to=stop_area%3AOCE85010086&toName=Gen%C3%A8ve&carte=Tarif%20Normal&tripType=oneway',
  },
  {
    id: 'amsterdam',
    name: 'Amsterdam-Centraal, NL',
    country: 'Pays-Bas',
    description: 'Les canaux et l\'ambiance unique du Nord',
    duration: '3h20',
    image: `${DESTINATIONS_PATH}/amsterdam.webp`,
    href: 'trajets.html?to=stop_area%3AOCE84000582&toName=Amsterdam-Centraal&carte=Tarif%20Normal&tripType=oneway',
  },
];

export function DestinationsSection() {
  const handleCardClick = (href: string) => {
    window.location.href = href;
  };

  return (
    <section className="bg-transparent py-16">
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-midnight mb-2">
              Destinations bas carbone
            </h2>
            <p className="text-slate-500">Explorez l'Europe sans compromis pour la planète.</p>
          </div>
          <a
            href="explorer.html"
            className="text-sm font-bold border-b-2 border-primary pb-1 hover:text-primary transition-colors"
          >
            Explorer la carte
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {DESTINATIONS.map((dest) => (
            <DestinationCard
              key={dest.id}
              destination={dest}
              onClick={() => handleCardClick(dest.href)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── DestinationCard ──────────────────────────────────────────────────────────

interface DestinationCardProps {
  destination: Destination;
  onClick: () => void;
}

function DestinationCard({ destination, onClick }: DestinationCardProps) {
  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[4/5] rounded-3xl overflow-hidden mb-5">
        <img
          alt={destination.name}
          src={destination.image}
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-midnight shadow-sm flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-sm">schedule</span>
          <span>
            {destination.duration}{' '}
            <span className="text-slate-400">de Paris</span>
          </span>
        </div>
      </div>
      <h3 className="font-bold text-xl text-midnight mb-1">{destination.name}</h3>
      <p className="text-sm text-slate-500">{destination.description}</p>
    </div>
  );
}
