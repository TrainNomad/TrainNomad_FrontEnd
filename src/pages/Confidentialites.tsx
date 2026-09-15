// src/pages/Confidentialite.tsx
import { useEffect } from 'react';

export default function Confidentialite() {
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
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">Politique de <span className="text-[#1d7a5a]">confidentialité</span></h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">TrainNomad s'engage à protéger votre vie privée. Voici, de manière transparente, comment vos données sont traitées.</p>
            <p className="text-sm text-slate-400 mt-4 font-semibold">Dernière mise à jour : mars 2026</p>
          </div>
        </section>

        {/* RÉSUMÉ RAPIDE */}
        <section className="py-12 bg-midnight">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-up">
              <div className="text-center p-6">
                <span className="material-symbols-outlined text-[#4ade80] text-4xl mb-3 block">no_accounts</span>
                <p className="text-white font-extrabold text-lg mb-1">Aucun compte</p>
                <p className="text-slate-400 text-sm mb-0">Pas d'inscription, pas de profil utilisateur</p>
              </div>
              <div className="text-center p-6">
                <span className="material-symbols-outlined text-[#4ade80] text-4xl mb-3 block">visibility_off</span>
                <p className="text-white font-extrabold text-lg mb-1">Pas de tracking</p>
                <p className="text-slate-400 text-sm mb-0">Aucune donnée personnelle identifiable collectée</p>
              </div>
              <div className="text-center p-6">
                <span className="material-symbols-outlined text-[#4ade80] text-4xl mb-3 block">sell</span>
                <p className="text-white font-extrabold text-lg mb-1">Aucune revente</p>
                <p className="text-slate-400 text-sm mb-0">Vos données ne sont jamais partagées ni vendues</p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENU */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6 space-y-10">

            {/* 1. Données collectées */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">database</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Données collectées</h2>
              </div>
              <p>TrainNomad ne collecte aucune donnée personnelle directement identifiable. Aucun compte utilisateur n'est requis pour accéder au site. Aucun formulaire d'inscription, d'email ou de nom n'est demandé.</p>
              <p>Les seules données techniques susceptibles d'être enregistrées sont des données de navigation anonymes :</p>
              <ul>
                <li>Pages consultées et durée de la session</li>
                <li>Pays et langue de connexion</li>
                <li>Type de navigateur et résolution d'écran</li>
                <li>Source du trafic (accès direct, moteur de recherche, etc.)</li>
              </ul>
              <p className="mt-2 mb-0">Ces données sont utilisées uniquement à des fins statistiques internes pour améliorer l'expérience utilisateur et ne permettent pas d'identifier un utilisateur de manière individuelle.</p>
            </div>

            {/* 2. Données ferroviaires */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">train</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Données ferroviaires & sources tierces</h2>
              </div>
              <p>Pour alimenter ses cartes et ses outils de planification, TrainNomad exploite plusieurs sources de données publiques :</p>
              <ul>
                <li><strong className="text-midnight">API SNCF</strong> — disponibilités TGVmax en France, traitées à la volée et non stockées</li>
                <li><strong className="text-midnight">GTFS Renfe</strong> — données des réseaux grandes vitesses espagnols (AVE, Avlo)</li>
                <li><strong className="text-midnight">GTFS CP Portugal</strong> — données des réseaux ferroviaires portugais</li>
                <li><strong className="text-midnight">GTFS SNCB</strong> — données du réseau ferroviaire belge</li>
                <li><strong className="text-midnight">Autres opérateurs européens</strong> — en cours d'intégration (Italie, Pays-Bas, Allemagne…)</li>
              </ul>
              <p className="mt-2 mb-0">Ces données transitent par le serveur de TrainNomad afin d'être mises en forme et présentées, mais ne sont ni stockées de manière permanente, ni associées à un profil utilisateur. TrainNomad ne conserve aucune trace des recherches effectuées par les utilisateurs.</p>
            </div>

            {/* 3. Cookies */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">cookie</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Cookies</h2>
              </div>
              <p>Le site peut utiliser des cookies techniques de session, strictement nécessaires au bon fonctionnement de la navigation — par exemple pour conserver vos préférences d'affichage ou votre gare de départ lors d'une session.</p>
              <p className="mb-0">Ces cookies ne contiennent aucune donnée personnelle identifiable et ne sont pas utilisés à des fins publicitaires ou de tracking commercial. Vous pouvez configurer votre navigateur pour refuser les cookies, sans que cela n'affecte votre accès au contenu du site.</p>
            </div>

            {/* 4. Droits RGPD */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">shield_person</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Vos droits — RGPD</h2>
              </div>
              <p>Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez des droits suivants concernant vos données :</p>
              <ul>
                <li>Droit d'accès à vos données personnelles</li>
                <li>Droit de rectification en cas d'erreur</li>
                <li>Droit à l'effacement (« droit à l'oubli »)</li>
                <li>Droit d'opposition au traitement</li>
                <li>Droit à la portabilité de vos données</li>
              </ul>
              <p className="mt-2 mb-0">Dans la mesure où TrainNomad ne collecte pas de données personnelles identifiables, ces droits s'exercent de manière très limitée. Pour toute question relative à vos données, vous pouvez contacter l'éditeur directement via le site.</p>
            </div>

            {/* 5. Conservation */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">schedule</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Durée de conservation</h2>
              </div>
              <p>Aucune donnée personnelle n'est conservée au-delà de la session de navigation active. Les données statistiques anonymes peuvent être conservées pour une durée maximale de 13 mois, conformément aux recommandations de la CNIL.</p>
              <p className="mb-0">Les données ferroviaires issues des API et flux GTFS sont actualisées périodiquement et ne sont jamais archivées avec des identifiants utilisateurs.</p>
            </div>

          </div>
        </section>
      </main>
    </>
  );
}