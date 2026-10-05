// src/pages/Conditions.tsx
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CONTACT_EMAIL, PUBLISHER_NAME } from '../lib/siteInfo';

function Contact() {
  return CONTACT_EMAIL
    ? <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1d7a5a] font-semibold underline">{CONTACT_EMAIL}</a>
    : <span>adresse de contact à venir</span>;
}

export default function Conditions() {
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
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">Conditions <span className="text-[#1d7a5a]">d'utilisation</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">En utilisant TrainNomad, vous acceptez les présentes conditions.</p>
            <p className="text-sm text-slate-400 mt-4 font-semibold">Dernière mise à jour : octobre 2026</p>
          </div>
        </section>

        {/* POINTS CLÉS EN DARK */}
        <section className="py-12 bg-midnight">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-up">
              <div className="text-center p-6">
                <span className="material-symbols-outlined text-[#4ade80] text-4xl mb-3 block">lock_open</span>
                <p className="text-white font-extrabold text-lg mb-1">Accès libre</p>
                <p className="text-slate-400 text-sm mb-0">Gratuit, sans inscription, sans abonnement</p>
              </div>
              <div className="text-center p-6">
                <span className="material-symbols-outlined text-[#4ade80] text-4xl mb-3 block">handshake</span>
                <p className="text-white font-extrabold text-lg mb-1">Indépendant</p>
                <p className="text-slate-400 text-sm mb-0">Aucun lien avec SNCF Voyageurs ni avec les opérateurs ferroviaires</p>
              </div>
              <div className="text-center p-6">
                <span className="material-symbols-outlined text-[#4ade80] text-4xl mb-3 block">info</span>
                <p className="text-white font-extrabold text-lg mb-1">Informatif</p>
                <p className="text-slate-400 text-sm mb-0">Consultation uniquement : ni vente, ni réservation</p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENU */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6 space-y-10">

            {/* 1. Nature du service */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">travel_explore</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Nature du service</h2>
              </div>
              <p>TrainNomad est un site d'information indépendant, gratuit et accessible sans inscription, édité par un particulier. Il propose une recherche d'itinéraires en train en Europe, un outil de consultation des places TGVmax (MAX JEUNE / MAX SENIOR) disponibles, une carte d'exploration des destinations et des guides de villes.</p>
              <p>Le service s'appuie sur des données ouvertes, notamment :</p>
              <ul>
                <li><strong className="text-midnight">SNCF Voyageurs</strong> — horaires et disponibilités TGVmax / MAX (licence ODbL)</li>
                <li><strong className="text-midnight">Autres opérateurs et plateformes de données ouvertes</strong> — Renfe, Ouigo España, Trenitalia, Italo, CP, données suisses, National Rail Enquiries, Eurostar, European Sleeper</li>
                <li><strong className="text-midnight">Référentiels et cartographie</strong> — gares Trainline (ODbL), Wikidata (CC0), fonds de carte © MapTiler © contributeurs OpenStreetMap</li>
              </ul>
              <p className="mt-2">La liste complète des sources et de leurs licences figure dans les <Link to="/mentions-legales" className="text-[#1d7a5a] font-semibold underline">mentions légales</Link>.</p>
              <div className="bg-white rounded-2xl p-6 border border-[#4ade80]/30 mt-4">
                <p className="text-[#1d7a5a] font-bold mb-1">⚠ Pas de réservation</p>
                <p className="mb-0">TrainNomad ne vend aucun billet et n'effectue aucune réservation. Aucune transaction financière n'est réalisée sur le site. La réservation se fait auprès de l'opérateur ferroviaire concerné ou d'un distributeur agréé.</p>
              </div>
            </div>

            {/* 2. Non-affiliation */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">domain_disabled</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Non-affiliation et marques</h2>
              </div>
              <p>TrainNomad est un site indépendant, sans lien avec SNCF Voyageurs ni avec aucun opérateur ferroviaire.</p>
              <p className="mb-0">TGV INOUI, OUIGO, Intercités, TER, MAX JEUNE, MAX SENIOR et TGVmax sont des marques de SNCF Voyageurs ; les noms et logos des opérateurs ferroviaires appartiennent à leurs titulaires respectifs et sont reproduits à seule fin d'identification des trains.</p>
            </div>

            {/* 3. Exactitude des données */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">data_alert</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Exactitude des données</h2>
              </div>
              <p>Les horaires (mis à jour chaque semaine) et les disponibilités TGVmax (mises à jour chaque matin) sont indicatifs : seule la réservation auprès de l'opérateur fait foi. Les trains OUIGO ne figurent pas dans les données de disponibilité TGVmax.</p>
              <p>TrainNomad ne garantit pas :</p>
              <ul>
                <li>L'exactitude ou l'exhaustivité des disponibilités affichées</li>
                <li>La correspondance entre les horaires affichés et ceux effectivement en vigueur</li>
                <li>La disponibilité continue des données en cas de modification ou d'interruption des sources</li>
              </ul>
              <p className="mt-2 mb-0">Dans les limites permises par la loi, l'éditeur ne saurait être tenu responsable des conséquences d'une décision prise sur la base de ces informations (train manqué, place indisponible, frais engagés, etc.). Vérifiez toujours auprès de l'opérateur avant de voyager.</p>
            </div>

            {/* 4. Usage autorisé */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">policy</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Usage autorisé</h2>
              </div>
              <p>Le site est destiné à un usage personnel. Il est interdit de :</p>
              <ul>
                <li>Automatiser des requêtes vers le site ou ses API de manière abusive (scraping, bots)</li>
                <li>Tenter de contourner les mécanismes de sécurité du site ou des serveurs</li>
                <li>Reproduire le code source, les textes ou le design du site sans autorisation</li>
              </ul>
              <p className="mt-2 mb-0">Les données ouvertes sous-jacentes restent réutilisables directement auprès de leurs producteurs, selon leurs propres licences.</p>
            </div>

            {/* 5. Disponibilité du service */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">cloud_off</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Disponibilité du service</h2>
              </div>
              <p>TrainNomad est un projet personnel en évolution. L'éditeur peut modifier, suspendre ou interrompre tout ou partie du service à tout moment, sans préavis. Aucune garantie de disponibilité continue n'est offerte.</p>
              <p className="mb-0">Des interruptions peuvent survenir en raison de maintenance, de mises à jour ou de l'indisponibilité des sources de données ou de l'hébergeur.</p>
            </div>

            {/* 6. Propriété intellectuelle */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">copyright</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Propriété intellectuelle</h2>
              </div>
              <p>Les textes, la mise en forme et le code source du site sont la propriété de {PUBLISHER_NAME}, à l'exception des données et éléments appartenant à des tiers (données ferroviaires, fonds de carte, marques, logos et photographies).</p>
              <p className="mb-0">Les données ferroviaires restent la propriété de leurs producteurs et sont réutilisées conformément à leurs licences. Les photographies sont utilisées à titre d'illustration ; tout ayant droit peut demander leur retrait ou l'ajout d'un crédit via l'adresse de contact (<Contact />).</p>
            </div>

            {/* 7. Droit applicable */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">balance</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Droit applicable</h2>
              </div>
              <p className="mb-0">Les présentes conditions d'utilisation sont soumises au droit français. Tout litige relatif à l'utilisation du site sera porté devant les tribunaux compétents de France, à défaut d'accord amiable préalable.</p>
            </div>

          </div>
        </section>
      </main>
    </>
  );
}
