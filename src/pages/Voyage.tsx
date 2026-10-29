import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CardTrajet from '../components/CardTrajets';
import { ShareButton } from '../components/ShareButton';
import { TripStepper } from '../components/RoundTripHeader';
import { EuropeGlobe } from '../components/ui/EuropeGlobe';
import { NetworkScope } from '../network/NetworkContext';
import { NETWORKS, type NetworkId } from '../network/networks';
import { estimateCarbon, estimateCarbonOnTracks, formatKg, type CarbonEstimate } from '../lib/carbon';
import { formatDateShort, formatDuration, formatTime } from '../lib/format';
import { getVoyage, saveOutboundDraft, type Voyage, type VoyageLeg } from '../lib/voyages';
import { legPath, type LatLng } from '../lib/traces';
import { isTrainLeg, type Journey } from '../types/api';
import { ticketsOf, type Ticket } from '../lib/tickets';
import { affiliatesFor } from '../lib/affiliates';
import { track } from '../lib/analytics';

type LegKey = 'aller' | 'retour';

/** Globe sur le vert du logo : globe vert foncé, halo et terres en blanc */
const GLOBE_PALETTE = { body: ['#13513c', '#196a4e'] as [string, string], glow: '255,255,255', land: 'rgba(255,255,255,0.45)' };

/** Page Trajets pour ce voyage : même recherche, ou remplacement d'un des deux sens (`modifier`). */
function tripsLink(voyage: Voyage, modify?: LegKey): string {
  const { from, to, date, journey } = voyage.outbound;
  const params = new URLSearchParams({
    departure: from.id,
    departure_name: from.name,
    arrival: to.id,
    arrival_name: to.name,
    date,
    ...(voyage.inbound && { return_date: voyage.inbound.date }),
    ...(modify && { voyage: voyage.id, modifier: modify }),
    // Retour à remplacer : la page Trajets s'ouvre directement sur le choix du retour, avec cet aller
    ...(modify === 'retour' && { aller: journey.id }),
  });
  return `${NETWORKS[voyage.network].paths.trajets}?${params.toString()}`;
}

/** Un billet à réserver ; « Voir les prix » (« Réserver » pour TGVmax) ouvre la liste des sites partenaires qui le
    vendent (src/lib/affiliates.ts). */
