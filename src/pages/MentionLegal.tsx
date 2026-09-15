// src/pages/MentionsLegales.tsx
import { useEffect } from 'react';

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
                <p><span className="font-bold text-midnight">Propriétaire :</span> Goulven ROBIN</p>
                <p><span className="font-bold text-midnight">Statut :</span> Particulier</p>
                <p><span className="font-bold text-midnight">Adresse :</span> Angers, France</p>
              </div>
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
                <p><span className="font-bold text-midnight">Hébergeur :</span> Render</p>
                <p><span className="font-bold text-midnight">Adresse :</span> 525 Brannan Street, San Francisco, CA 94107, USA</p>
                <p><span className="font-bold text-midnight">Site web :</span> render.com</p>
              </div>
            </div>

            {/* 3. Objet du site */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">info</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Objet du site</h2>
              </div>
              <p>TrainNomad est un outil d'information et d'aide à la planification de voyages ferroviaires en Europe. Le site permet de visualiser les destinations accessibles, d'explorer les réseaux de trains grande vitesse à travers plusieurs pays européens, et de faciliter la planification d'itinéraires via une carte interactive.</p>
              <p>Pour la France, TrainNomad intègre les disponibilités TGVmax via l'API publique de la SNCF. Pour les autres pays européens — Espagne, Portugal, Belgique et d'autres à venir — TrainNomad exploite des données au format GTFS (General Transit Feed Specification) mises à disposition par les autorités de transport compétentes.</p>
              <div className="bg-white rounded-2xl p-6 border border-[#4ade80]/30 mt-4">
                <p className="text-[#1d7a5a] font-bold mb-1">⚠ Important</p>
                <p className="mb-0">TrainNomad n'est affilié à aucun opérateur ferroviaire européen (SNCF, Renfe, CP, SNCB, Eurostar, etc.) et ne permet pas de réserver des billets directement. Pour toute réservation, veuillez vous rendre sur les plateformes officielles des opérateurs concernés.</p>
              </div>
              <h3 className="text-lg font-extrabold text-midnight mt-6 mb-3">Sources des données</h3>
              <ul>
                <li>API publique SNCF pour les disponibilités TGVmax en France</li>
                <li>Données GTFS de Renfe (Espagne) et CP (Portugal) pour les réseaux grande vitesse</li>
                <li>Données GTFS de la SNCB pour le réseau belge</li>
                <li>Données GTFS d'autres opérateurs européens en cours d'intégration</li>
              </ul>
              <p className="mt-4">Ces données sont utilisées à des fins d'information uniquement. TrainNomad ne garantit pas leur exactitude en temps réel. Pour des informations officielles et à jour, veuillez consulter directement les opérateurs concernés.</p>
            </div>

            {/* 4. Propriété intellectuelle */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">copyright</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Propriété intellectuelle</h2>
              </div>
              <p>L'ensemble du contenu de ce site — textes, images, graphismes, logo, icônes, code source — est la propriété exclusive de Goulven ROBIN, sauf mention contraire. Toute reproduction, représentation, modification ou publication de tout ou partie des éléments du site est interdite sans autorisation écrite préalable.</p>
              <p>Les marques, logos et noms de domaine mentionnés sur ce site appartiennent à leurs propriétaires respectifs : TGVmax est une marque déposée de la SNCF, Renfe est une marque de l'opérateur ferroviaire espagnol, CP est une marque de l'opérateur portugais, SNCB est une marque de l'opérateur belge.</p>
            </div>

            {/* 5. Responsabilité */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">gavel</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Responsabilité</h2>
              </div>
              <p>L'éditeur s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site, mais ne peut garantir leur exhaustivité ni leur fiabilité en temps réel. L'éditeur décline toute responsabilité pour :</p>
              <ul>
                <li>Toute imprécision, inexactitude ou omission portant sur les informations disponibles sur le site</li>
                <li>Tout dommage résultant d'une intrusion frauduleuse d'un tiers</li>
                <li>Tout dommage indirect résultant de l'utilisation du site</li>
                <li>Les erreurs de disponibilité des billets, les données provenant de sources externes (API SNCF, GTFS)</li>
                <li>Toute interruption ou indisponibilité du service</li>
              </ul>
            </div>

            {/* 6. Droit applicable */}
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