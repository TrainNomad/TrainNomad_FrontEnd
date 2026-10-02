import { useState, useEffect, useMemo } from 'react';
import TrajetsSearchBox from '../components/SearchBoxLight';
import CardTrajet from '../components/CardTrajets';
import CardLoad from '../components/TripSkeleton';
import JourneyFilters from '../components/JourneyFilters';
import { useNetwork } from '../network/NetworkContext';
import type { Journey, SearchResponse } from '../types/api';
import { WakeUpNotice } from '../components/WakeUpNotice';

interface Query {
  origin: string;
  destination: string;
  date: string;
  time: string;
}

/** Page de recherche de trajets, commune aux réseaux Europe (/trajets) et TGVmax (/tgvmax/trajets). */
export default function Trajets() {
  const { api, network } = useNetwork();
  const [allTrips, setAllTrips] = useState<Journey[]>([]);
  const [meta, setMeta] = useState<Pick<SearchResponse, 'from' | 'to' | 'next'> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingNextDay, setIsLoadingNextDay] = useState(false);
  const [lastQuery, setLastQuery] = useState<Query | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  
  // État des filtres
  const [filters, setFilters] = useState({
    directOnly: false,
    trainTypes: [] as string[],
    maxTransfers: null as number | null,
  });

  const fetchTrips = async (query: Query) => {
    setIsLoading(true);
    setAllTrips([]);
    setMeta(null);
    setError(null);
    setLastQuery(query);
    setCurrentDate(query.date);
    try {
      const data = await api.searchTrips({
        from: query.origin,
        to: query.destination,
        date: query.date,
        time: query.time,
        limit: 10,
      });
      setAllTrips(data.journeys);
      setMeta({ from: data.from, to: data.to, next: data.next });
    } catch (err) {
      console.error('Erreur lors de la récupération des trajets :', err);
      setError((err as Error).message || 'Impossible de contacter le serveur.');
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  };

  // Filtrer les trajets par date
  const trips = useMemo(() => {
    if (!currentDate) return allTrips;
    return allTrips.filter(trip => {
      const tripDate = trip.departure.split('T')[0];
      return tripDate === currentDate;
    });
  }, [allTrips, currentDate]);

  // Trajets suivants : on repart de l'heure renvoyée par l'API (`next`)
  const fetchMore = async () => {
    if (!lastQuery || !meta?.next) return;
    setIsLoadingMore(true);
    try {
      const data = await api.searchTrips({
        from: lastQuery.origin,
        to: lastQuery.destination,
        date: meta.next.date,
        time: meta.next.time,
        limit: 10,
      });
      setAllTrips((prev) => {
        const known = new Set(prev.map((j) => j.id));
        return [...prev, ...data.journeys.filter((j) => !known.has(j.id))];
      });
      setMeta((prev) => (prev ? { ...prev, next: data.next } : prev));
    } catch (err) {
      console.error('Erreur lors du chargement des trajets suivants :', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Charger les trajets du jour suivant
  const fetchNextDay = async () => {
    if (!lastQuery) return;
    setIsLoadingNextDay(true);
    try {
      // Calculer la date du lendemain
      const currentDateObj = new Date(lastQuery.date || new Date().toISOString().split('T')[0]);
      const nextDate = new Date(currentDateObj);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];
      
      setCurrentDate(nextDateStr);
      
      // Si on n'a pas encore de données pour ce jour, on les charge
      const hasNextDayData = allTrips.some(trip => trip.departure.startsWith(nextDateStr));
      if (!hasNextDayData) {
        const data = await api.searchTrips({
          from: lastQuery.origin,
          to: lastQuery.destination,
          date: nextDateStr,
          time: '00:00',
          limit: 10,
        });
        setAllTrips((prev) => {
          const known = new Set(prev.map((j) => j.id));
          return [...prev, ...data.journeys.filter((j) => !known.has(j.id))];
        });
        setMeta({ from: data.from, to: data.to, next: data.next });
      }
      
      // Mettre à jour l'URL
      const params = new URLSearchParams({
        departure: lastQuery.origin,
        arrival: lastQuery.destination,
        date: nextDateStr,
        departure_time: '00:00',
      });
      window.history.pushState({}, '', `${network.paths.trajets}?${params.toString()}`);
      
      // Réinitialiser les filtres
      setFilters({
        directOnly: false,
        trainTypes: [],
        maxTransfers: null,
      });
    } catch (err) {
      console.error('Erreur lors du chargement du jour suivant :', err);
    } finally {
      setIsLoadingNextDay(false);
    }
  };

  // Filtrer les trajets en fonction des filtres sélectionnés
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      // Filtre : direct uniquement
      if (filters.directOnly && trip.transfers !== 0) {
        return false;
      }
      
      // Filtre : max transfers
      if (filters.maxTransfers !== null && trip.transfers > filters.maxTransfers) {
        return false;
      }
      
      // Filtre : types de train
      if (filters.trainTypes.length > 0) {
        const tripTrainTypes = new Set(trip.train_types);
        const hasMatchingType = filters.trainTypes.some((type) => tripTrainTypes.has(type));
        if (!hasMatchingType) {
          return false;
        }
      }
      
      return true;
    });
  }, [trips, filters]);

  // Lecture des paramètres URL au chargement (arrivée depuis une autre page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const origin = params.get('departure') || params.get('origin');
    const destination = params.get('arrival') || params.get('destination');
    const date = params.get('date') || ''; // vide : l'API prend la date du jour (heure locale du départ)
    const time = params.get('departure_time') || params.get('time') || '02:00';

    if (origin && destination) {
      setCurrentDate(date);
      fetchTrips({ origin, destination, date, time });
    }
  }, []);

  // Déclenché au clic sur "Rechercher" dans la SearchBox
  const handleSearchSubmit = (searchData: {
    origin: string;
    destination: string;
    originName: string;
    destinationName: string;
    date: string;
    returnDate?: string
  }) => {
    const params = new URLSearchParams({
      departure: searchData.origin,
      departure_name: searchData.originName,
      arrival: searchData.destination,
      arrival_name: searchData.destinationName,
      date: searchData.date,
      departure_time: '02:00',
    });
    window.history.pushState({}, '', `${network.paths.trajets}?${params.toString()}`);
    fetchTrips({
      origin: searchData.origin,
      destination: searchData.destination,
      date: searchData.date,
      time: '02:00'
    });
    
    // Réinitialiser les filtres et la date à chaque nouvelle recherche
    setFilters({
      directOnly: false,
      trainTypes: [],
      maxTransfers: null,
    });
    setCurrentDate(searchData.date);
    setAllTrips([]);
  };

  // Gestionnaire de changement de filtres
  const handleFilterChange = (newFilters: {
    directOnly: boolean;
    trainTypes: string[];
    maxTransfers: number | null;
  }) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 w-full max-w-[80rem] mx-auto px-4 py-6">

        {/* Barre de recherche — reçoit le callback handleSearchSubmit */}
        <TrajetsSearchBox onSearch={handleSearchSubmit} />

        {/* Zone résultats */}
        <div className="mt-4 px-6">
          {isLoading ? (
            <div className="space-y-4">
              <WakeUpNotice loading={isLoading} />
              {[...Array(5)].map((_, i) => (
                <CardLoad key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-red-100 p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-red-300 block mb-4">error</span>
              <p className="text-slate-600 font-medium">{error}</p>
              <p className="text-slate-400 text-sm mt-1">
                Vérifiez le nom des gares. Si le serveur était en veille, réessayez dans quelques secondes.
              </p>
            </div>
          ) : trips.length > 0 ? (
            <div className="space-y-4">
              {/* Filtres (uniquement si des trajets existent) */}
              {trips.length > 0 && (
                <JourneyFilters journeys={trips} onFilterChange={handleFilterChange} />
              )}

              <h2 className="text-xl font-bold text-slate-800 mb-4">
                {filteredTrips.length} trajet{filteredTrips.length > 1 ? 's' : ''} trouvé{filteredTrips.length > 1 ? 's' : ''}
                {filteredTrips.length < trips.length && (
                  <span className="text-sm font-normal text-slate-400 ml-2">
                    (filtrés parmi {trips.length})
                  </span>
                )}
                {meta && (
                  <span className="block text-sm font-medium text-slate-400 mt-1">
                    {meta.from.name} → {meta.to.name}
                  </span>
                )}
              </h2>
              
              {filteredTrips.length > 0 ? (
                <>
                  {filteredTrips.map((trip) => (
                    <CardTrajet key={trip.id} journey={trip} />
                  ))}

                  {/* Boutons de pagination */}
                  <div className="flex justify-center gap-2 pt-2 flex-wrap">
                    {meta?.next && filteredTrips.length === trips.length && (
                      <button
                        onClick={fetchMore}
                        disabled={isLoadingMore}
                        className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-5 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                      >
                        {isLoadingMore ? 'Chargement…' : 'Trajets suivants'}
                        <span className="material-symbols-outlined text-sm">expand_more</span>
                      </button>
                    )}
                    {lastQuery && (
                      <button
                        onClick={fetchNextDay}
                        disabled={isLoadingNextDay}
                        className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-5 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                      >
                        {isLoadingNextDay ? 'Chargement…' : 'Jour suivant'}
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-amber-300 block mb-4">filter_alt_off</span>
                  <p className="text-slate-500 font-medium">Aucun trajet ne correspond aux filtres actuels.</p>
                  <p className="text-slate-400 text-sm mt-1">Essayez de modifier vos critères de filtrage.</p>
                </div>
              )}
            </div>
          ) : hasSearched ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-slate-300 block mb-4">train</span>
              <p className="text-slate-500 font-medium">{network.texts.noTrip}</p>
              <p className="text-slate-400 text-sm mt-1">Essayez une autre date ou un autre itinéraire.</p>
            </div>
          ) : (
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
