import { EuropeGlobe } from "./ui/EuropeGlobe";
import { decodePolyline } from "../lib/traces";
import NETWORK from "../lib/globeNetwork.json";
import TRACES from "../lib/globeTraces.json";

// Villes et liaisons du globe : src/lib/globeNetwork.json (une ville sans « label » garde son point, sans nom affiché ;
// « labelSide » place le nom en dessous, à droite ou à gauche du point plutôt qu'au-dessus).
// Le parcours de chaque liaison sur les vraies voies
// (src/lib/globeTraces.json) est calculé par traces/globe.py dans le dépôt TrainNomad_GTFS, à relancer après
// avoir ajouté une ville, une liaison ou les tracés d'un pays. Une liaison sans parcours garde une courbe.
type CityKey = keyof typeof NETWORK.cities;
const paths: Record<string, string | undefined> = TRACES;

const europeanDots = (NETWORK.routes as Array<[CityKey, CityKey]>).map(([a, b]) => {
  const encoded = paths[`${a}-${b}`];
  return { start: NETWORK.cities[a], end: NETWORK.cities[b], path: encoded ? decodePolyline(encoded) : undefined };
});

export function EuropeSection() {
  return (
    <section className="w-full bg-slate-950 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Texte d'introduction */}
        <div className="max-w-xl space-y-3">
          <h3 className="text-3xl font-bold tracking-tight text-white">
            Les trajets actuellement disponibles
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            Parcourez les lignes intégrées sur TrainNomad, d'un pays à l'autre.
          </p>
        </div>

        {/* Globe zoomé sur l'Europe, qui se balance doucement */}
        <EuropeGlobe
          dots={europeanDots}
          lineColor="#10b981" // Tu peux ajuster la couleur des lignes ici
          className="w-full aspect-[3/4] md:aspect-[16/9]"
        />


      </div>
    </section>
  );
}