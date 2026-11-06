import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

interface Operator {
  id: string;
  name: string;
}

/**
 * Logo (public/assets/compagnies/) et nom court par opérateur de l'API ; sans logo, le nom s'affiche en texte.
 * `size` : classes Tailwind de taille quand le logo n'occupe qu'une partie de l'image (marges, petit texte) ;
 * avec une largeur fixe, l'image est recadrée au centre (object-cover).
 */
const OPERATORS: Record<string, { label: string; logo?: string; size?: string }> = {
  SNCF: { label: 'SNCF', logo: 'sncf.png' },
  EUROSTAR: { label: 'Eurostar', logo: 'eurostar.png' },
  RENFE: { label: 'Renfe', logo: 'renfe.png' },
  TRENITALIA: { label: 'Trenitalia', logo: 'trenitalia.png', size: 'h-9 w-auto max-w-[120px] object-contain' },
  ITALO: { label: 'Italo', logo: 'italo.png' },
  SNCB: { label: 'SNCB', logo: 'SNCB.png' },
  SWISS: { label: 'CFF', logo: 'sbb.png', size: 'h-8 w-auto max-w-[120px] object-contain' },
  CP: { label: 'CP', logo: 'Comboios-de-Portugal.png', size: 'h-9 w-auto max-w-[120px] object-contain' },
  OUIGO_ES: { label: 'Ouigo España', logo: 'ouigo.png' },
  EUROPEAN_SLEEPER: { label: 'European Sleeper', logo: 'european_sleeper.png' },
  FLIXTRAIN: { label: 'FlixTrain', logo: 'FlixTrain.png' },
  NATIONAL_RAIL: { label: 'National Rail', logo: 'national rail.png' },
  // Réseaux en cours d'intégration : affichés dès que l'API les annonce dans /health
  NS: { label: 'NS', logo: 'NS.png' },
  TRENORD: { label: 'Trenord', logo: 'trenord.png', size: 'h-6 w-[96px] object-cover' },
  DB: { label: 'Deutsche Bahn', logo: 'db.png' },
  // Compagnies étrangères des flux allemands (build_network.py) : leur nom tant que le logo n'est pas ajouté
  OBB: { label: 'ÖBB', logo: 'obb.png' },
  PKP: { label: 'PKP Intercity', logo: 'pkp.svg' },
  CD: { label: 'České dráhy', logo: 'cd.png' },
  MAV: { label: 'MÁV', logo: 'mav.png' },
  DSB: { label: 'DSB', logo: 'dsb.png' },
  CFL: { label: 'CFL', logo: 'cfl.png' },
  ZSSK: { label: 'ZSSK', logo: 'zssk.png' },
  HZPP: { label: 'HŽPP', logo: 'hzpp.svg' },
  // Compagnies du flux tchèque (build_network.py, CZ_AGENCY_OPERATOR)
  REGIOJET: { label: 'RegioJet', logo: 'regiojet.png' },
  LEO_EXPRESS: { label: 'Leo Express', logo: 'leo_express.png' },
  ARRIVA_CZ: { label: 'Arriva', logo: 'ns_arriva.png' },
  GW_TRAIN: { label: 'GW Train', logo: 'gw_train.png' },
  TRILEX: { label: 'trilex', logo: 'laenderbahn.svg' },
  // Compagnies des flux polonais et hongrois (build_network.py)
  POLREGIO: { label: 'PolRegio', logo: 'polregio.png' },
  KOLEJE_DOLNOSLASKIE: { label: 'Koleje Dolnośląskie', logo: 'koleje_dolnoslaskie.png' },
  KOLEJE_MALOPOLSKIE: { label: 'Koleje Małopolskie', logo: 'koleje_malopolskie.png' },
  KOLEJE_MAZOWIECKIE: { label: 'Koleje Mazowieckie', logo: 'koleje_mazowieckie.png' },
  KOLEJE_SLASKIE: { label: 'Koleje Śląskie', logo: 'koleje_slaskie.png' },
  KOLEJE_WIELKOPOLSKIE: { label: 'Koleje Wielkopolskie', logo: 'koleje_wielkopolskie.png' },
  LKA: { label: 'ŁKA', logo: 'lka.png' },
  GYSEV: { label: 'GYSEV', logo: 'gysev.png' },
  // Compagnies de ferry
  BRITTANY_FERRIES: { label: 'Brittany Ferries', logo: 'brittany_ferries.png' },
  DFDS: { label: 'DFDS', logo: 'dfds.png' },
  TRANSMANCHE: { label: 'Transmanche', logo: 'transmanche.png' },
  IRISH_RAIL: { label: 'Irish Rail', logo: 'irish_rail.png' },
};

