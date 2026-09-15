// src/pages/Conditions.tsx
import { useEffect } from 'react';

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
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">En accédant à TrainNomad, vous acceptez les présentes conditions. Elles sont rédigées pour être claires et honnêtes.</p>
            <p className="text-sm text-slate-400 mt-4 font-semibold">Dernière mise à jour : mars 2026</p>
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
                <p className="text-slate-400 text-sm mb-0">Aucune affiliation avec les opérateurs ferroviaires</p>
              </div>
              <div className="text-center p-6">
                <span className="material-symbols-outlined text-[#4ade80] text-4xl mb-3 block">info</span>
                <p className="text-white font-extrabold text-lg mb-1">Informatif</p>
                <p className="text-slate-400 text-sm mb-0">Outil de consultation uniquement, pas de réservation</p>
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
              <p>TrainNomad est un outil d'information indépendant, gratuit et accessible sans inscription. Il permet de visualiser les destinations accessibles en train à travers l'Europe, d'explorer les réseaux ferroviaires de plusieurs pays, et de faciliter la planification d'itinéraires via une carte interactive.</p>
              <p>Le service s'appuie sur deux types de sources de données :</p>
              <ul>
                <li><strong className="text-midnight">API SNCF</strong> — pour la fonctionnalité TGVmax, permettant de visualiser les disponibilités de billets en France en temps réel</li>
                <li><strong className="text-midnight">Flux GTFS publics</strong> — pour les réseaux ferroviaires européens : Renfe (Espagne), CP (Portugal), SNCB (Belgique), et d'autres opérateurs en cours d'intégration</li>
              </ul>
              <div className="bg-white rounded-2xl p-6 border border-[#4ade80]/30 mt-4">
                <p className="text-[#1d7a5a] font-bold mb-1">⚠ Pas de réservation</p>
                <p className="mb-0">TrainNomad n'est pas une plateforme de réservation. Aucune transaction financière n'est réalisée sur le site. Pour réserver un billet, vous devez vous rendre sur les plateformes officielles des opérateurs : SNCF, Renfe, CP, SNCB, Eurostar, ou tout autre opérateur européen concerné.</p>
              </div>
            </div>

            {/* 2. Non-affiliation */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">domain_disabled</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Non-affiliation</h2>
              </div>
              <p>TrainNomad est un projet indépendant, développé et maintenu par un particulier. Il n'est affilié à aucun opérateur ferroviaire européen, ni à aucune autorité de transport. Les marques mentionnées sur le site appartiennent à leurs propriétaires respectifs :</p>
              <ul>
                <li>TGVmax est une marque déposée de la SNCF</li>
                <li>Renfe est une marque de l'opérateur ferroviaire national espagnol</li>
                <li>CP (Comboios de Portugal) est une marque de l'opérateur ferroviaire portugais</li>
                <li>SNCB est une marque de l'opérateur ferroviaire belge</li>
                <li>Eurostar est une marque de la société Eurostar International Limited</li>
              </ul>
            </div>

            {/* 3. Exactitude des données */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">data_alert</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Exactitude des données</h2>
              </div>
              <p>Les informations de disponibilité TGVmax proviennent de l'API publique de la SNCF et sont susceptibles de varier en temps réel. Les données des réseaux européens proviennent de flux GTFS mis à disposition par les autorités compétentes et sont actualisées périodiquement, sans garantie de mise à jour en temps réel.</p>
              <p>TrainNomad ne garantit pas :</p>
              <ul>
                <li>L'exactitude ou l'exhaustivité des disponibilités de billets affichées</li>
                <li>La correspondance entre les horaires affichés et les horaires effectivement en vigueur</li>
                <li>La disponibilité continue des données en cas de modification des API ou flux GTFS sources</li>
              </ul>
              <p className="mt-2 mb-0">Pour toute réservation ou information officielle, veuillez consulter directement les opérateurs ferroviaires concernés.</p>
            </div>

            {/* 4. Usage autorisé */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">policy</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Usage autorisé</h2>
              </div>
              <p>Le site est destiné à un usage strictement personnel et non commercial. Il est interdit de :</p>
              <ul>
                <li>Utiliser TrainNomad pour extraire, reproduire ou revendre les données affichées</li>
                <li>Automatiser des requêtes vers le site de manière abusive (scraping, bots)</li>
                <li>Tenter de contourner les mécanismes de sécurité du site ou du serveur</li>
                <li>Utiliser les données affichées à des fins commerciales sans autorisation préalable</li>
                <li>Reproduire le code source, le design ou les éléments graphiques du site sans autorisation</li>
              </ul>
            </div>

            {/* 5. Disponibilité du service */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">cloud_off</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Disponibilité du service</h2>
              </div>
              <p>TrainNomad est un projet solo en constante évolution. L'éditeur se réserve le droit de modifier, suspendre ou interrompre tout ou partie du service à tout moment, sans préavis ni indemnité. Aucune garantie de disponibilité continue n'est offerte.</p>
              <p className="mb-0">Des interruptions ponctuelles peuvent survenir en raison de maintenance, de mises à jour ou d'indisponibilité des sources de données tierces (API SNCF, flux GTFS européens). L'éditeur s'efforce de maintenir le service en ligne mais ne peut être tenu responsable des interruptions hors de son contrôle.</p>
            </div>

            {/* 6. Propriété intellectuelle */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">copyright</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Propriété intellectuelle</h2>
              </div>
              <p>Le code source, le design, les textes et les éléments graphiques du site TrainNomad sont la propriété exclusive de Goulven ROBIN. Toute reproduction, adaptation ou utilisation sans autorisation écrite préalable est interdite.</p>
              <p className="mb-0">Les données ferroviaires utilisées (GTFS, API SNCF) sont issues de sources publiques et restent la propriété de leurs émetteurs respectifs. TrainNomad en fait un usage conforme aux conditions de mise à disposition de chaque opérateur.</p>
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