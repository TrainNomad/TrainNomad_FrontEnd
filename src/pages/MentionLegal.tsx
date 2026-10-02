// src/pages/MentionsLegales.tsx
import { useEffect } from 'react';
import { CONTACT_EMAIL, PUBLISHER_NAME } from '../lib/siteInfo';

function Contact() {
  return CONTACT_EMAIL
    ? <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1d7a5a] font-semibold underline">{CONTACT_EMAIL}</a>
    : <span>adresse de contact à venir</span>;
}

const linkClass = 'text-[#1d7a5a] font-semibold underline';

export default function MentionsLegales() {
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
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">Mentions <span className="text-[#1d7a5a]">légales</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Informations légales relatives au site TrainNomad.eu</p>
          </div>
        </section>

        {/* CONTENU */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6 space-y-10">

            {/* 1. Éditeur */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">person</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Éditeur du site</h2>
              </div>
              <div className="bg-white rounded-2xl p-6 space-y-2 border border-slate-100">
                <p><span className="font-bold text-midnight">Nom du site :</span> TrainNomad</p>
                <p><span className="font-bold text-midnight">URL :</span> trainnomad.eu</p>
                <p><span className="font-bold text-midnight">Éditeur :</span> {PUBLISHER_NAME}</p>
                <p><span className="font-bold text-midnight">Statut :</span> Particulier, éditeur non professionnel (site non commercial)</p>
                <p><span className="font-bold text-midnight">Contact :</span> <Contact /></p>
                <p><span className="font-bold text-midnight">Directeur de la publication :</span> {PUBLISHER_NAME}</p>
              </div>
              <p className="mt-4 mb-0">Conformément à l'article 6-III-2 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN), l'éditeur, personne physique non professionnelle, a choisi de préserver son anonymat ; ses coordonnées ont été communiquées à l'hébergeur.</p>
            </div>

            {/* 2. Hébergement */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">dns</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Hébergement</h2>
              </div>
              <div className="bg-white rounded-2xl p-6 space-y-2 border border-slate-100">
                <p><span className="font-bold text-midnight">Hébergeur :</span> Render Services, Inc.</p>
                <p><span className="font-bold text-midnight">Adresse :</span> 525 Brannan Street, Suite 300, San Francisco, CA 94107, États-Unis</p>
                <p><span className="font-bold text-midnight">Site web :</span> <a href="https://render.com" target="_blank" rel="noopener noreferrer" className={linkClass}>render.com</a></p>
              </div>
              <p className="mt-4 mb-0">Le site et ses services de données (itinéraires, guides, TGVmax) sont hébergés par Render. Le site est diffusé via le réseau de diffusion de contenu de Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, États-Unis (<a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer" className={linkClass}>cloudflare.com</a>).</p>
            </div>

            {/* 3. Objet du site */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">info</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Objet du site</h2>
              </div>
              <p>TrainNomad est un site d'information gratuit et non commercial d'aide à la planification de voyages en train en Europe. Il propose une recherche d'itinéraires, un outil de consultation des places TGVmax (MAX JEUNE / MAX SENIOR) disponibles, une carte d'exploration des destinations et des guides de villes.</p>
              <p>Les données couvrent principalement la France, l'Espagne, le Portugal, l'Italie, la Suisse et le Royaume-Uni, ainsi que la Belgique, les Pays-Bas et l'Allemagne via les trains internationaux (Eurostar, European Sleeper).</p>
              <div className="bg-white rounded-2xl p-6 border border-[#4ade80]/30 mt-4">
                <p className="text-[#1d7a5a] font-bold mb-1">⚠ Important</p>
                <p className="mb-0">TrainNomad est un site indépendant, sans lien avec SNCF Voyageurs ni avec aucun opérateur ferroviaire. Le site ne vend aucun billet et n'effectue aucune réservation. Pour réserver, rendez-vous sur les sites officiels des opérateurs concernés.</p>
              </div>
            </div>

            {/* 4. Sources des données et licences */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">database</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Sources des données et licences</h2>
              </div>
              <p>TrainNomad réutilise les données ouvertes suivantes :</p>
              <ul>
                <li><strong className="text-midnight">SNCF Voyageurs</strong> — horaires (GTFS) et disponibilités TGVmax / MAX (jeu de données « tgvmax »), <a href="https://ressources.data.sncf.com" target="_blank" rel="noopener noreferrer" className={linkClass}>ressources.data.sncf.com</a> — licence Open Database License (ODbL)</li>
                <li><strong className="text-midnight">Trainline</strong> — référentiel des gares, <a href="https://github.com/trainline-eu/stations" target="_blank" rel="noopener noreferrer" className={linkClass}>github.com/trainline-eu/stations</a> — licence ODbL</li>
                <li><strong className="text-midnight">Renfe</strong> — données ouvertes publiées par Renfe (horaires), <a href="https://data.renfe.com" target="_blank" rel="noopener noreferrer" className={linkClass}>data.renfe.com</a></li>
                <li><strong className="text-midnight">Ouigo España</strong> — données ouvertes publiées via le Punto de Acceso Nacional espagnol, <a href="https://nap.transportes.gob.es" target="_blank" rel="noopener noreferrer" className={linkClass}>nap.transportes.gob.es</a></li>
                <li><strong className="text-midnight">Trenitalia et Italo</strong> — données ouvertes publiées via le Punto di Accesso Nazionale italien</li>
                <li><strong className="text-midnight">CP – Comboios de Portugal</strong> — données ouvertes publiées par CP</li>
                <li><strong className="text-midnight">Suisse</strong> — données ouvertes publiées sur <a href="https://opentransportdata.swiss" target="_blank" rel="noopener noreferrer" className={linkClass}>opentransportdata.swiss</a></li>
                <li><strong className="text-midnight">Royaume-Uni</strong> — données ouvertes publiées par National Rail Enquiries</li>
                <li><strong className="text-midnight">Eurostar</strong> — données ouvertes publiées par Eurostar</li>
                <li><strong className="text-midnight">European Sleeper</strong> — données ouvertes publiées par European Sleeper</li>
                <li><strong className="text-midnight">Wikidata</strong> — <a href="https://www.wikidata.org" target="_blank" rel="noopener noreferrer" className={linkClass}>wikidata.org</a> — licence CC0</li>
                <li><strong className="text-midnight">Fonds de carte</strong> — © <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener noreferrer" className={linkClass}>MapTiler</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className={linkClass}>contributeurs OpenStreetMap</a> (ODbL)</li>
              </ul>
              <p className="mt-4">Contient des données SNCF Voyageurs, disponibles sous licence Open Database License (ODbL).</p>
              <p className="mb-0">Les horaires et disponibilités sont indicatifs et mis à jour une fois par jour : seule la réservation auprès de l'opérateur fait foi. Les trains OUIGO ne figurent pas dans les données de disponibilité TGVmax.</p>
            </div>

            {/* 5. Propriété intellectuelle */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">copyright</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Propriété intellectuelle</h2>
              </div>
              <p>Les textes, la mise en forme et le code source du site sont la propriété de {PUBLISHER_NAME}, à l'exception des données et éléments appartenant à des tiers (données ferroviaires, fonds de carte, marques, logos et photographies), qui restent la propriété de leurs titulaires et sont utilisés conformément à leurs licences respectives.</p>
              <p>TGV INOUI, OUIGO, Intercités, TER, MAX JEUNE, MAX SENIOR et TGVmax sont des marques de SNCF Voyageurs ; les noms et logos des opérateurs ferroviaires appartiennent à leurs titulaires respectifs et sont reproduits à seule fin d'identification des trains.</p>
              <p>TrainNomad est un site indépendant, sans lien avec SNCF Voyageurs ni avec aucun opérateur ferroviaire.</p>
              <p className="mb-0">Les photographies des destinations et des guides sont utilisées à titre d'illustration ; tout ayant droit peut demander leur retrait ou l'ajout d'un crédit via l'adresse de contact (<Contact />).</p>
            </div>

            {/* 6. Responsabilité */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">gavel</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Responsabilité</h2>
              </div>
              <p>L'éditeur s'efforce d'assurer l'exactitude des informations diffusées sur ce site, mais ne peut garantir leur exhaustivité ni leur actualité : les données proviennent de sources externes et sont mises à jour une fois par jour. L'éditeur ne saurait être tenu responsable :</p>
              <ul>
                <li>D'une imprécision, inexactitude ou omission dans les informations disponibles sur le site</li>
                <li>D'un écart entre les horaires ou disponibilités affichés et ceux proposés par les opérateurs au moment de la réservation</li>
                <li>D'un dommage résultant d'une intrusion frauduleuse d'un tiers</li>
                <li>D'un dommage indirect résultant de l'utilisation du site</li>
                <li>D'une interruption ou indisponibilité du service</li>
              </ul>
            </div>

            {/* 7. Droit applicable */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">balance</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Droit applicable</h2>
              </div>
              <p className="mb-0">Les présentes mentions légales sont régies par le droit français. En cas de litige et à défaut d'accord amiable, le litige sera porté devant les tribunaux français compétents.</p>
            </div>

          </div>
        </section>
      </main>
    </>
  );
}