function TicketRow({ ticket, network }: { ticket: Ticket; network: NetworkId }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const offers = affiliatesFor(ticket, network);
  const types = [...new Set(ticket.trains.map((t) => t.train_type))].join(' + ');

  // Le menu se ferme au clic à côté et avec Échap
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !menuRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-slate-800">
          {ticket.from.name} → {ticket.to.name}
        </div>
        <div className="text-xs text-slate-500">
          {ticket.sellerName} · {formatTime(ticket.departure, 'h')} – {formatTime(ticket.arrival, 'h')} · {types}
        </div>
      </div>
      {offers.length > 0 && (
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
          >
            {network === 'tgvmax' ? 'Réserver' : 'Voir les prix'}
            <span className={`material-symbols-outlined text-sm transition-transform ${open ? 'rotate-180' : ''}`}>expand_more</span>
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-2 z-20 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 shadow-xl p-2">
              {/* Les trains de ce billet, pour retrouver les mêmes sur le site partenaire */}
              <p className="px-3 pt-2 text-[11px] font-semibold text-slate-500">
                {ticket.trains.length > 1 ? `Les ${ticket.trains.length} trains à choisir` : 'Le train à choisir'} sur le site, départ à {formatTime(ticket.departure, 'h')}
              </p>
              <ol className="px-3 pt-2 pb-3 mb-1 border-b border-slate-100 space-y-2.5">
                {ticket.trains.map((train, i) => (
                  <li key={i} className="text-xs">
                    <div className="font-bold text-slate-800">
                      {train.train_type}
                      {train.train_number && <span className="font-semibold text-slate-400"> · n° {train.train_number}</span>}
                    </div>
                    <div className="text-slate-500">
                      {formatTime(train.departure, 'h')} {train.from.name} → {formatTime(train.arrival, 'h')} {train.to.name}
                    </div>
                  </li>
                ))}
              </ol>
              {offers.map(({ affiliate, url }) => (
                <a
                  key={affiliate.id}
                  href={url}
                  target="_blank"
                  rel="sponsored noopener"
                  onClick={() => {
                    track('clic-partenaire', { partenaire: affiliate.id, source: 'voyage', from: ticket.from.city, to: ticket.to.city });
                    setOpen(false);
                  }}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-800">{affiliate.name}</span>
                    <span className="block text-xs text-slate-500">{affiliate.description}</span>
                  </span>
                  <span className="material-symbols-outlined text-base text-slate-400">arrow_forward</span>
                </a>
              ))}
              <p className="px-3 pt-1.5 pb-1 text-[10px] text-slate-400">Liens partenaires : TrainNomad peut toucher une commission, sans surcoût pour vous.</p>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function Stat({ icon, label, value, hint }: { icon: string; label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <span className="material-symbols-outlined text-base text-tone-600">{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-extrabold text-slate-900 mt-2">{value}</div>
      {hint && <div className="text-xs text-slate-400 mt-0.5">{hint}</div>}
    </div>
  );
}

/**
 * Voyage choisi sur la page Trajets (aller, et retour s'il y en a un), lu dans le navigateur (src/lib/voyages.ts) :
 * carte en pointillés, trajets (mêmes cartes que la recherche), chiffres clés, et « Modifier » pour remplacer un sens.
 */
export default function VoyagePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const voyage = useMemo(() => getVoyage(id), [id]);
  const legs = useMemo<Array<[LegKey, string, VoyageLeg]>>(
    () => (voyage ? [['aller', 'Aller', voyage.outbound], ...(voyage.inbound ? [['retour', 'Retour', voyage.inbound] as [LegKey, string, VoyageLeg]] : [])] : []),
    [voyage],
  );
  const journeys = useMemo(() => legs.map(([, , leg]) => leg.journey), [legs]);
  // Globe : une ligne par trajet, du départ à l'arrivée, sur les voies une fois les tracés chargés
  // (traits droits d'arrêt en arrêt en attendant) ; tout le voyage, ou seulement l'aller ou le retour
  const [shown, setShown] = useState<LegKey | 'voyage'>('voyage');
  const [tracks, setTracks] = useState<LatLng[][]>([]);
  useEffect(() => {
    const trainsOf = (j: Journey) => j.legs.filter(isTrainLeg);
    const straight = journeys.map((j) => trainsOf(j).flatMap((leg) => leg.stops.map((s): LatLng => [s.lat, s.lon])));
    setTracks(straight);
    let current = true;
    Promise.all(journeys.map((j) => Promise.all(trainsOf(j).map(legPath)).then((paths) => paths.flatMap((p) => p.points))))
      .then((onTracks) => current && setTracks(onTracks.map((points, i) => (points.length > 1 ? points : straight[i]))))
      .catch(() => {
        // pas de tracé : on garde les traits droits
      });
    return () => {
      current = false;
    };
  }, [journeys]);
  const globeDots = useMemo(() => {
    // Tout le voyage : un retour par les mêmes gares que l'aller n'est pas redessiné par-dessus
    const route = (j: Journey) => j.legs.filter(isTrainLeg).flatMap((l) => [l.from.id, l.to.id]);
    const sameAsOutbound = (j: Journey) => route(j).reverse().join() === route(journeys[0]).join();
    return legs.flatMap(([key, , leg], i) => {
      if (shown === 'voyage' ? i > 0 && sameAsOutbound(leg.journey) : shown !== key) return [];
      const { from, to } = leg.journey;
      return [
        {
          start: { lat: from.lat, lng: from.lon, label: from.city || from.name },
          end: { lat: to.lat, lng: to.lon, label: to.city || to.name },
          path: tracks[i],
        },
      ];
    });
  }, [legs, journeys, shown, tracks]);

  // Empreinte carbone de tout le voyage : estimation immédiate, puis distance mesurée sur les voies
  const [carbon, setCarbon] = useState<CarbonEstimate[]>([]);
  useEffect(() => {
    setCarbon(journeys.map(estimateCarbon).filter((c): c is CarbonEstimate => c !== null));
    let current = true;
    Promise.all(journeys.map(estimateCarbonOnTracks)).then(
      (onTracks) => current && setCarbon(onTracks.filter((c): c is CarbonEstimate => c !== null)),
    );
    return () => {
      current = false;
    };
  }, [journeys]);

  if (!voyage) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md">
          <span className="material-symbols-outlined text-5xl text-slate-300 block mb-4">train</span>
          <p className="text-slate-600 font-medium">Ce voyage n'est pas enregistré sur cet appareil.</p>
          <p className="text-slate-400 text-sm mt-1">Les voyages sont gardés dans le navigateur où ils ont été choisis.</p>
          <Link to="/trajets" className="inline-block mt-5 bg-brand text-white px-5 py-2 rounded-full font-bold text-sm">
            Rechercher un trajet
          </Link>
        </div>
      </div>
    );
  }

  const { outbound, inbound } = voyage;
  const modify = (leg: LegKey) => {
    // Remplacer le retour : la page Trajets retrouve l'aller dans l'onglet et s'ouvre sur le choix du retour
    saveOutboundDraft(leg === 'retour' ? outbound : null);
    navigate(tripsLink(voyage, leg));
  };
  const lastLeg: LegKey = inbound ? 'retour' : 'aller';

  const trainKg = carbon.reduce((sum, c) => sum + c.trainKg, 0);
  const otherKg = carbon.reduce((sum, c) => sum + c.otherKg, 0);
  const other = carbon[0]?.other === 'plane' ? "l'avion" : 'la voiture';
  const totalMinutes = journeys.reduce((sum, j) => sum + j.duration_min, 0);
  const totalTransfers = journeys.reduce((sum, j) => sum + j.transfers, 0);
  // Un aller remplacé peut arriver après le départ du retour
  const overlap = inbound && new Date(inbound.journey.departure) < new Date(outbound.journey.arrival);
  const title = `${outbound.from.name} ${inbound ? '⇄' : '→'} ${outbound.to.name} en train`;

  return (
    <NetworkScope network={voyage.network}>
      <div className="min-h-screen bg-gray-50">
        {/* En haut de la page, dans le prolongement de la barre de navigation verte : le globe de l'accueil sur toute
            la largeur, immobile, avec le voyage tracé du départ à l'arrivée */}
        <section className="relative bg-[#1d7a5a]">
          <EuropeGlobe
            dots={globeDots}
            lineColor="#bbf7d0"
            fitRoutes
            sway={0}
            loop={false}
            draggable={false}
            palette={GLOBE_PALETTE}
            className="w-full h-64 md:h-96"
          />
          {inbound && (
            <div
              className="absolute top-4 right-4 flex gap-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 p-1"
              role="group"
              aria-label="Sens affiché sur le globe"
            >
              {(['aller', 'retour', 'voyage'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setShown(key)}
                  aria-pressed={shown === key}
                  className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-colors ${
                    shown === key ? 'bg-white text-[#1d7a5a]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          )}
        </section>

        <main className="w-full max-w-[80rem] mx-auto px-4 py-6 space-y-6">
          {/* Retour au choix du dernier trajet, aligné avec les étapes */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 px-6">
            <button
              onClick={() => modify(lastLeg)}
              className="justify-self-start text-sm font-bold text-tone-600 hover:text-tone-700 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              {inbound ? 'Modifier le retour' : "Modifier l'aller"}
            </button>
            {inbound && <TripStepper step={2} />}
          </div>

          <header className="px-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-tone-600">Votre itinéraire</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
              Mon voyage <span className="text-brand">est prêt.</span>
            </h1>
            <p className="mt-3 text-slate-500">
              {outbound.from.name} {inbound ? '⇄' : '→'} {outbound.to.name}
              {' · '}
              <span className="first-letter:uppercase">{formatDateShort(outbound.journey.departure)}</span>
              {inbound && ` – ${formatDateShort(inbound.journey.departure)}`}
            </p>
          </header>


          {overlap && (
            <p className="mx-6 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
              Le retour part avant l'arrivée de l'aller : modifiez l'un des deux trajets.
            </p>
          )}

          {legs.map(([key, label, leg]) => (
            <section key={key} className="space-y-2">
              <div className="flex items-center justify-between gap-3 px-6">
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-tone-600">
                  {label} · {leg.from.name} → {leg.to.name}
                </h2>
                <button
                  onClick={() => modify(key)}
                  className="text-xs font-bold text-tone-600 hover:text-tone-700 flex items-center gap-1"
                >
                  Modifier <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
              <CardTrajet journey={leg.journey} />
            </section>
          ))}

          {/* Billets à réserver : un par vendeur (Angers → Londres : SNCF jusqu'à Paris ou Lille, puis Eurostar) */}
          <section className="mx-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-slate-900">Vos billets</h2>
            <p className="text-xs text-slate-500 mt-1">
              TrainNomad ne vend pas de billets : chaque partie du voyage se réserve auprès de son vendeur.
              {voyage.network === 'tgvmax'
                ? ' « Réserver » ouvre SNCF Connect, où les places MAX se réservent avec votre abonnement.'
                : ' « Voir les prix » ouvre les sites partenaires qui le vendent.'}
            </p>
            {legs.map(([key, label, leg]) => (
              <div key={key} className="mt-4">
                <h3 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-tone-600">{label}</h3>
                <ul className="divide-y divide-slate-100">
                  {ticketsOf(leg.journey).map((ticket, i) => (
                    <TicketRow key={i} ticket={ticket} network={voyage.network} />
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6">
            <Stat icon="schedule" label="Durée en train" value={formatDuration(totalMinutes)} hint={inbound ? 'aller et retour' : undefined} />
            <Stat
              icon="eco"
              label="Empreinte carbone"
              value={carbon.length > 0 ? `${formatKg(trainKg)} CO₂e` : '–'}
              hint={carbon.length > 0 ? `contre ${formatKg(otherKg)} avec ${other}` : undefined}
            />
            <Stat
              icon="swap_horiz"
              label="Correspondances"
              value={totalTransfers === 0 ? 'Aucune' : String(totalTransfers)}
              hint={totalTransfers === 0 ? 'que des trains directs' : inbound ? 'aller et retour' : undefined}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2 px-6">
            {/* Le voyage est gardé dans ce navigateur : on partage la recherche (mêmes gares, mêmes dates) */}
            <ShareButton
              title={title}
              url={new URL(tripsLink(voyage), window.location.origin).toString()}
              source="voyage"
              variant="dark"
              label="Partager mon voyage"
              className="!rounded-xl !px-6 !py-3"
            />
            <Link
              to={NETWORKS[voyage.network].paths.trajets}
              className="inline-flex items-center gap-2 bg-tone-50 hover:bg-tone-100 text-tone-600 px-6 py-3 rounded-xl text-sm font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-base">search</span>
              Nouvelle recherche
            </Link>
          </div>
        </main>
      </div>
    </NetworkScope>
  );
}
