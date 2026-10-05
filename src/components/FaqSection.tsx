import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import FAQ from '../lib/faq.json';

interface FaqItem {
  question: string;
  answer: string;
  link?: { to: string; label: string };
}

const ITEMS: FaqItem[] = FAQ;

/**
 * Questions fréquentes (src/lib/faq.json, aussi repris dans la page HTML de l'accueil par scripts/prerender.mjs).
 * Accordéon en <details> : fonctionne sans JavaScript ; l'attribut `name` referme la question précédente.
 */
export function FaqSection() {
  const { hash } = useLocation();

  // Lien « FAQ » du pied de page (/#faq) : défilement après le retour en haut de page fait par App
  useEffect(() => {
    if (hash !== '#faq') return;
    const timer = window.setTimeout(() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }), 100);
    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    <section id="faq" className="w-full bg-slate-950 text-white scroll-mt-24">
      {/* Trait fin : sépare la FAQ du globe, sur le même fond */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="border-t border-white/10" />
      </div>
      <div className="mx-auto max-w-3xl px-6 pt-16 pb-16 sm:pt-20 sm:pb-24">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-emerald-400">FAQ</p>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">Questions fréquentes</h2>
          <p className="mx-auto max-w-xl text-slate-400">
            Ce que fait TrainNomad, d'où viennent ses données et ce qu'il ne fait pas.
          </p>
        </div>

        <div className="border-t border-white/10">
          {ITEMS.map((item, index) => (
            <details key={item.question} name="faq" open={index === 0} className="group border-b border-white/10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-semibold text-white hover:text-emerald-400 transition-colors [&::-webkit-details-marker]:hidden">
                {item.question}
                <span className="material-symbols-outlined flex-shrink-0 text-slate-500 transition-transform group-open:rotate-180">
                  expand_more
                </span>
              </summary>
              <div className="pb-6 pr-10 text-slate-400 leading-relaxed">
                <p>{item.answer}</p>
                {item.link && (
                  <Link to={item.link.to} className="mt-3 inline-block font-semibold text-emerald-400 underline">
                    {item.link.label}
                  </Link>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
