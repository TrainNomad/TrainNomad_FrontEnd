import { useState, useMemo } from 'react';
import { GuideCard, GuideCardFeatured } from '../components/GuideCard';
import { useGuides } from '../hooks/useGuides';

// Composant Skeleton pour les cards de guides
function GuideCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-slate-200 animate-pulse h-80">
      <div className="h-48 bg-slate-300" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-300 rounded w-3/4" />
        <div className="h-3 bg-slate-300 rounded w-1/2" />
        <div className="h-3 bg-slate-300 rounded w-full" />
      </div>
    </div>
  );
}

// Composant Skeleton pour le featured guide
function FeaturedGuideSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden bg-slate-200 animate-pulse h-96">
      <div className="h-full bg-slate-300" />
    </div>
  );
}

// Composant Skeleton pour les filtres
function FilterSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-10 w-24 bg-slate-200 rounded-full animate-pulse" />
      ))}
    </div>
  );
}

export default function GuidesPage() {
  const [search, setSearch] = useState('');
  const [activeCountry, setActiveCountry] = useState('Tous');
  const { guides, loading, error } = useGuides();

  // Construire la liste des pays depuis les guides
  const countryList = useMemo(() => {
    const unique = new Set(['Tous']);
    guides.forEach(g => unique.add(g.country));
    return Array.from(unique).sort();
  }, [guides]);

  const featuredGuide = useMemo(() => guides.find(g => g.featured), [guides]);

  const filteredGuides = useMemo(() => {
    return guides.filter(guide => {
      if (guide.featured) return false;
      const matchesSearch = !search ||
        guide.name.toLowerCase().includes(search.toLowerCase()) ||
        guide.country.toLowerCase().includes(search.toLowerCase()) ||
        guide.description.toLowerCase().includes(search.toLowerCase());
      const matchesCountry = activeCountry === 'Tous' || guide.country === activeCountry;
      return matchesSearch && matchesCountry;
    });
  }, [search, activeCountry, guides]);

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-midnight mb-4">
            Guide des <span className="text-[#1d7a5a]">destinations.</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mb-10">
            Découvrez nos meilleures suggestions de lieux, de restaurants et d'activités à explorer à proximité des gares.
          </p>

          {/* Search & Filter */}
          <div className="max-w-4xl">
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <i className="fa-solid fa-magnifying-glass" />
              </span>
              <input
                type="text"
                placeholder="Rechercher une destination..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={loading}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1d7a5a]/20 focus:border-[#1d7a5a] text-base font-medium shadow-sm disabled:opacity-50"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>

            {loading ? (
              <FilterSkeleton />
            ) : (
              <div className="flex flex-wrap gap-2">
                {countryList.map((country) => (
                  <button
                    key={country}
                    onClick={() => setActiveCountry(country)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      activeCountry === country
                        ? 'bg-[#1d7a5a] text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-[#1d7a5a] hover:text-[#1d7a5a]'
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hero Image */}
          {/* <div className="mt-12 rounded-3xl overflow-hidden shadow-lg">
            <img
              src="/assets/guides/guide-hero.webp"
              alt="Voyager en train à travers l'Europe"
              className="w-full h-64 md:h-80 object-cover"
            />
          </div> */}
        </div>
      </section>

      {/* Featured Guide or Loading Skeleton */}
      {!search && activeCountry === 'Tous' && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-1.5 h-8 bg-[#1d7a5a] rounded-full" />
              <h2 className="text-2xl font-bold text-midnight">Le voyage commence</h2>
            </div>
            {loading ? (
              <FeaturedGuideSkeleton />
            ) : featuredGuide ? (
              <GuideCardFeatured guide={featuredGuide} />
            ) : null}
          </div>
        </section>
      )}

      {/* Guides Grid */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              {loading ? (
                <div className="h-8 w-96 bg-slate-200 rounded animate-pulse" />
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-midnight mb-1">
                    <span className="text-slate-400 font-normal">{filteredGuides.length}</span> escapades <span className="text-[#1d7a5a]">à découvrir</span>
                  </h2>
                  {search && (
                    <p className="text-sm text-slate-500">
                      Résultats pour "{search}"
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {error ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-exclamation-triangle text-3xl text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">Erreur de chargement</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-[#1d7a5a] hover:bg-[#155d44] text-white font-bold rounded-xl transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <GuideCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredGuides.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredGuides.map((guide) => (
                <GuideCard key={guide.slug} guide={guide} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-map-location-dot text-3xl text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">Aucun guide trouvé</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                Essayez une autre recherche ou explorez toutes nos destinations.
              </p>
              <button
                onClick={() => { setSearch(''); setActiveCountry('Tous'); }}
                className="px-6 py-3 bg-[#1d7a5a] hover:bg-[#155d44] text-white font-bold rounded-xl transition-colors"
              >
                Voir tous les guides
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt pour votre prochaine aventure ?</h2>
          <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
            Trouvez votre prochain trajet et partez à la découverte de l'Europe en train.
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
