import { useParams, Link } from 'react-router-dom';
import { useGuideDetail } from '../hooks/useGuides';
import PhotoSpots from '../components/PhotoSpots';

const FLAGS: Record<string, string> = {
  FR: '', ES: '', PT: '', IT: '', DE: '', BE: '', NL: '', CH: '', GB: '', AT: '',
};

const STEP_ICONS: Record<string, string> = {
  transport: 'fa-train', visit: 'fa-landmark', food: 'fa-utensils', leisure: 'fa-mug-hot',
};

const STEP_COLORS: Record<string, string> = {
  transport: 'bg-blue-500', visit: 'bg-emerald-500', food: 'bg-orange-500', leisure: 'bg-purple-500',
};

export default function GuideDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { guide, loading, error } = useGuideDetail(slug);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-[50vh] bg-slate-200 animate-pulse" />
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <i className="fa-solid fa-map-location-dot text-4xl text-red-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-midnight mb-4">Guide introuvable</h1>
          <p className="text-slate-500 mb-8">{error || "Ce guide n'existe pas."}</p>
          <Link to="/guides" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1d7a5a] hover:bg-[#155d44] text-white font-bold rounded-xl transition-colors">
            <i className="fa-solid fa-arrow-left" /> Retour aux guides
          </Link>
        </div>
      </div>
    );
  }

  const flag = FLAGS[guide.countryCode] || '';

  return (
    <>
      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <img src={guide.heroImage || guide.image} alt={guide.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold text-slate-700">
                {flag && <span>{flag}</span>}
                <span>{guide.country}</span>
              </span>
              {guide.tags?.filter(tag => tag !== 'Gastronomie').map(tag => (
                <span key={tag} className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full">{tag}</span>
              ))}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
              {guide.featuredTitle || guide.name}
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl">
              {guide.featuredSubtitle || guide.description}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Facts Bar */}
      {guide.quickFacts && guide.quickFacts.length > 0 && (
        <div className="bg-slate-900 border-b border-slate-800">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex flex-wrap justify-center md:justify-between gap-4 md:gap-8">
              {guide.quickFacts
                .filter(fact => !fact.label.toLowerCase().includes('wifi') && !fact.label.toLowerCase().includes('climat'))
                .map((fact, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#1d7a5a]/20 rounded-lg flex items-center justify-center">
                    <i className={`fa-solid ${fact.icon} text-[#4ade80]`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{fact.label}</p>
                    <p className="font-bold text-white">{fact.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Back link + Search button */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/guides" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#1d7a5a] transition-colors">
            <i className="fa-solid fa-arrow-left" /> Tous les guides
          </Link>
          <Link
            to="/trajets"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1d7a5a] hover:bg-[#155d44] text-white text-sm font-bold rounded-full transition-colors"
          >
            <i className="fa-solid fa-magnifying-glass" />
            Rechercher un autre trajet
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-12">

          {/* Introduction */}
          {guide.introduction && (
            <section className="mb-16">
              <p className="text-lg md:text-xl text-slate-700 leading-relaxed first-letter:text-5xl first-letter:font-bold first-letter:text-[#1d7a5a] first-letter:float-left first-letter:mr-3 first-letter:mt-1">
                {guide.introduction}
              </p>
            </section>
          )}

          {/* Photo Spots */}
          {guide.photoSpots && guide.photoSpots.length > 0 && (
            <PhotoSpots spots={guide.photoSpots} cityName={guide.name} />
          )}

          {/* L'Essentiel */}
          {guide.essentials && (
            <section className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-[#1d7a5a] rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-compass text-white text-xl" />
                </div>
                <h2 className="text-3xl font-bold text-midnight">L'essentiel</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {guide.essentials.to_see && (
                  <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border border-emerald-100">
                    <div className="flex items-center gap-2 mb-4">
                      <i className="fa-solid fa-landmark text-emerald-600" />
                      <h3 className="font-bold text-emerald-900">A voir / A faire</h3>
                    </div>
                    <ul className="space-y-3">
                      {guide.essentials.to_see.map((item, i) => (
                        <li key={i}>
                          <p className="font-semibold text-slate-800">{item.name}</p>
                          <p className="text-sm text-slate-600">{item.description}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {guide.essentials.experiences && (
                  <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 border border-orange-100">
                    <div className="flex items-center gap-2 mb-4">
                      <i className="fa-solid fa-star text-orange-600" />
                      <h3 className="font-bold text-orange-900">Experiences</h3>
                    </div>
                    <ul className="space-y-3">
                      {guide.essentials.experiences.map((item, i) => (
                        <li key={i}>
                          <p className="font-semibold text-slate-800">{item.name}</p>
                          <p className="text-sm text-slate-600">{item.description}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {guide.essentials.mobility && (
                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
                    <div className="flex items-center gap-2 mb-4">
                      <i className="fa-solid fa-route text-blue-600" />
                      <h3 className="font-bold text-blue-900">Mobilite</h3>
                    </div>
                    <ul className="space-y-3">
                      {guide.essentials.mobility.map((item, i) => (
                        <li key={i}>
                          <p className="font-semibold text-slate-800">{item.name}</p>
                          <p className="text-sm text-slate-600">{item.description}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Itinerary */}
          {guide.itinerary && guide.itinerary.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-[#1d7a5a] rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-calendar-days text-white text-xl" />
                </div>
                <h2 className="text-3xl font-bold text-midnight">L'itineraire sur place</h2>
              </div>

              <div className="space-y-8">
                {guide.itinerary.map((day) => (
                  <div key={day.day} className="bg-slate-50 rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-[#1d7a5a] to-[#2d9a6a] p-6 text-white">
                      <div className="flex items-center gap-4">
                        <span className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">{day.day}</span>
                        <div>
                          <h3 className="text-xl font-bold">Jour {day.day} : {day.title}</h3>
                          <p className="text-white/80">{day.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="relative">
                        <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-slate-200" />
                        <div className="space-y-6">
                          {day.steps.map((step, i) => (
                            <div key={i} className="relative flex gap-4">
                              <div className={`relative z-10 w-12 h-12 ${STEP_COLORS[step.type] || 'bg-slate-400'} rounded-full flex items-center justify-center flex-shrink-0`}>
                                <i className={`fa-solid ${STEP_ICONS[step.type] || 'fa-circle'} text-white`} />
                              </div>
                              <div className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-sm font-bold text-[#1d7a5a] bg-[#1d7a5a]/10 px-2 py-0.5 rounded">{step.time}</span>
                                  <h4 className="font-bold text-slate-800">{step.title}</h4>
                                </div>
                                <p className="text-slate-600 text-sm">{step.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Train Travel Section */}
          {guide.trainTravel && (
            <section className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-[#1d7a5a] rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-train text-white text-xl" />
                </div>
                <h2 className="text-3xl font-bold text-midnight">Les gares de {guide.name}</h2>
              </div>

              {guide.trainTravel.stations && guide.trainTravel.stations.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6">
                  {guide.trainTravel.stations.map((station, i) => (
                    <div key={i} className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
                      <div className="flex items-center gap-3 mb-3">
                        <i className="fa-solid fa-building text-[#4ade80]" />
                        <h4 className="text-lg font-bold">{station.name}</h4>
                      </div>
                      <p className="text-slate-300 text-sm mb-4">{station.description}</p>
                      {station.connections && (
                        <div className="flex flex-wrap gap-2">
                          {station.connections.map((conn, j) => (
                            <span key={j} className="text-xs bg-white/10 px-2 py-1 rounded-full">{conn}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Practical Info */}
          {guide.practical && guide.practical.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-[#1d7a5a] rounded-xl flex items-center justify-center">
                  <i className="fa-solid fa-circle-info text-white text-xl" />
                </div>
                <h2 className="text-3xl font-bold text-midnight">Bons a savoir</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {guide.practical.map((item, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <i className={`fa-solid ${item.icon} text-amber-600`} />
                      <h4 className="font-bold text-amber-900">{item.title}</h4>
                    </div>
                    <p className="text-amber-800 text-sm">{item.content}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Classic Sections */}
          {guide.sections && guide.sections.length > 0 && (
            <section className="mb-16">
              <div className="space-y-8">
                {guide.sections.map(section => (
                  <div key={section.id} id={section.id} className="bg-slate-50 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-[#1d7a5a] rounded-xl flex items-center justify-center">
                        <i className={`fa-solid ${section.icon} text-white`} />
                      </div>
                      <h3 className="text-xl font-bold text-midnight">{section.title}</h3>
                    </div>
                    <div className="prose prose-slate max-w-none prose-p:text-slate-600" dangerouslySetInnerHTML={{ __html: section.content }} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 md:p-12 text-white text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Pret a partir ?</h3>
            <p className="text-slate-300 mb-8 max-w-lg mx-auto">
              Trouvez votre trajet personnalise vers {guide.name} depuis votre gare de depart.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/trajets" className="inline-flex items-center gap-2 px-8 py-4 bg-[#1d7a5a] hover:bg-[#155d44] text-white font-bold rounded-xl transition-colors shadow-lg">
                <i className="fa-solid fa-magnifying-glass" /> Rechercher un trajet
              </Link>
              <Link to="/explorer" className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 hover:bg-white/10 text-white font-bold rounded-xl transition-colors">
                <i className="fa-solid fa-map" /> Explorer la carte
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
