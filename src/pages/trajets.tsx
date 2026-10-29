import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TrajetsSearchBox from '../components/SearchBoxLight';
import CardTrajet from '../components/CardTrajets';
import CardLoad from '../components/TripSkeleton';
import JourneyFilters, {
  NO_FILTERS,
  applyFilters,
  filtersFromParams,
  hasActiveFilters,
  writeFiltersToParams,
  type JourneyFilterValue,
} from '../components/JourneyFilters';
import { useNetwork } from '../network/NetworkContext';
import { track } from '../lib/analytics';
import type { Journey, SearchResponse } from '../types/api';
import { WakeUpNotice } from '../components/WakeUpNotice';
import { CityExtras } from '../components/CityExtras';
import { placeCity } from '../lib/cityGuides';
import { NoTripSuggestions } from '../components/NoTripSuggestions';
import { ShareButton } from '../components/ShareButton';
import { RoundTripHeader } from '../components/RoundTripHeader';
import { createVoyage, getVoyage, readOutboundDraft, saveOutboundDraft, saveVoyage, type VoyageLeg } from '../lib/voyages';

interface Query {
  origin: string;
  destination: string;
  date: string;
  time: string;
}

/** Recherche du retour : de l'arrivée de l'aller vers son départ, sans partir avant d'être arrivé. */
function returnQuery(outbound: VoyageLeg, returnDate: string): Query {
  const arrivalDate = outbound.journey.arrival.slice(0, 10);
  const date = returnDate > arrivalDate ? returnDate : arrivalDate;
  const time = date === arrivalDate ? outbound.journey.arrival.slice(11, 16) : '02:00';
  return { origin: outbound.to.id, destination: outbound.from.id, date, time };
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
  const navigate = useNavigate();

  // Aller-retour : date du retour (vide : aller simple) et aller choisi pendant le choix du retour.
  // Étapes : choix de l'aller, puis du retour (paramètre `aller` dans l'adresse), puis page du voyage.
  const [returnDate, setReturnDate] = useState('');
  const [outbound, setOutbound] = useState<VoyageLeg | null>(null);
  // Modification d'un sens d'un voyage enregistré (lien « Modifier » de la page du voyage) : le trajet
  // choisi remplace celui du voyage au lieu d'en créer un nouveau
  const [editing, setEditing] = useState<{ voyageId: string; leg: 'aller' | 'retour' } | null>(null);
  
  // Filtres : transmis à l'API et gardés dans l'adresse de la page (max_transfers, train_types)
  const [filters, setFilters] = useState<JourneyFilterValue>(NO_FILTERS);
  // Types de train possibles pour ce trajet (nom → grande vitesse) : ceux qui desservent le départ et
  // l'arrivée selon l'API, plus ceux vus dans les résultats. Ils restent proposés quand un filtre les masque.
  const [trainTypeOptions, setTrainTypeOptions] = useState<Record<string, boolean>>({});

  const rememberTrainTypes = (data: Pick<SearchResponse, 'journeys' | 'available_train_types'>) =>
    setTrainTypeOptions((prev) => {
      const next = { ...prev };
      for (const t of data.available_train_types ?? []) next[t.name] = t.high_speed;
      for (const j of data.journeys) {
        for (const t of j.train_types) {
          // Un trajet sans grande vitesse prouve que ses types sont lents. Sinon, un type inconnu est
          // compté comme rapide : « Sans grande vitesse » ne doit pas autoriser un ICE par erreur.
          if (j.high_speed === false) next[t] = false;
          else if (!(t in next)) next[t] = true;
        }
      }
      return next;
    });

  const filterParams = (f: JourneyFilterValue) => ({
    maxTransfers: f.maxTransfers ?? undefined,
    trainTypes: f.trainTypes,
    noLongWait: f.noLongWait,
  });

  // Numéro de la dernière recherche lancée : une réponse plus ancienne (filtres changés entre-temps) est ignorée
  const searchSeq = useRef(0);

  const fetchTrips = async (query: Query, activeFilters: JourneyFilterValue = filters) => {
    const seq = ++searchSeq.current;
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
        ...filterParams(activeFilters),
      });
      if (seq !== searchSeq.current) return;
      setAllTrips(data.journeys);
      rememberTrainTypes(data);
      setMeta({ from: data.from, to: data.to, next: data.next });
      track('recherche-trajet', {
        reseau: network.id,
        de: data.from.name,
        vers: data.to.name,
        resultats: data.journeys.length,
      });
    } catch (err) {
      if (seq !== searchSeq.current) return;
      console.error('Erreur lors de la récupération des trajets :', err);
      setError((err as Error).message || 'Impossible de contacter le serveur.');
    } finally {
      if (seq === searchSeq.current) {
        setIsLoading(false);
        setHasSearched(true);
      }
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
        ...filterParams(filters),
      });
      setAllTrips((prev) => {
        const known = new Set(prev.map((j) => j.id));
        return [...prev, ...data.journeys.filter((j) => !known.has(j.id))];
      });
      rememberTrainTypes(data);
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
      // la recherche porte désormais sur ce jour (jour suivant répété, changement de filtre)
      setLastQuery({ ...lastQuery, date: nextDateStr, time: '00:00' });
      
      // Si on n'a pas encore de données pour ce jour, on les charge
      const hasNextDayData = allTrips.some(trip => trip.departure.startsWith(nextDateStr));
      if (!hasNextDayData) {
        const data = await api.searchTrips({
          from: lastQuery.origin,
          to: lastQuery.destination,
          date: nextDateStr,
          time: '00:00',
          limit: 10,
          ...filterParams(filters),
        });
        setAllTrips((prev) => {
          const known = new Set(prev.map((j) => j.id));
          return [...prev, ...data.journeys.filter((j) => !known.has(j.id))];
        });
        rememberTrainTypes(data);
        setMeta({ from: data.from, to: data.to, next: data.next });
      }
      
      // Mettre à jour l'URL (les noms des gares et les filtres sont conservés) ; au retour, c'est sa date qui change
      const params = new URLSearchParams(window.location.search);
      if (outbound) {
        params.set('return_date', nextDateStr);
        setReturnDate(nextDateStr);
      } else {
        params.set('date', nextDateStr);
        params.set('departure_time', '00:00');
      }
      window.history.pushState({}, '', `${network.paths.trajets}?${params.toString()}`);
    } catch (err) {
      console.error('Erreur lors du chargement du jour suivant :', err);
    } finally {
      setIsLoadingNextDay(false);
    }
  };

  // Les filtres sont déjà appliqués par l'API ; on les réapplique aux trajets chargés
  const filteredTrips = useMemo(() => applyFilters(trips, filters), [trips, filters]);

  // Recherche décrite par l'adresse de la page : au chargement (arrivée depuis une autre page) et quand on
  // revient en arrière ou en avant dans l'historique (du choix du retour à celui de l'aller, par exemple)
  const loadFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const origin = params.get('departure') || params.get('origin');
    const destination = params.get('arrival') || params.get('destination');
    const date = params.get('date') || ''; // vide : l'API prend la date du jour (heure locale du départ)
    const time = params.get('departure_time') || params.get('time') || '02:00';
    if (!origin || !destination) return;

    const initialFilters = filtersFromParams(params);
    const ret = params.get('return_date') || params.get('returnDate') || '';
    setFilters(initialFilters);
    setReturnDate(ret);
    const voyageId = params.get('voyage');
    const leg = params.get('modifier');
    setEditing(voyageId && (leg === 'aller' || leg === 'retour') ? { voyageId, leg } : null);
    // Choix du retour : l'aller est retrouvé dans l'onglet ; sinon (lien partagé, onglet fermé), on repart de l'aller
    const draft = ret && params.get('aller') ? readOutboundDraft() : null;
    if (draft && draft.journey.id === params.get('aller')) {
      setOutbound(draft);
      fetchTrips(returnQuery(draft, ret), initialFilters);
      return;
    }
    if (params.has('aller')) {
      params.delete('aller');
      window.history.replaceState({}, '', `${network.paths.trajets}?${params.toString()}`);
    }
    setOutbound(null);
    setCurrentDate(date);
    fetchTrips({ origin, destination, date, time }, initialFilters);
  };

  useEffect(() => {
    loadFromUrl();
    window.addEventListener('popstate', loadFromUrl);
    return () => window.removeEventListener('popstate', loadFromUrl);
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
      ...(searchData.returnDate && { return_date: searchData.returnDate }),
    });
    window.history.pushState({}, '', `${network.paths.trajets}?${params.toString()}`);
    // Nouvelle recherche : filtres, types de train et aller choisi repartent de zéro
    setFilters(NO_FILTERS);
    setTrainTypeOptions({});
    setReturnDate(searchData.returnDate ?? '');
    setOutbound(null);
    setEditing(null);
    saveOutboundDraft(null);
    fetchTrips(
      {
        origin: searchData.origin,
        destination: searchData.destination,
        date: searchData.date,
        time: '02:00',
      },
      NO_FILTERS,
    );
    setCurrentDate(searchData.date);
    setAllTrips([]);
  };

  // Recherche sans résultat : relance le même trajet à un jour voisin proposé par NoTripSuggestions
  const searchOtherDate = (date: string) => {
    if (!lastQuery) return;
    const params = new URLSearchParams(window.location.search);
    if (outbound) {
      params.set('return_date', date);
      setReturnDate(date);
    } else {
      params.set('date', date);
      params.set('departure_time', '02:00');
    }
    window.history.pushState({}, '', `${network.paths.trajets}?${params.toString()}`);
    // Même trajet, autre jour : on garde les filtres choisis
    fetchTrips({ ...lastQuery, date, time: '02:00' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Choix d'un trajet : l'aller d'un aller-retour (puis recherche du retour), ou le dernier trajet du voyage
  const chooseJourney = (journey: Journey) => {
    if (!meta || !lastQuery) return;
    const leg: VoyageLeg = { from: meta.from, to: meta.to, date: lastQuery.date || journey.departure.slice(0, 10), journey };
    track('choix-trajet', { reseau: network.id, sens: outbound ? 'retour' : 'aller' });
    const edited = editing && getVoyage(editing.voyageId);
    if (editing && edited) {
      saveVoyage(editing.leg === 'retour' ? { ...edited, inbound: leg } : { ...edited, outbound: leg });
      saveOutboundDraft(null);
      navigate(`/voyage/${edited.id}`);
      return;
    }
    if (!outbound && returnDate) {
      setOutbound(leg);
      saveOutboundDraft(leg);
      const params = new URLSearchParams(window.location.search);
      params.set('aller', journey.id);
      window.history.pushState({}, '', `${network.paths.trajets}?${params.toString()}`);
      fetchTrips(returnQuery(leg, returnDate));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const voyage = outbound ? createVoyage(network.id, outbound, leg) : createVoyage(network.id, leg, null);
    saveOutboundDraft(null);
    navigate(`/voyage/${voyage.id}`);
  };

  // « Modifier » l'aller pendant le choix du retour : retour au choix de l'aller
  const editOutbound = () => {
    saveOutboundDraft(null);
    const params = new URLSearchParams(window.location.search);
    params.delete('aller');
    // On change aussi l'aller : ce n'est plus la modification du seul retour, le choix fera un nouveau voyage
    params.delete('voyage');
    params.delete('modifier');
    window.history.pushState({}, '', `${network.paths.trajets}?${params.toString()}`);
    loadFromUrl();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const chooseLabel = editing
    ? editing.leg === 'retour' ? 'Remplacer le retour' : "Remplacer l'aller"
    : !returnDate ? 'Choisir' : outbound ? 'Choisir ce retour' : 'Choisir cet aller';

  // Changement de filtre : adresse mise à jour, puis nouvelle recherche filtrée par l'API
  const handleFilterChange = (newFilters: JourneyFilterValue) => {
    setFilters(newFilters);
    const params = new URLSearchParams(window.location.search);
    writeFiltersToParams(params, newFilters);
    window.history.replaceState({}, '', `${network.paths.trajets}?${params.toString()}`);
    if (lastQuery) fetchTrips(lastQuery, newFilters);
  };

  // La barre reste affichée pendant le rechargement et quand les filtres ne donnent rien
  const showFilters = !error && lastQuery !== null && (trips.length > 0 || hasActiveFilters(filters) || (isLoading && Object.keys(trainTypeOptions).length > 0));

  const noFilterMatch = (
    <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center">
      <span className="material-symbols-outlined text-5xl text-amber-300 block mb-4">filter_alt_off</span>
      <p className="text-slate-500 font-medium">Aucun trajet ne correspond aux filtres actuels.</p>
      <p className="text-slate-400 text-sm mt-1">Essayez de modifier vos critères de filtrage.</p>
      <button
        onClick={() => handleFilterChange(NO_FILTERS)}
        className="mt-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-5 py-2 rounded-full font-bold text-sm transition-all shadow-sm"
      >
        Retirer les filtres
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 w-full max-w-[80rem] mx-auto px-4 py-6">

        {/* Barre de recherche — reçoit le callback handleSearchSubmit */}
        <TrajetsSearchBox onSearch={handleSearchSubmit} />

        {/* Zone résultats */}
        <div className="mt-4 px-6">
          {returnDate && lastQuery && (
            <RoundTripHeader step={outbound ? 1 : 0} outbound={outbound?.journey ?? null} onEditOutbound={editOutbound} />
          )}

          {showFilters && (
            <JourneyFilters value={filters} onChange={handleFilterChange} trainTypes={trainTypeOptions} />
          )}

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
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold text-slate-800">
                  {filteredTrips.length} trajet{filteredTrips.length > 1 ? 's' : ''} trouvé{filteredTrips.length > 1 ? 's' : ''}
                  {hasActiveFilters(filters) && (
                    <span className="text-sm font-normal text-slate-400 ml-2">(avec filtres)</span>
                  )}
                  {meta && (
                    <span className="block text-sm font-medium text-slate-400 mt-1">
                      {meta.from.name} → {meta.to.name}
                    </span>
                  )}
                </h2>
                {/* l'adresse de la page contient déjà la recherche (gares, date) */}
                <ShareButton
                  title={meta ? `${meta.from.name} → ${meta.to.name} en train` : 'Trajets en train'}
                  source="trajets"
                />
              </div>
              
              {filteredTrips.length > 0 ? (
                <>
                  {filteredTrips.map((trip) => (
                    <CardTrajet key={trip.id} journey={trip} onChoose={() => chooseJourney(trip)} chooseLabel={chooseLabel} />
                  ))}

                  {/* Boutons de pagination */}
                  <div className="flex justify-center gap-2 pt-2 flex-wrap">
                    {meta?.next && (
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

                  {/* Guide de la ville d'arrivée et blocs personnalisés (src/lib/cityBlocks.ts) */}
                  {meta && !outbound && <CityExtras city={placeCity(meta.to)} />}
                </>
              ) : (
                noFilterMatch
              )}
            </div>
          ) : hasSearched && hasActiveFilters(filters) ? (
            noFilterMatch
          ) : hasSearched && lastQuery && meta ? (
            <NoTripSuggestions
              origin={lastQuery.origin}
              destination={lastQuery.destination}
              originName={meta.from.name}
              destinationName={meta.to.name}
              date={currentDate}
              onPickDate={searchOtherDate}
            />
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
