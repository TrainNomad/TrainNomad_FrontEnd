import { Link } from 'react-router-dom';

const QUESTIONS = [
  {
    question: 'Trouve-t-on des places MAX le vendredi soir\u00a0?',
    answer:
      "Rarement sur les grandes lignes : le vendredi soir et le dimanche soir sont les trains les plus demandés de la semaine. Les places se trouvent surtout du mardi au jeudi, tôt le matin ou en soirée. Pour voir d'un coup toutes les destinations ouvertes un jour donné, partez de votre gare sur la carte.",
    link: { to: '/tgvmax/explorer', label: 'Ouvrir la carte TGVmax' },
  },
  {
    question: 'La place affichée est-elle encore disponible\u00a0?',
    answer:
      "Les disponibilités sont une photo du matin, publiée par SNCF Voyageurs : la place a pu être réservée depuis, et le nombre de places restantes n'est pas connu. À l'inverse, des places peuvent se libérer dans la journée sans apparaître avant le lendemain.",
  },
  {
    question: 'Comment réserver\u00a0?',
    answer:
      "Sur SNCF Connect ou l'application, avec votre abonnement MAX : TrainNomad ne vend aucun billet. Pour un changement de siège, réservez les deux billets séparément, sur le même train.",
  },
  {
    question: "Pourquoi les OUIGO n'apparaissent-ils pas\u00a0?",
    answer:
      'Les données publiées par SNCF Voyageurs ne couvrent que les TGV INOUI et les Intercités : les trains OUIGO ne peuvent pas être affichés.',
  },
];

/** Questions des abonnés MAX, en bas de la page /tgvmax (accordéon <details>, fonctionne sans JavaScript). */
export function TGVMaxQuestions() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-[#f5f5f5] via-[#fafaf8] to-[#f0ebe5]">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-10 text-center">
          Avant de chercher <span className="text-[#F97316]">votre place</span>
        </h2>

        <div className="border-t border-slate-200">
          {QUESTIONS.map((item, index) => (
            <details key={item.question} name="tgvmax-questions" open={index === 0} className="group border-b border-slate-200">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-semibold text-slate-900 hover:text-[#F97316] transition-colors [&::-webkit-details-marker]:hidden">
                {item.question}
                <span className="material-symbols-outlined flex-shrink-0 text-slate-400 transition-transform group-open:rotate-180">
                  expand_more
                </span>
              </summary>
              <div className="pb-6 pr-10 text-slate-600 leading-relaxed">
                <p>{item.answer}</p>
                {item.link && (
                  <Link to={item.link.to} className="mt-3 inline-block font-semibold text-[#F97316] underline">
                    {item.link.label}
                  </Link>
                )}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="#search"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#F97316] hover:bg-[#EA8514] text-white font-bold rounded-full transition-all shadow-md hover:shadow-lg"
          >
            <i className="fa-solid fa-search" />
            Lancer une recherche
          </a>
        </div>
      </div>
    </section>
  );
}
