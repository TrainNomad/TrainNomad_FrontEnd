import { EuropeGlobe } from "./ui/EuropeGlobe";

  const europeanCities = {
    paris: { lat: 48.8566, lng: 2.3522, label: "Paris" },
    rennes: { lat: 48.1173, lng: -1.6778, label: "Rennes" },
    bordeaux: { lat: 44.8378, lng: -0.5792, label: "Bordeaux" },
    lyon: { lat: 45.764, lng: 4.8357, label: "Lyon" },
    london: { lat: 51.5074, lng: -0.1278, label: "Londres" },
    milan: { lat: 45.4642, lng: 9.19, label: "Milan" },
    madrid: { lat: 40.4168, lng: -3.7038, label: "Madrid" },
    porto: { lat: 41.1579, lng: -8.6291, label: "Porto" },
    barcelone: { lat: 41.3879, lng: 2.1699, label: "Barcelone" },
    seville: { lat: 37.3891, lng: -5.9845, label: "Séville" },
    amsterdam: { lat: 52.3676, lng: 4.9041, label: "Amsterdam" },
    berlin: { lat: 52.52, lng: 13.405, label: "Berlin" },
    bruxelles: { lat: 50.8503, lng: 4.3517, label: "Bruxelles" },
    prague: { lat: 50.0755, lng: 14.4378, label: "Prague" },
    edinbourg: { lat: 55.9533, lng: -3.1883, label: "Édimbourg" },
    rome: { lat: 41.9029, lng: 12.4964, label: "Rome" },
    palerme: { lat: 38.1939, lng: 13.3612, label: "Palerme" },
  };

  const europeanDots = [
    { start: europeanCities.paris, end: europeanCities.london },
    { start: europeanCities.paris, end: europeanCities.rennes },
    { start: europeanCities.paris, end: europeanCities.barcelone },
    { start: europeanCities.paris, end: europeanCities.lyon },
    { start: europeanCities.paris, end: europeanCities.milan },
    { start: europeanCities.bordeaux, end: europeanCities.paris },
    { start: europeanCities.madrid, end: europeanCities.porto },
    { start: europeanCities.madrid, end: europeanCities.barcelone },
    { start: europeanCities.madrid, end: europeanCities.seville },
    { start: europeanCities.milan, end: europeanCities.lyon },
    { start: europeanCities.london, end: europeanCities.amsterdam },
    { start: europeanCities.berlin, end: europeanCities.bruxelles },
    { start: europeanCities.bruxelles, end: europeanCities.prague },
    { start: europeanCities.edinbourg, end: europeanCities.london },
    { start: europeanCities.rome, end: europeanCities.palerme },
    { start: europeanCities.rome, end: europeanCities.milan },
  ];

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
            Parcourez les lignes déjà intégrées sur TrainNomad. De nouvelles liaisons et métropoles s'ajouteront progressivement à la carte.
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