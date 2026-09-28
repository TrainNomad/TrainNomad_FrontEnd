import type { PhotoSpot } from '../hooks/useGuides';

interface PhotoSpotsProps {
  spots: PhotoSpot[];
  cityName: string;
}

export default function PhotoSpots({ spots, cityName }: PhotoSpotsProps) {
  if (!spots || spots.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
          <i className="fa-solid fa-camera text-white" />
        </div>
        <h2 className="text-2xl font-bold text-midnight">Spots photos à {cityName}</h2>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {spots.slice(0, 6).map((spot, i) => (
          <div key={i} className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border border-purple-100 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className={`fa-solid fa-camera text-white`} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-purple-900">{spot.name}</h4>
                <p className="text-sm text-purple-700 mt-1">{spot.description}</p>
                {spot.type && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-purple-500">
                    <span><i className="fa-solid fa-tag mr-1" />{spot.type}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
