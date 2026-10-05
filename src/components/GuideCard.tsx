import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { GuideDestination } from '../types';
import { CountryFlag } from './CountryFlag';

interface GuideCardProps {
  guide: GuideDestination;
}

export function GuideCard({ guide }: GuideCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      to={`/guides/${guide.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {!imgError ? (
          <img
            src={guide.image}
            alt={guide.name}
            onError={() => setImgError(true)}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
            <CountryFlag code={guide.countryCode} className="h-10" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm">
          <CountryFlag code={guide.countryCode} />
          <span>{guide.country}</span>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-semibold text-slate-600 shadow-sm">
          <i className="fa-solid fa-train text-[#1d7a5a] text-[10px]" />
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-midnight mb-1 group-hover:text-[#1d7a5a] transition-colors">
          {guide.name}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-3">
          {guide.description}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <i className="fa-regular fa-clock" />
          <span>{guide.readingTime} min de lecture</span>
        </div>
      </div>
    </Link>
  );
}

export function GuideCardFeatured({ guide }: GuideCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      to={`/guides/${guide.slug}`}
      className="group block bg-slate-900 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300"
    >
      <div className="grid md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto overflow-hidden">
          {!imgError ? (
            <img
              src={guide.image}
              alt={guide.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
              <CountryFlag code={guide.countryCode} className="h-14" />
            </div>
          )}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 bg-[#1d7a5a] text-white text-xs font-bold rounded-full">
              {guide.country}
            </span>
          </div>
        </div>

        <div className="p-8 md:p-10 flex flex-col justify-center">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Guide complet
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            {guide.featuredTitle || guide.name}
          </h3>
          <p className="text-slate-400 mb-6 leading-relaxed">
            {guide.featuredSubtitle || guide.description}
          </p>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <i className="fa-regular fa-clock" />
              <span>{guide.readingTime} min</span>
            </div>
            <span className="text-[#1d7a5a] font-bold group-hover:underline">
              Lire le guide <i className="fa-solid fa-arrow-right ml-1" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
