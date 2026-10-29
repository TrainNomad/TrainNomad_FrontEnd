// src/pages/CommentCaMarche.tsx
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL, TGVMAX_API_URL } from '../config';
import { CONTACT_EMAIL } from '../lib/siteInfo';
import { DataSourcesSummary } from '../components/DataSourcesSummary';

const linkClass = 'text-[#1d7a5a] font-semibold underline';

/** Partie utile de /health : date de compilation du réseau et période couverte par les horaires. */
interface Health {
  built_at?: string;
  valid_from?: string;
  valid_to?: string;
}

/** "2026-10-04T09:31:17+00:00" -> "4 octobre 2026" */
function longDate(iso?: string): string {
  if (!iso) return '';
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function useHealth(baseUrl: string): Health | null {
  const [health, setHealth] = useState<Health | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${baseUrl}/health`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.built_at && setHealth(data))
      .catch(() => {
        // API injoignable : la date de compilation n'est pas affichée
      });
    return () => controller.abort();
  }, [baseUrl]);
  return health;
}

function Section({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">{icon}</span>
        </div>
        <h2 className="text-2xl font-extrabold text-midnight">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/** Encadré blanc avec la date de compilation lue sur l'API. */
function Freshness({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#4ade80]/30 mt-4">
      <p className="mb-0">{children}</p>
    </div>
  );
}

export default function CommentCaMarche() {
  const europe = useHealth(API_BASE_URL);
  const tgvmax = useHealth(TGVMAX_API_URL);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        .hero-gradient { background: radial-gradient(circle at 50% -20%, #4ade8015 0%, transparent 50%); }
        .fade-up { opacity: 0; transform: translateY(30px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .fade-up.visible { opacity: 1; transform: translateY(0); }
        .prose-section p { color: #64748b; font-size: 1.05rem; line-height: 1.8; margin-bottom: 1rem; }
        .prose-section ul { color: #64748b; font-size: 1.05rem; line-height: 1.8; list-style: none; padding: 0; }
        .prose-section ul li { padding-left: 1.5rem; position: relative; margin-bottom: 0.5rem; }
        .prose-section ul li::before { content: "→"; position: absolute; left: 0; color: #4ade80; font-weight: 700; }
      `}</style>

      <main className="bg-white text-midnight font-display">
        {/* HERO */}
        <section className="relative pt-16 pb-20 overflow-hidden hero-gradient">
          <div className="max-w-4xl mx-auto px-6 text-center fade-up">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">Comment ça <span className="text-[#1d7a5a]">marche</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">D'où viennent les données, comment les trajets sont calculés et ce que le site ne sait pas faire.</p>
          </div>
        </section>

        {/* POINTS CLÉS EN DARK */}
        <section className="py-12 bg-midnight">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-up">
              <div className="text-center p-6">
                <span className="material-symbols-outlined text-[#4ade80] text-4xl mb-3 block">database</span>
                <p className="text-white font-extrabold text-lg mb-1">Données ouvertes</p>
                <p className="text-slate-400 text-sm mb-0">Horaires publiés par les opérateurs eux-mêmes</p>
              </div>
              <div className="text-center p-6">
                <span className="material-symbols-outlined text-[#4ade80] text-4xl mb-3 block">route</span>
                <p className="text-white font-extrabold text-lg mb-1">Un seul réseau</p>
                <p className="text-slate-400 text-sm mb-0">Les opérateurs européens réunis, jusqu'à 6 correspondances</p>
              </div>
              <div className="text-center p-6">
                <span className="material-symbols-outlined text-[#4ade80] text-4xl mb-3 block">schedule</span>
                <p className="text-white font-extrabold text-lg mb-1">Mises à jour régulières</p>
                <p className="text-slate-400 text-sm mb-0">Places TGVmax chaque matin, horaires chaque semaine</p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENU */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6 space-y-10">

            {/* 1. Sources */}
            <Section icon="database" title="D'où viennent les données">
              <p>TrainNomad ne produit aucun horaire : le site réutilise les données ouvertes que les opérateurs ferroviaires et les autorités de transport publient eux-mêmes.</p>
              <DataSourcesSummary />
              <p className="mt-4">De nouveaux opérateurs sont ajoutés au fil du temps ; un pays dont le réseau n'est pas encore intégré reste desservi par les trains internationaux des opérateurs ci-dessus. La liste complète des sources et de leurs licences figure dans les <Link to="/mentions-legales" className={linkClass}>mentions légales</Link>.</p>
            </Section>

            {/* 2. Assemblage */}
            <Section icon="merge" title="Comment les horaires sont réunis">
              <p>Chaque opérateur publie ses horaires dans son propre fichier, avec ses propres noms et codes de gares. Avant de pouvoir calculer un trajet d'un pays à l'autre, il faut en faire un seul réseau :</p>
              <ul>
                <li><strong className="text-midnight">Une gare, une seule fois</strong> — la même gare décrite par plusieurs opérateurs est reconnue grâce à un référentiel commun des gares européennes</li>
                <li><strong className="text-midnight">Des villes entières</strong> — les gares d'une même ville sont regroupées : chercher « Paris » interroge toutes les gares parisiennes</li>
                <li><strong className="text-midnight">Les heures locales</strong> — chaque horaire reste dans le fuseau de sa gare : un Eurostar part de Londres à l'heure de Londres</li>
              </ul>
              <p className="mt-2 mb-0">Les horaires sont réassemblés chaque semaine et couvrent environ quatre mois.</p>
              {europe && (
                <Freshness>
                  Horaires compilés le <strong className="text-midnight">{longDate(europe.built_at)}</strong>
                  {europe.valid_to && <>, valables jusqu'au <strong className="text-midnight">{longDate(europe.valid_to)}</strong></>}.
                </Freshness>
              )}
            </Section>

            {/* 3. Calcul */}
            <Section icon="route" title="Comment un trajet est calculé">
              <p>Le moteur de recherche utilise RAPTOR, un algorithme public conçu pour les transports en commun. Il explore le réseau par tours successifs : d'abord les trains directs, puis les trajets à une correspondance, et ainsi de suite jusqu'à six correspondances.</p>
              <p>Seuls les trajets utiles sont proposés : un trajet est écarté si un autre part plus tard, arrive plus tôt et ne demande pas plus de changements.</p>
              <p>Une correspondance n'est proposée que si le temps de changement est suffisant :</p>
              <ul>
                <li><strong className="text-midnight">Dans la même gare</strong> — 10 minutes au minimum, 15 dans les grandes gares</li>
                <li><strong className="text-midnight">Entre deux gares proches</strong> — le temps de marche, pour des gares à moins d'un kilomètre</li>
                <li><strong className="text-midnight">D'une gare à l'autre dans une ville</strong> — le temps de traversée en transport urbain, par exemple de Paris Nord à Paris Gare de Lyon</li>
                <li><strong className="text-midnight">Eurostar depuis ou vers Londres</strong> — la fermeture de l'enregistrement avant le départ est prise en compte</li>
              </ul>
              <p className="mt-2 mb-0">La <Link to="/explorer" className={linkClass}>carte d'exploration</Link> repose sur le même calcul, lancé depuis une gare vers toutes les autres.</p>
            </Section>

            {/* 4. TGVmax */}
            <Section icon="bolt" title="Les places TGVmax">
              <p>L'<Link to="/tgvmax" className={linkClass}>outil TGVmax</Link> s'appuie sur le jeu de données ouvert de SNCF Voyageurs qui indique, pour les trente prochains jours, si une place MAX JEUNE ou MAX SENIOR est disponible.</p>
              <p>Cette disponibilité ne dépend pas du train mais du trajet demandé : dans un même train, Paris → Marseille peut être ouvert alors que Paris → Lyon est complet. Le site ne propose donc que des trajets réellement ouverts à la réservation, et les correspondances entre eux.</p>
              <div className="bg-white rounded-2xl p-6 border border-[#4ade80]/30 mt-4 mb-4">
                <p className="text-[#1d7a5a] font-bold mb-1">Le changement de siège</p>
                <p className="mb-0">Quand un trajet affiche complet, il reste parfois des places sur ses deux moitiés. Exemple : Besançon → Montpellier est complet, mais Besançon → Lyon et Lyon → Montpellier sont disponibles dans le même train. Le site propose alors les deux billets : vous restez à bord et changez simplement de place à Lyon.</p>
              </div>
              <p className="mb-0">SNCF Voyageurs publie ces données une fois par jour, le matin ; le site les reprend dans la foulée.</p>
              {tgvmax && (
                <Freshness>
                  Disponibilités TGVmax compilées le <strong className="text-midnight">{longDate(tgvmax.built_at)}</strong>.
                </Freshness>
              )}
            </Section>

            {/* 5. Empreinte carbone */}
            <Section icon="eco" title="L'empreinte carbone affichée">
              <p>Chaque trajet affiche une estimation de ses émissions de CO₂e par voyageur, comparée au même déplacement en voiture ou, au-delà de 700 km, en avion. Elle tient compte de la compagnie et du pays de chaque train : un TGV qui roule à l'électricité française, très peu carbonée, n'émet pas autant qu'un train diesel en Écosse.</p>
              <ul>
                <li><strong className="text-midnight">Les chiffres publiés</strong> — quand ils existent : ceux du régulateur britannique (<a href="https://dataportal.orr.gov.uk/statistics/infrastructure-and-environment/rail-environment/" target="_blank" rel="noopener noreferrer" className={linkClass}>ORR</a>) pour chaque compagnie, comme LNER, Avanti West Coast ou Lumo, ceux de <a href="https://ressources.data.sncf.com/explore/dataset/emission-co2-perimetre-usage/" target="_blank" rel="noopener noreferrer" className={linkClass}>SNCF Voyageurs</a> pour le TGV, les Intercités, les TER et ses lignes internationales, et ceux de l'<a href="https://www.umweltbundesamt.de/themen/verkehr/emissionsdaten" target="_blank" rel="noopener noreferrer" className={linkClass}>Umweltbundesamt</a> pour l'Allemagne</li>
                <li><strong className="text-midnight">Ailleurs, un calcul</strong> — l'énergie consommée par un train pour transporter un voyageur sur un kilomètre, multipliée par l'intensité carbone de l'électricité du pays (<a href="https://ourworldindata.org/grapher/carbon-intensity-electricity" target="_blank" rel="noopener noreferrer" className={linkClass}>Ember</a>). Là où l'on peut le vérifier, en Allemagne et en Suisse, ce calcul retrouve les chiffres publiés</li>
                <li><strong className="text-midnight">La distance</strong> — mesurée sur les voies ferrées, d'arrêt en arrêt, grâce aux tracés OpenStreetMap ; sans tracé, la distance à vol d'oiseau est majorée de 15 %, l'écart moyen observé entre les deux</li>
                <li><strong className="text-midnight">En voiture et en avion</strong> — une voiture thermique avec une seule personne à bord, sur la distance directe majorée de 20 % pour la route ; l'avion sur la distance directe, pour les trajets de plus de 700 km</li>
              </ul>
              <p className="mt-2">Le calcul retient toujours l'électricité moyenne du pays : certaines compagnies annoncent des émissions presque nulles grâce à des contrats d'électricité renouvelable, ce qui empêcherait de les comparer entre elles. Seule l'énergie consommée par les trains est comptée, pas leur construction ni celle des voies. Les chiffres sont mis à jour une fois par an.</p>
              <p className="mb-0">C'est un ordre de grandeur, pas une mesure : le remplissage réel de chaque train n'est pas connu. À plusieurs dans la voiture, ses émissions par personne se divisent d'autant.</p>
            </Section>

            {/* 6. Limites */}
            <Section icon="data_alert" title="Ce que le site ne sait pas faire">
              <ul>
                <li><strong className="text-midnight">Pas de temps réel</strong> — retards, suppressions, travaux et grèves annoncés au dernier moment n'apparaissent pas</li>
                <li><strong className="text-midnight">Pas de prix ni de réservation</strong> — le site ne vend aucun billet ; la réservation se fait auprès de l'opérateur ou d'un distributeur</li>
                <li><strong className="text-midnight">Pas de garantie de correspondance</strong> — un trajet avec changement peut demander plusieurs billets ; si le premier train est en retard, le suivant n'est pas forcément garanti</li>
                <li><strong className="text-midnight">TGVmax : une photo du matin</strong> — une place affichée peut avoir été réservée depuis, et le nombre de places restantes n'est pas connu</li>
                <li><strong className="text-midnight">TGVmax : pas de OUIGO</strong> — ces trains ne figurent pas dans les données de disponibilité publiées</li>
              </ul>
              <p className="mt-2 mb-0">Vérifiez toujours auprès de l'opérateur avant de voyager.</p>
            </Section>

            {/* 7. Signaler une erreur */}
            <Section icon="mail" title="Signaler une erreur">
              <p className="mb-0">Une gare mal placée, un trajet impossible, une correspondance trop courte ? Écrivez à <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>{CONTACT_EMAIL}</a> en indiquant le trajet et la date recherchés : ces retours servent directement à corriger les données.</p>
            </Section>

          </div>
        </section>
      </main>
    </>
  );
}