/** Flux distincts dans l'API, une seule compagnie pour le visiteur : grandes lignes et régional de la DB. */
const SAME_COMPANY: Record<string, string> = { DB_REGIO: 'DB', ARRIVA_PL: 'ARRIVA_CZ' };

/**
 * Compagnies régionales : leurs horaires sont intégrés et comptés dans « Horaires de N opérateurs »,
 * mais le bandeau ne montre que les compagnies nationales et les marques connues du visiteur.
 */
const NOT_IN_STRIP = new Set([
  'POLREGIO', 'KOLEJE_DOLNOSLASKIE', 'KOLEJE_MALOPOLSKIE', 'KOLEJE_MAZOWIECKIE', 'KOLEJE_SLASKIE',
  'KOLEJE_WIELKOPOLSKIE', 'LKA', 'GYSEV', 'GW_TRAIN', 'TRILEX', 'ARRIVA_CZ', 'TRENORD',
]);

/** Secondes de défilement par logo : la vitesse reste la même quel que soit le nombre de compagnies. */
const SECONDS_PER_LOGO = 3;

/**
 * Opérateurs dont les horaires sont intégrés, d'après /health de l'API Europe : un nouveau réseau
 * apparaît sans modifier le site. Logos en gris : ce sont des sources de données, pas des partenaires.
 */
export function OperatorsStrip() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/health`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        const seen = new Set<string>();
        const companies: Operator[] = [];
        for (const op of (data.operators ?? []) as Operator[]) {
          const id = SAME_COMPANY[op.id] ?? op.id;
          if (!seen.has(id)) {
            seen.add(id);
            companies.push({ ...op, id });
          }
        }
        setTotal(companies.length);
        setOperators(companies.filter((op) => !NOT_IN_STRIP.has(op.id)));
      })
      .catch(() => {
        // API injoignable : la ligne reste vide plutôt que d'afficher une erreur
      });
    return () => controller.abort();
  }, []);

  return (
    // Hauteur réservée : la page ne saute pas quand la liste arrive
    <div className="mt-8 md:mt-10 min-h-[76px]">
      {operators.length > 0 && (
        <>
          <p className="text-xs font-medium text-slate-400 mb-3">
            Horaires de {total} opérateurs, issus de leurs données ouvertes ·{' '}
            <Link to="/comment-ca-marche" className="underline hover:text-slate-600">
              Comment ça marche
            </Link>
          </p>
          {/* Défilement continu : la liste est écrite deux fois et glisse de la largeur d'une copie, sans à-coup.
              Survol : pause. Mouvement réduit demandé par le système : une seule copie, défilable à la main. */}
          <div
            className="group overflow-hidden motion-reduce:overflow-x-auto -mx-6 md:mx-0"
            style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}
          >
            <div
              className="flex w-max defilement"
              style={{ animationDuration: `${operators.length * SECONDS_PER_LOGO}s` }}
            >
              <OperatorList operators={operators} />
              <OperatorList operators={operators} hidden />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Une copie de la liste ; `hidden` : la copie qui sert seulement à boucler (ignorée des lecteurs d'écran). */
function OperatorList({ operators, hidden = false }: { operators: Operator[]; hidden?: boolean }) {
  return (
    <ul className={`flex items-center py-2 ${hidden ? 'motion-reduce:hidden' : ''}`} aria-hidden={hidden || undefined}>
      {operators.map((op) => (
        // marge à droite plutôt que gap : les deux copies ont exactement la même largeur
        <li key={op.id} className="flex-shrink-0 pr-10" title={OPERATORS[op.id]?.label ?? op.name}>
          <OperatorLogo op={op} hidden={hidden} />
        </li>
      ))}
    </ul>
  );
}

/** Logo de la compagnie ; son nom en texte s'il n'y a pas de logo, ou si le fichier n'a pas encore été ajouté. */
function OperatorLogo({ op, hidden }: { op: Operator; hidden: boolean }) {
  const [failed, setFailed] = useState(false);
  const known = OPERATORS[op.id];
  const label = known?.label ?? op.name;
  if (!known?.logo || failed) {
    return <span className="text-sm font-bold text-slate-400 whitespace-nowrap">{label}</span>;
  }
  return (
    <img
      src={`/assets/compagnies/${known.logo}`}
      alt={hidden ? '' : label}
      loading="lazy"
      onError={() => setFailed(true)}
      // mix-blend-multiply : les logos à fond blanc se fondent dans le dégradé de l'accueil
      className={`${known.size ?? 'h-6 w-auto max-w-[120px] object-contain'} mix-blend-multiply grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition`}
    />
  );
}
