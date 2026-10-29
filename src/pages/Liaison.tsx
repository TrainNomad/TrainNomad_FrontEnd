import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TrainLogo } from '../components/TrainLogo';
import { API_BASE_URL } from '../config';
import { usePageMeta } from '../hooks/usePageMeta';
import { estimateCarbon, formatKg } from '../lib/carbon';
import { formatDate, formatDuration, formatTime } from '../lib/format';
import {
  fetchDay,
  liaisonDay,
  liaisonDescription,
  liaisonHow,
  summarize,
  typicalDay,
  LIAISON_MAX_AGE_DAYS,
  type LiaisonDay,
  type LiaisonJourney,
} from '../lib/liaisons';
import { liaisonPath, SEO_PAGES, tripsPath, type LiaisonPage } from '../lib/seoPages';

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

function DepartureRow({ journey }: { journey: LiaisonJourney }) {
  const first = journey.trains[0];
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
      <div className="w-28 font-extrabold text-slate-900 tabular-nums">
        {formatTime(journey.departure)} → {formatTime(journey.arrival)}
      </div>
      <div className="w-16 text-sm font-bold text-slate-600">{formatDuration(journey.duration_min)}</div>
      <div className="text-sm text-slate-500 flex-1 min-w-[10rem]">
        {journey.transfers === 0 ? 'Direct' : `${journey.transfers} correspondance${journey.transfers > 1 ? 's' : ''}`}
        {journey.transfers > 0 && ` (${journey.trains.slice(0, -1).map((t) => t.to).join(', ')})`}
      </div>
      {first && (
        <div className="flex items-center gap-2">
          {/* La compagnie avec le type : les logos SNCF, Trenitalia et Renfe ne s'affichent que pour leurs trains */}
          {[...new Map(journey.trains.map((t) => [t.type, t.operator])).entries()].map(([type, operator]) => (
            <TrainLogo key={type} trainType={type} operator={operator} className="h-4" />
          ))}
        </div>
      )}
    </li>
  );
}

