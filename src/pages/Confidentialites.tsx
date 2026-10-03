// src/pages/Confidentialite.tsx
import { useEffect } from 'react';
import { CONTACT_EMAIL, PUBLISHER_NAME } from '../lib/siteInfo';

function Contact() {
  return CONTACT_EMAIL
    ? <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1d7a5a] font-semibold underline">{CONTACT_EMAIL}</a>
    : <span>adresse de contact à venir</span>;
}

const linkClass = 'text-[#1d7a5a] font-semibold underline';

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
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Cette page décrit les données traitées lors de l'utilisation de TrainNomad et vos droits.</p>
            <p className="text-sm text-slate-400 mt-4 font-semibold">Dernière mise à jour : octobre 2026</p>
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
                <p className="text-slate-400 text-sm mb-0">Aucun cookie, aucune mesure d'audience</p>
              </div>
              <div className="text-center p-6">
                <span className="material-symbols-outlined text-[#4ade80] text-4xl mb-3 block">sell</span>
                <p className="text-white font-extrabold text-lg mb-1">Aucune revente</p>
                <p className="text-slate-400 text-sm mb-0">Aucune publicité, aucune donnée vendue</p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENU */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-6 space-y-10">

            {/* 1. Responsable du traitement */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">person</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Responsable du traitement</h2>
              </div>
              <div className="bg-white rounded-2xl p-6 space-y-2 border border-slate-100">
                <p><span className="font-bold text-midnight">Responsable :</span> {PUBLISHER_NAME}, éditeur du site TrainNomad.eu (particulier)</p>
                <p className="mb-0"><span className="font-bold text-midnight">Contact :</span> <Contact /></p>
              </div>
            </div>

            {/* 2. Données traitées */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">database</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Données traitées</h2>
              </div>
              <p>TrainNomad ne demande aucun compte, aucune inscription et aucun formulaire ne collecte votre nom ou votre adresse e-mail. Les seules données traitées sont les suivantes :</p>
              <ul>
                <li><strong className="text-midnight">Journaux techniques des hébergeurs</strong> — adresse IP, date et heure, page ou ressource demandée, type de navigateur. Ils sont enregistrés automatiquement par Render, Cloudflare et Oracle pour assurer le fonctionnement et la sécurité du site (prévention des abus et des attaques).</li>
                <li><strong className="text-midnight">Recherches</strong> — les gares et dates saisies sont envoyées aux API de TrainNomad pour calculer les trajets et afficher les disponibilités. Elles ne sont associées à aucune identité et ne sont pas conservées au-delà des journaux techniques de l'hébergeur.</li>
                <li><strong className="text-midnight">Fonds de carte</strong> — l'affichage de la carte d'exploration charge des tuiles auprès de MapTiler, qui reçoit à cette occasion votre adresse IP. La télémétrie de MapTiler est désactivée.</li>
              </ul>
              <p className="mt-2 mb-0"><span className="font-bold text-midnight">Base légale :</span> intérêt légitime de l'éditeur à fournir le service et à en assurer la sécurité (article 6.1.f du RGPD).</p>
            </div>

            {/* 3. Cookies et stockage local */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">cookie</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Cookies et stockage local</h2>
              </div>
              <p>TrainNomad ne dépose aucun cookie et n'utilise aucun outil de mesure d'audience, de publicité ou de suivi.</p>
              <p className="mb-0">Pour accélérer l'autocomplétion, votre navigateur conserve en stockage local (localStorage, clé <code>stations_cache</code>) une copie de la liste des gares. Ce cache ne contient aucune donnée personnelle, reste sur votre appareil et peut être effacé à tout moment via les réglages de votre navigateur (suppression des données du site).</p>
            </div>

            {/* 4. Destinataires et transferts */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">dns</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Destinataires et sous-traitants</h2>
              </div>
              <p>Les données décrites ci-dessus ne sont ni vendues ni partagées à des fins commerciales. Elles sont traitées uniquement par les prestataires techniques suivants :</p>
              <ul>
                <li><strong className="text-midnight">Render Services, Inc.</strong> (États-Unis) — hébergement du site, <a href="https://render.com" target="_blank" rel="noopener noreferrer" className={linkClass}>render.com</a></li>
                <li><strong className="text-midnight">Oracle France SAS</strong> (France, serveurs situés à Paris) — hébergement des API, <a href="https://www.oracle.com/fr/cloud/" target="_blank" rel="noopener noreferrer" className={linkClass}>oracle.com</a></li>
                <li><strong className="text-midnight">Cloudflare, Inc.</strong> (États-Unis) — réseau de diffusion et protection du site, <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer" className={linkClass}>cloudflare.com</a></li>
                <li><strong className="text-midnight">MapTiler AG</strong> (Suisse) — fonds de carte de la carte d'exploration, <a href="https://www.maptiler.com" target="_blank" rel="noopener noreferrer" className={linkClass}>maptiler.com</a></li>
              </ul>
              <p className="mt-2 mb-0">Les transferts de données hors de l'Union européenne sont encadrés par le Data Privacy Framework UE–États-Unis pour Render et Cloudflare, et par la décision d'adéquation de la Commission européenne concernant la Suisse pour MapTiler.</p>
            </div>

            {/* 5. Conservation */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">schedule</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Durée de conservation</h2>
              </div>
              <p className="mb-0">Les journaux techniques sont conservés pendant la durée définie par chaque hébergeur, puis supprimés automatiquement. L'éditeur ne constitue aucune base de données d'utilisateurs ni d'historique des recherches.</p>
            </div>

            {/* 6. Droits RGPD */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">shield_person</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Vos droits — RGPD</h2>
              </div>
              <p>Conformément au Règlement général sur la protection des données (RGPD) et à la loi Informatique et Libertés, vous disposez des droits suivants sur les données vous concernant :</p>
              <ul>
                <li>Droit d'accès</li>
                <li>Droit de rectification</li>
                <li>Droit à l'effacement</li>
                <li>Droit d'opposition</li>
                <li>Droit à la limitation du traitement</li>
              </ul>
              <p className="mt-2">Pour exercer ces droits, écrivez à l'adresse de contact : <Contact />. Le site ne pouvant pas relier une adresse IP à une personne, il pourra vous être demandé des précisions (date, heure approximative, adresse IP) pour retrouver les données concernées.</p>
              <p className="mb-0">Vous pouvez également introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés (CNIL) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className={linkClass}>www.cnil.fr</a>.</p>
            </div>

          </div>
        </section>
      </main>
    </>
  );
}
