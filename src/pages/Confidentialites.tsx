// src/pages/Confidentialite.tsx
import { useEffect, useState } from 'react';
import { CONTACT_EMAIL, PUBLISHER_NAME } from '../lib/siteInfo';
import { ANALYTICS_ENABLED, isOptedOut, setOptedOut } from '../lib/analytics';
import { MES_VOYAGES_ENABLED } from '../mes-voyages/config';

function Contact() {
  return CONTACT_EMAIL
    ? <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#1d7a5a] font-semibold underline">{CONTACT_EMAIL}</a>
    : <span>adresse de contact à venir</span>;
}

const linkClass = 'text-[#1d7a5a] font-semibold underline';

export default function Confidentialite() {
  const [optedOut, setOptedOutState] = useState(isOptedOut);

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
            <p className="text-sm text-slate-400 mt-4 font-semibold">Dernière mise à jour : novembre 2026</p>
          </div>
        </section>

        {/* RÉSUMÉ RAPIDE */}
        <section className="py-12 bg-midnight">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-up">
              <div className="text-center p-6">
                <span className="material-symbols-outlined text-[#4ade80] text-4xl mb-3 block">{MES_VOYAGES_ENABLED ? 'person' : 'no_accounts'}</span>
                <p className="text-white font-extrabold text-lg mb-1">{MES_VOYAGES_ENABLED ? 'Compte facultatif' : 'Aucun compte'}</p>
                <p className="text-slate-400 text-sm mb-0">{MES_VOYAGES_ENABLED ? 'La recherche fonctionne sans inscription ; un compte sert seulement à garder vos trajets' : "Pas d'inscription, pas de profil utilisateur"}</p>
              </div>
              <div className="text-center p-6">
                <span className="material-symbols-outlined text-[#4ade80] text-4xl mb-3 block">visibility_off</span>
                <p className="text-white font-extrabold text-lg mb-1">Pas de pistage</p>
                <p className="text-slate-400 text-sm mb-0">{ANALYTICS_ENABLED ? "Aucun cookie, statistiques d'audience anonymes" : "Aucun cookie, aucune mesure d'audience"}</p>
              </div>
              <div className="text-center p-6">
                <span className="material-symbols-outlined text-[#4ade80] text-4xl mb-3 block">sell</span>
                <p className="text-white font-extrabold text-lg mb-1">Aucune revente</p>
                <p className="text-slate-400 text-sm mb-0">Aucun traceur publicitaire, aucune donnée vendue</p>
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
              {MES_VOYAGES_ENABLED
                ? <p>La recherche de trajets fonctionne sans compte et sans fournir votre nom ni votre adresse e-mail. Un compte, facultatif, permet d'enregistrer vos trajets dans l'espace « Mes voyages » : les données de ce compte sont décrites dans la section suivante. Sans compte, les seules données traitées sont les suivantes :</p>
                : <p>TrainNomad ne demande aucun compte, aucune inscription et aucun formulaire ne collecte votre nom ou votre adresse e-mail. Les seules données traitées sont les suivantes :</p>}
              <ul>
                <li><strong className="text-midnight">Journaux techniques des hébergeurs</strong> — adresse IP, date et heure, page ou ressource demandée, type de navigateur. Ils sont enregistrés automatiquement par Render, Cloudflare et Oracle pour assurer le fonctionnement et la sécurité du site (prévention des abus et des attaques).</li>
                <li><strong className="text-midnight">Recherches</strong> — les gares et dates saisies sont envoyées aux API de TrainNomad pour calculer les trajets et afficher les disponibilités. Elles ne sont associées à aucune identité et ne sont pas conservées au-delà des journaux techniques de l'hébergeur{ANALYTICS_ENABLED && " et des statistiques d'audience décrites ci-dessous"}.</li>
                {ANALYTICS_ENABLED && (
                  <li><strong className="text-midnight">Mesure d'audience</strong> — le site utilise Umami pour compter les visites : page consultée, site de provenance, type d'appareil et de navigateur, langue, pays, ainsi que les villes de départ et d'arrivée des recherches (sans la date). Votre adresse IP sert uniquement à déduire le pays et à calculer un identifiant anonyme renouvelé chaque mois ; elle n'est pas enregistrée. Ces statistiques sont agrégées et ne permettent ni de vous identifier ni de vous suivre d'un site à l'autre.</li>
                )}
                <li><strong className="text-midnight">Fonds de carte</strong> — l'affichage de la carte d'exploration charge des tuiles auprès de MapTiler, qui reçoit à cette occasion votre adresse IP. La télémétrie de MapTiler est désactivée.</li>
              </ul>
              <p className="mt-2 mb-0"><span className="font-bold text-midnight">Base légale :</span> intérêt légitime de l'éditeur à fournir le service et à en assurer la sécurité (article 6.1.f du RGPD).</p>
            </div>

            {/* 2 bis. Compte Mes voyages */}
            {MES_VOYAGES_ENABLED && (
              <div id="compte" className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section scroll-mt-24">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">badge</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-midnight">Compte « Mes voyages » (facultatif)</h2>
                </div>
                <p>Si vous créez un compte, les données suivantes sont enregistrées pour vous permettre de garder vos trajets et de les retrouver sur tous vos appareils :</p>
                <ul>
                  <li><strong className="text-midnight">Identité et connexion</strong> — prénom, nom, adresse e-mail, et votre mot de passe sous forme chiffrée (haché) : l'éditeur ne le connaît pas et ne peut pas le lire. Si vous choisissez de vous connecter avec Google ou Facebook, ce fournisseur transmet votre nom, votre adresse e-mail et l'identifiant de votre compte chez lui (éventuellement l'adresse de votre photo de profil, qui n'est pas utilisée) ; il n'a accès à aucune de vos données TrainNomad.</li>
                  <li><strong className="text-midnight">Contenu de votre espace</strong> — trajets enregistrés (gares, dates, horaires, trains et correspondances, date d'enregistrement), projets de voyage, recherches sauvegardées, notes, et les prix ou montants (billets, pass Interrail) que vous saisissez vous-même.</li>
                  <li><strong className="text-midnight">Données techniques de sécurité</strong> — dates de création du compte et de dernière connexion ; adresse IP et type de navigateur lors des connexions, journalisés par l'hébergeur pour prévenir les abus.</li>
                </ul>
                <p><span className="font-bold text-midnight">Partage :</span> si vous créez un lien de partage pour un voyage, toute personne qui possède ce lien peut en voir le titre, les dates et les trajets, sans compte. Vos notes, vos prix et votre nom ne sont jamais partagés. Vous pouvez désactiver ou renouveler le lien à tout moment ; l'ancien lien cesse alors de fonctionner.</p>
                <p>Ces données servent uniquement à faire fonctionner votre espace. Elles ne sont ni vendues, ni utilisées pour de la publicité, ni pour vous envoyer des messages commerciaux : vous ne recevez que les e-mails liés à votre compte (confirmation de l'adresse, mot de passe oublié). Elles ne sont pas transmises à la mesure d'audience, qui compte seulement, de façon anonyme, les créations de compte (avec le moyen utilisé : e-mail, Google…) et les enregistrements de trajets ou de recherches (villes de départ et d'arrivée, sans date ni identité).</p>
                <p><span className="font-bold text-midnight">Base légale :</span> exécution du service que vous demandez en créant un compte (article 6.1.b du RGPD) ; intérêt légitime pour les journaux de sécurité (article 6.1.f).</p>
                <p id="suppression-donnees" className="mb-0 scroll-mt-24"><span className="font-bold text-midnight">Supprimer votre compte et vos données :</span> à tout moment depuis la page <a href="/mes-voyages/compte" className={linkClass}>Mes voyages › Compte</a> (« Supprimer définitivement mon compte »). La suppression est immédiate et concerne aussi les comptes créés avec Google ou Facebook. Vous pouvez également en faire la demande à l'adresse de contact : <Contact />.</p>
              </div>
            )}

            {/* 3. Cookies et stockage local */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">cookie</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Cookies et stockage local</h2>
              </div>
              {ANALYTICS_ENABLED
                ? <p>TrainNomad ne dépose aucun cookie et n'utilise aucun traceur publicitaire. La mesure d'audience (Umami) fonctionne sans cookie et sans rien enregistrer sur votre appareil : aucun bandeau de consentement n'est donc affiché.</p>
                : <p>TrainNomad ne dépose aucun cookie et n'utilise aucun outil de mesure d'audience ni aucun traceur publicitaire.</p>}
              <p>Les liens partenaires vers des sites de réservation (signalés « lien partenaire ») passent par la plateforme d'affiliation du partenaire (Impact, pour Omio) avant d'arriver sur son site : c'est alors ce partenaire, et non TrainNomad, qui peut déposer des cookies, selon sa propre politique de confidentialité. TrainNomad ne lui transmet aucune donnée personnelle ; le lien indique seulement les villes du trajet.</p>
              <p>Les trajets que vous choisissez sur la page Trajets sont gardés dans votre navigateur (clés <code>voyages</code> et <code>voyage_aller</code>) pour afficher la page de votre voyage ; ils ne quittent pas votre appareil tant que vous ne les enregistrez pas dans un compte.</p>
              {MES_VOYAGES_ENABLED && (
                <p>Si vous vous connectez à « Mes voyages », votre session est conservée dans le stockage local (clé <code>trainnomad-mes-voyages-auth</code>) pour ne pas vous redemander de vous connecter à chaque visite ; elle est effacée à la déconnexion. Deux autres clés facilitent l'usage : le projet de voyage en cours de remplissage (<code>trainnomad-mes-voyages-projet</code>, 3 heures) et les taux de change du jour (<code>trainnomad-mes-voyages-taux</code>, 12 heures). Ces éléments sont strictement nécessaires au service que vous demandez et ne nécessitent pas de consentement. Si vous choisissez de vous connecter avec Google ou Facebook, ce fournisseur peut déposer ses propres cookies sur son site, selon sa politique.</p>
              )}
              <p className={ANALYTICS_ENABLED ? undefined : 'mb-0'}>Pour accélérer l'autocomplétion, votre navigateur conserve en stockage local (localStorage, clé <code>stations_cache</code>) une copie de la liste des gares. Il y note aussi, une fois fermées l'annonce de la carte des trajets et la bulle d'aide du bouton « Carte », qu'elles ne doivent plus s'afficher (clés <code>annonce_carte</code> et <code>astuce_carte</code>). Ces informations ne contiennent aucune donnée personnelle, restent sur votre appareil et peuvent être effacées à tout moment via les réglages de votre navigateur (suppression des données du site).</p>
              {ANALYTICS_ENABLED && (
                <>
                  <p>Vous pouvez refuser la mesure d'audience sur cet appareil. Ce choix est mémorisé dans le stockage local de votre navigateur (clé <code>umami.disabled</code>) ; le réglage « Ne pas me pister » de votre navigateur est également respecté.</p>
                  <button
                    type="button"
                    onClick={() => { setOptedOut(!optedOut); setOptedOutState(!optedOut); }}
                    className="bg-[#1A2B3C] hover:bg-[#1d7a5a] text-white font-bold py-3 px-6 rounded-xl transition-colors text-sm"
                  >
                    {optedOut ? "Réactiver la mesure d'audience" : "Désactiver la mesure d'audience"}
                  </button>
                  <p className="mt-3 mb-0 text-sm" aria-live="polite">{optedOut ? "Mesure d'audience désactivée sur cet appareil." : "Mesure d'audience active."}</p>
                </>
              )}
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
                {MES_VOYAGES_ENABLED && (
                  <>
                    <li><strong className="text-midnight">Supabase, Inc.</strong> (États-Unis) — comptes et espace « Mes voyages », données hébergées sur des serveurs situés à Londres (Royaume-Uni), <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className={linkClass}>supabase.com</a></li>
                    <li><strong className="text-midnight">Google Ireland Ltd</strong> et <strong className="text-midnight">Meta Platforms Ireland Ltd</strong> (Irlande) — si vous choisissez de vous connecter avec Google ou Facebook ; la page de connexion affiche aussi le bouton officiel de Google, chargé depuis ses serveurs, qui reçoit à cette occasion votre adresse IP</li>
                    <li><strong className="text-midnight">Frankfurter</strong> — taux de change de référence de la Banque centrale européenne, chargés par votre navigateur lorsque votre budget contient une devise autre que l'euro (ce service reçoit alors votre adresse IP), <a href="https://frankfurter.dev" target="_blank" rel="noopener noreferrer" className={linkClass}>frankfurter.dev</a></li>
                  </>
                )}
                {ANALYTICS_ENABLED && (
                  <li><strong className="text-midnight">Umami Software, Inc.</strong> (États-Unis) — mesure d'audience, données hébergées dans l'Union européenne, <a href="https://umami.is" target="_blank" rel="noopener noreferrer" className={linkClass}>umami.is</a></li>
                )}
              </ul>
              <p className="mt-2 mb-0">Les transferts de données hors de l'Union européenne sont encadrés par le Data Privacy Framework UE–États-Unis pour Render et Cloudflare, et par la décision d'adéquation de la Commission européenne concernant la Suisse pour MapTiler.{MES_VOYAGES_ENABLED && " Les données des comptes sont hébergées au Royaume-Uni, pays bénéficiant d'une décision d'adéquation de la Commission européenne ; l'accès éventuel de Supabase, Inc. depuis les États-Unis est encadré par son accord de traitement des données (clauses contractuelles types de la Commission européenne)."}</p>
            </div>

            {/* 5. Conservation */}
            <div className="bg-[#f8f7f5] rounded-[2rem] p-10 fade-up prose-section">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#1d7a5a] text-2xl">schedule</span>
                </div>
                <h2 className="text-2xl font-extrabold text-midnight">Durée de conservation</h2>
              </div>
              <p className="mb-0">Les journaux techniques sont conservés pendant la durée définie par chaque hébergeur, puis supprimés automatiquement. L'éditeur ne constitue aucune base de données d'utilisateurs ni d'historique des recherches par personne.{ANALYTICS_ENABLED && " Les statistiques d'audience, anonymes, sont conservées six mois, puis supprimées."}</p>
              {MES_VOYAGES_ENABLED && (
                <p className="mt-4 mb-0">Les données d'un compte sont conservées tant que le compte existe. Ce que vous supprimez (un trajet, un voyage, une recherche) est effacé immédiatement, et la suppression du compte efface l'ensemble de vos données. Un compte sans aucune connexion pendant trois ans pourra être supprimé, après un e-mail de préavis. Les copies de sauvegarde techniques de l'hébergeur sont effacées automatiquement à la fin de leur cycle de conservation.</p>
              )}
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
                {MES_VOYAGES_ENABLED && <li>Droit à la portabilité (données de votre compte)</li>}
              </ul>
              {MES_VOYAGES_ENABLED && (
                <p className="mt-2">Si vous avez un compte, vous pouvez consulter et corriger vos données (prénom, nom, trajets) et supprimer votre compte directement depuis l'espace « Mes voyages ». Pour obtenir une copie de vos données, écrivez à l'adresse de contact.</p>
              )}
              <p className="mt-2">Pour exercer ces droits, écrivez à l'adresse de contact : <Contact />. Le site ne pouvant pas relier une adresse IP à une personne, il pourra vous être demandé des précisions (date, heure approximative, adresse IP) pour retrouver les données concernées.</p>
              <p className="mb-0">Vous pouvez également introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés (CNIL) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className={linkClass}>www.cnil.fr</a>.</p>
            </div>

          </div>
        </section>
      </main>
    </>
  );
}