/** Liens vers les autres liaisons au départ ou à l'arrivée des mêmes villes. */
function Related({ page }: { page: LiaisonPage }) {
  const others = SEO_PAGES.liaisons.filter(
    (l) => l.slug !== page.slug && (l.from.id === page.from.id || l.to.id === page.to.id || l.from.id === page.to.id),
  );
  if (!others.length) return null;
  return (
    <section className="mx-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      <h2 className="text-lg font-extrabold text-slate-900">Autres liaisons</h2>
      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        {others.map((l) => (
          <li key={l.slug}>
            <Link to={liaisonPath(l.slug)} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-tone-600">
              <span className="font-semibold text-slate-700">
                {l.from.name} → {l.to.name}
              </span>
              <span className="text-slate-400">{formatDuration(l.summary.fastest_min)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/train" className="inline-block mt-3 text-sm font-bold text-tone-600 hover:text-tone-700">
        Toutes les liaisons
      </Link>
    </section>
  );
}

/**
 * Page d'une liaison (/train/paris-londres/) : les trains d'une journée type relevés au build
 * (public/liaisons/<slug>.json, scripts/seo-pages.mjs), recalculés ici quand le relevé a plus d'une semaine.
 */
export default function LiaisonPage() {
  const { slug = '' } = useParams();
  const page = SEO_PAGES.liaisons.find((l) => l.slug === slug);
  const [day, setDay] = useState<LiaisonDay | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  usePageMeta(
    page ? `Train ${page.from.name} → ${page.to.name}` : 'Liaison introuvable',
    page ? liaisonDescription(page.from.name, page.to.name, page.summary) : undefined,
  );

  useEffect(() => {
    if (!page) return;
    const controller = new AbortController();
    setDay(null);
    (async () => {
      let snapshot: LiaisonDay | null = null;
      try {
        const res = await fetch(`/liaisons/${page.slug}.json`, { signal: controller.signal });
        if (res.ok) snapshot = await res.json();
      } catch {
        // relevé absent : calcul en direct
      }
      if (controller.signal.aborted) return;
      if (snapshot) setDay(snapshot);
      const age = snapshot ? (Date.now() - new Date(snapshot.built_at).getTime()) / 86_400_000 : Infinity;
      if (age <= LIAISON_MAX_AGE_DAYS) return;
      // Relevé de plus d'une semaine : la journée type est recalculée avec les horaires actuels
      setRefreshing(true);
      try {
        const date = typicalDay(new Date());
        const journeys = await fetchDay(API_BASE_URL, page.from.id, page.to.id, date, controller.signal);
        if (journeys.length) setDay(liaisonDay(journeys, date, new Date().toISOString()));
      } catch {
        // API injoignable : on garde le relevé
      } finally {
        if (!controller.signal.aborted) setRefreshing(false);
      }
    })();
    return () => controller.abort();
  }, [page]);

  if (!page) {
    return (
      <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md">
          <span className="material-symbols-outlined text-5xl text-slate-300 block mb-4">train</span>
          <p className="text-slate-600 font-medium">Cette liaison n'a pas de page.</p>
          <Link to="/train" className="inline-block mt-5 bg-brand text-white px-5 py-2 rounded-full font-bold text-sm">
            Toutes les liaisons
          </Link>
        </div>
      </div>
    );
  }

  const summary = (day && summarize(day.journeys)) || page.summary;
  const carbon = day?.fastest ? estimateCarbon(day.fastest) : null;
  // Recherche proposée : la journée relevée si elle n'est pas passée, sinon la prochaine journée type
  const shownDate = day?.date ?? page.date;
  const searchDate = shownDate >= new Date().toISOString().slice(0, 10) ? shownDate : typicalDay(new Date());
  const reverse = SEO_PAGES.liaisons.find((l) => l.from.id === page.to.id && l.to.id === page.from.id);
  // Compagnie de chaque type de train de la journée (logos de la liste des types)
  const operatorOf = new Map(day?.journeys.flatMap((j) => j.trains.map((t) => [t.type, t.operator] as const)) ?? []);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-[#1d7a5a] text-white">
        <div className="max-w-[80rem] mx-auto px-10 py-12 md:py-16">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/70">Liaison en train</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">
            {page.from.name} → {page.to.name}
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-2xl">
            {formatDuration(summary.fastest_min)} au plus rapide, {liaisonHow(summary)}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={tripsPath('/trajets', page.from, page.to, searchDate)}
              className="inline-flex items-center gap-2 bg-white text-[#1d7a5a] hover:bg-white/90 px-6 py-3 rounded-xl text-sm font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-base">search</span>
              Voir les trajets et réserver
            </Link>
            {page.guide && (
              <Link
                to={`/guides/${page.guide}`}
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30 px-6 py-3 rounded-xl text-sm font-bold transition-colors"
              >
                <span className="material-symbols-outlined text-base">menu_book</span>
                Guide de {page.to.name}
              </Link>
            )}
          </div>
        </div>
      </section>

      <main className="w-full max-w-[80rem] mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6">
          <Stat icon="schedule" label="Trajet le plus rapide" value={formatDuration(summary.fastest_min)} />
          <Stat
            icon="swap_horiz"
            label={summary.direct > 0 ? 'Trains directs' : 'Correspondances'}
            value={summary.direct > 0 ? `${summary.direct} par jour` : String(summary.min_transfers)}
            hint={`${summary.count} trajet${summary.count > 1 ? 's' : ''} dans la journée`}
          />
          <Stat icon="calendar_today" label="Premier et dernier départ" value={`${summary.first} – ${summary.last}`} />
          <Stat
            icon="eco"
            label="Empreinte carbone"
            value={carbon ? `${formatKg(carbon.trainKg)} CO₂e` : '–'}
            hint={carbon ? `contre ${formatKg(carbon.otherKg)} en ${carbon.other === 'plane' ? 'avion' : 'voiture'}` : undefined}
          />
        </div>

        <section className="mx-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-extrabold text-slate-900">
              Les trains du <span className="first-letter:uppercase">{formatDate(shownDate)}</span>
            </h2>
            {refreshing && <span className="text-xs font-semibold text-slate-400">Mise à jour des horaires…</span>}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Une journée de semaine type, relevée dans les horaires des compagnies. Les horaires d'un autre jour peuvent
            différer : la recherche donne ceux de la date choisie.
          </p>
          {day ? (
            <ul className="mt-2 divide-y divide-slate-100">
              {day.journeys.map((j) => (
                <DepartureRow key={j.id} journey={j} />
              ))}
            </ul>
          ) : (
            <div className="mt-4 h-40 bg-slate-100 rounded-xl animate-pulse" />
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {summary.train_types.map((type) => (
              <span key={type} className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                <TrainLogo trainType={type} operator={operatorOf.get(type)} className="h-4" textFallback={false} />
                <span className="text-xs font-semibold text-slate-600">{type}</span>
              </span>
            ))}
          </div>
        </section>

        {reverse && (
          <p className="px-6 text-sm text-slate-600">
            Dans l'autre sens :{' '}
            <Link to={liaisonPath(reverse.slug)} className="font-bold text-tone-600 hover:text-tone-700">
              {reverse.from.name} → {reverse.to.name}
            </Link>
          </p>
        )}

        <Related page={page} />

        <p className="px-6 text-xs text-slate-400">
          TrainNomad ne vend pas de billets. Horaires indicatifs, tirés des données ouvertes des compagnies : seule la
          réservation auprès du vendeur fait foi. Empreinte carbone : trajet le plus rapide, avec les facteurs détaillés
          dans les mentions légales.
        </p>
      </main>
    </div>
  );
}
