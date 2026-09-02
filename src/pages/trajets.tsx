import React, { useState, useEffect } from 'react';
import TrajetsSearchBox from '../components/SearchBoxLight';
import CardTrajet from '../components/CardTrajets';
import CardLoad from '../components/TripSkeleton';

export default function Trajets() {
  const [trips, setTrips] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrips = async (origin: string, destination: string, date: string, departureTime: string) => {
    setIsLoading(true);
    setTrips([]);
    try {
      const response = await fetch(
        `/api/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${date}&departure_time=${encodeURIComponent(departureTime)}&limit=20`
      );
      const data = await response.json();
      const results = data.results || data.journeys || data.trajets || [];
      setTrips(results);
    } catch (error) {
      console.error('Erreur lors de la récupération des trajets :', error);
      setTrips([]);
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  };

  // Lecture des paramètres URL au chargement (arrivée depuis une autre page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const origin = params.get('departure') || params.get('origin');
    const destination = params.get('arrival') || params.get('destination');
    const date = params.get('date');
    const departureTime = params.get('departure_time') || '06:00:00';

    if (origin && date) {
      fetchTrips(origin, destination || 'Paris', date, departureTime);
    }
  }, []);

  // Déclenché au clic sur "Rechercher" dans la SearchBox
  const handleSearchSubmit = (searchData: { origin: string; destination: string; date: string; time: string }) => {
    // Met à jour l'URL sans recharger la page
    const newUrl = `/trajets?departure=${encodeURIComponent(searchData.origin)}&arrival=${encodeURIComponent(searchData.destination)}&date=${searchData.date}&departure_time=${encodeURIComponent(searchData.time)}`;
    window.history.pushState({}, '', newUrl);

    fetchTrips(searchData.origin, searchData.destination, searchData.date, searchData.time);
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5).replace(':', 'h');
  };

  const formatDuration = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 w-full max-w-[80rem] mx-auto px-4 py-6">

        {/* Barre de recherche — reçoit le callback handleSearchSubmit */}
        <TrajetsSearchBox onSearch={handleSearchSubmit} />

        {/* Zone résultats */}
        <div className="mt-4 px-6">
          {isLoading ? (
            // Skeleton pendant le chargement
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <CardLoad key={i} />
              ))}
            </div>
          ) : trips.length > 0 ? (
            // Résultats
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 mb-4">
                {trips.length} trajet{trips.length > 1 ? 's' : ''} trouvé{trips.length > 1 ? 's' : ''}
              </h2>
              {trips.map((trip, index) => (
                <CardTrajet
                  key={index}
                  departTime={formatTime(trip.train1_dep)}
                  arrivalTime={formatTime(trip.is_direct ? trip.train1_arr : trip.train2_arr)}
                  departureCity={trip.orig}
                  arrivalCity={trip.dest}
                  duration={formatDuration(trip.total_duration_min)}
                  trainName={trip.train1_type}
                  trainNumber={trip.train1_no}
                  date={trip.date}
                  isDirect={trip.is_direct}
                  transfersCount={trip.transfers_count}
                  transferStation={trip.transfer_station_arr}
                  train1Arr={formatTime(trip.train1_arr)}
                  train2Name={trip.train2_type}
                  train2Number={trip.train2_no}
                  train2Dep={formatTime(trip.train2_dep)}
                  train2Arr={formatTime(trip.train2_arr)}
                  layoverMinutes={trip.layover_minutes}
                />
              ))}
            </div>
          ) : hasSearched ? (
            // Aucun résultat
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 block mb-4">train</span>
              <p className="text-slate-500 font-medium">Aucun trajet trouvé pour cette recherche.</p>
              <p className="text-slate-400 text-sm mt-1">Essayez une autre date ou un autre itinéraire.</p>
            </div>
          ) : (
            // État initial — avant toute recherche
            // <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            //   <span className="material-symbols-outlined text-5xl text-slate-300 block mb-4">search</span>
            //   <p className="text-slate-500 font-medium">Renseignez votre départ, votre arrivée et une date.</p>
            // </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <CardLoad key={i} />
              ))}
            </div>
          
          )}
        </div>

      </main>
    </div>
  );
}