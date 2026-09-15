// src/pages/About.tsx
export default function AboutPage() {
  return (
    <>
      {/* HERO SECTION (Centré) */}
      <section className="relative z-20 pt-24 pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            Goulven <span className="text-[#1d7a5a]">ROBIN</span>
          </h1>
          <p className="text-xl text-slate-700 max-w-2xl mx-auto font-semibold mb-6">
            Créateur et développeur de TrainNomad
          </p>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            À 24 ans, entre mes racines bretonnes et ma conviction que le voyage de demain doit simplifier notre façon de traverser les frontières, j'ai imaginé TrainNomad. Un outil que j'ai développé de zéro en solo, de la conception initiale jusqu'à l'expérience utilisateur finale.
          </p>
        </div>
      </section>

      {/* MISSION & ORIGIN SECTION (Texte à gauche / Image à droite) */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
                Comment tout a commencé avec TGVmax
              </h2>
              <p className="text-base md:text-lg text-slate-600 mb-4 leading-relaxed">
                Après avoir passé d'innombrables heures à parcourir la France grâce à la liberté offerte par l'abonnement TGVmax, une évidence s'est imposée. Le potentiel est immense, mais l'expérience manquait d'une carte centralisée et vivante pour révéler toutes les destinations sans y passer des heures.
              </p>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                En développant TrainNomad de zéro, mon objectif était de transcender cette complexité pour transformer la recherche de billets en une exploration inspirante.
              </p>
            </div>
            <div className="bg-slate-100 rounded-3xl p-4 flex items-center justify-center shadow-sm overflow-hidden aspect-[4/3] md:aspect-square">
              <img 
                src="/assets/about/goulven_robin.webp" 
                alt="Goulven Robin" 
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION (Centré) */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-4">
              <div className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">6 662</div>
              <div className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-wider">Villes desservies</div>
            </div>
            <div className="p-4">
              <div className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">7 058</div>
              <div className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-wider">Gares référencées</div>
            </div>
            <div className="p-4">
              <div className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">264k+</div>
              <div className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-wider">Trajets unifiés</div>
            </div>
            <div className="p-4">
              <div className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">34k+</div>
              <div className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-wider">Lignes (Routes)</div>
            </div>
          </div>
        </div>
      </section>

      {/* EUROPE & CORRESPONDENCES SECTION (Centré) */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
            L'Europe comme nouveau terrain de jeu
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-6 leading-relaxed">
            Après avoir cartographié les destinations à travers la France, une ambition plus grande s'est naturellement imposée : pourquoi s'arrêter aux frontières ? L'Europe ferroviaire est un réseau gigantesque, reliant des centaines de villes en quelques heures, et pourtant elle reste difficile à appréhender dans sa globalité.
          </p>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            TrainNomad évolue donc pour devenir une boussole à l'échelle européenne, permettant à chaque voyageur de visualiser d'un seul coup d'œil l'ensemble des trajets accessibles. Aujourd'hui, la plateforme se distingue par sa rapidité et sa capacité à gérer de véritables correspondances fluides entre différentes compagnies, décloisonnant totalement le voyage international.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center text-center">
              <div className="text-4xl mb-4">♻️</div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Durabilité</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Promouvoir une mobilité bas carbone et responsable. Le train émet 90% moins de CO₂ que l'avion.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Accessibilité</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Rendre les informations ferroviaires claires, limpides et accessibles pour tous les types de voyageurs.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col items-center text-center">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Le Panier de Voyage</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Une volonté unique de créer un véritable panier de voyage : piochez des trajets et composez votre périple sur-mesure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PROJECT ORIGIN / VISION (Centré) */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-slate-900">
            Le projet & ma vision
          </h2>
          <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
            <p>
              Actuellement étudiant aux Arts et Métiers à Angers (76 An 224), ma formation d'ingénieur m'a apporté la rigueur indispensable pour donner vie à ce projet.
            </p>
            <p>
              Le transport aérien intra-européen a normalisé une aberration écologique et une complexité de voyage subie. Notre vision est de prouver que le train n'est pas seulement une alternative par dépit, mais qu'il est infiniment plus inspirant pour redécouvrir le temps long : là où l'avion isole le voyageur dans le vide, le train transforme chaque fenêtre en un cadre photographique vivant, au plus près des territoires.
            </p>
            <p>
              Alors, ouvrez votre livre, savourez un café avec une généreuse madeleine, et apprêtez-vous à voyager autrement. Bon voyage !
            </p>
            <p className="text-slate-400 italic text-sm pt-4">
              Dernière mise à jour : septembre 2026
            </p>
          </div>
        </div>
      </section>

      {/* CTA SECTION (Centré) */}
      <section className="py-20 bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt pour votre prochaine aventure ?</h2>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-xl mx-auto">
            Planifiez votre prochain trajet ferroviaire dès maintenant.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/trajets"
              className="px-8 py-3 bg-white text-slate-950 font-bold rounded-full hover:bg-slate-100 transition-colors shadow-lg"
            >
              Chercher un trajet
            </a>
            <a
              href="/explorer"
              className="px-8 py-3 border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors"
            >
              Explorer la carte
            </a>
          </div>
        </div>
      </section>
    </>
  );
}