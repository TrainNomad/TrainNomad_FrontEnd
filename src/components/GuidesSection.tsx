import { useState } from 'react';
import type { Guide } from '../types';

const guidepath = 'assets/guides';

const GUIDES: Guide[] = [
  {
    id: 'barcelone',
    city: 'Barcelone',
    country: 'Espagne',
    title: 'Gaudí, tapas et soleil catalan',
    subtitle: '3 jours à Barcelone',
    image: `${guidepath}/barcelone-cover.webp`,
    href: '/guides/barcelone',
    duration: '6h50',
    price: '79€',
    badge: 'Train direct',
    badgeStyle: 'direct',
    emoji: '🏖️',
  },
  {
    id: 'strasbourg',
    city: 'Strasbourg',
    country: 'France',
    title: 'Alsace, cathédrale et tarte flambée',
    subtitle: '2 jours à Strasbourg',
    image: `${guidepath}/strasbourg-cover.webp`,
    href: '/guides/strasbourg',
    duration: '1h46',
    price: '10€',
    badge: 'Train direct',
    badgeStyle: 'direct',
    emoji: '🥨',
  },
  {
    id: 'porto',
    city: 'Porto',
    country: 'Portugal',
    title: 'Vinho do Porto, azulejos et Douro',
    subtitle: '2 jours à Porto',
    image: `${guidepath}/porto-cover.webp`,
    href: '/guides/porto',
    duration: '~2 jours',
    price: '110€',
    badge: 'Train de nuit',
    badgeStyle: 'night',
    emoji: '🍷',
  },
];

export function GuidesSection() {
  return (
    <section className="py-16 bg-transparent" id="section-guides">
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-midnight mb-2">
              Un week-end, une ville, le bon train.
            </h2>
            <p className="text-slate-500">
              Itinéraires à lire comme un carnet. Conseils, bonnes adresses et budget à bord.
            </p>
          </div>
          <a
            href="/guides"
            className="text-sm font-bold border-b-2 pb-1 hover:text-primary transition-colors whitespace-nowrap ml-8"
            style={{ borderColor: '#1d7a5a' }}
          >
            Tous les guides →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {GUIDES.map((guide) => (
            <GuideCard key={guide.id} guide={guide} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── GuideCard ────────────────────────────────────────────────────────────────

interface GuideCardProps {
  guide: Guide;
}

function GuideCard({ guide }: GuideCardProps) {
  const [imgError, setImgError] = useState(false);

  const badgeStyle =
    guide.badgeStyle === 'direct'
      ? { background: '#1d7a5a', color: '#1A2B3C' }
      : { background: '#1e1b4b', color: '#a5b4fc' };

  return (
    <a href={guide.href} className="group block text-inherit no-underline">
      <div className="relative aspect-[4/5] rounded-3xl overflow-hidden mb-5 bg-slate-100">
        {!imgError ? (
          <img
            src={guide.image}
            alt={guide.city}
            onError={() => setImgError(true)}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: 'linear-gradient(135deg,#1A2B3C,#2d4a63)' }}
          >
            {guide.emoji}
          </div>
        )}

        {/* Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={badgeStyle}>
            {guide.badge}
          </span>
        </div>

        {/* Duration */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-midnight shadow-sm flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm" style={{ color: '#1d7a5a' }}>
            schedule
          </span>
          {guide.duration}{' '}
          <span className="text-slate-400 font-normal">de Paris</span>
        </div>

        {/* Price */}
        <div
          className="absolute bottom-4 left-4 px-3 py-1.5 rounded-2xl text-[11px] font-bold text-white flex items-center gap-1"
          style={{ background: 'rgba(26,43,60,0.85)' }}
        >
          dès <span style={{ color: '#1d7a5a' }} className="ml-1">{guide.price}</span>
        </div>
      </div>

      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
        {guide.country} · {guide.city}
      </div>
      <h3 className="font-bold text-xl text-midnight mb-1">{guide.title}</h3>
      <p className="text-sm text-slate-500">{guide.subtitle}</p>
    </a>
  );
}
