// Logos des trains (public/assets/compagnies/) selon le `train_type` et l'`operator` renvoyés par l'API.

const BY_TYPE: Record<string, string> = {
  // --- SNCF (avec préfixe compagnie) ---
  'SNCF TGV INOUI': 'TGV InOui.png',
  'SNCF OUIGO': 'ouigo.png',
  'SNCF OUIGO Train Classique': 'ouigo-classique.png',
  'SNCF TER': 'TER.png',
  'SNCF Car TER': 'TER.png',
  'SNCF Car': 'TER.png',
  'SNCF Tram-train': 'TER.png',
  'SNCF Navette': 'TER.png',
  'SNCF Intercités': 'intercites.png',
  'sncf Intercités de nuit': 'intercite de nuit sncf.png',
  'SNCF TGV Lyria': 'lyria.png',
  'SNCF ICE': 'ice.png',
  'DB SNCF en coopération': 'sncf-db-coop.png', // TGV INOUI / ICE franco-allemands (95xx)
  // Legacy mappings (sans préfixe)
  'TGV INOUI': 'TGV InOui.png',
  OUIGO: 'ouigo.png',
  'Train TER': 'TER.png',
  TER: 'TER.png',
  'Car TER': 'TER.png',
  'Car à réservation': 'TER.png',
  TramTrain: 'TER.png',
  'Tram-train': 'TER.png',
  Navette: 'TER.png',
  INTERCITES: 'intercites.png',
  Intercités: 'intercites.png',
  'Intercités de nuit': 'intercite de nuit sncf.png',
  Lyria: 'lyria.png',
  'TGV Lyria': 'lyria.png',
  ICE: 'ice.png',

  // --- Ouigo Espagne ---
  'Ouigo España': 'ouigo.png',

  // --- Eurostar ---
  Eurostar: 'eurostar.png',
  Thalys: 'eurostar.png',

  // --- Renfe (avec préfixe compagnie) ---
  'Renfe AVE': 'ave.png',
  'Renfe AVE International': 'ave.png',
  'Renfe Avlo': 'Renfe_Avlo.png',
  'Renfe Alvia': 'Renfe_Alvia.png',
  'Renfe Avant': 'Renfe_Avant.png',
  'Renfe Avant Exprés': 'Renfe_Avant.png',
  'Renfe Euromed': 'Renfe_Euromed.png',
  'Renfe Intercity': 'Renfe_Intercity.png',
  'Renfe Media Distancia': 'Renfe_Media_Distancia.png',
  'Renfe Regional': 'Renfe_regionales.png',
  'Renfe Regional Exprés': 'Renfe_regionales.png',
  'Renfe Proximidad': 'Renfe_regionales.png',
  'Renfe Tren Celta': '',
  // Legacy mappings (sans préfixe)
  AVE: 'ave.png',
  'AVE International': 'ave.png',
  AVLO: 'Renfe_Avlo.png',
  Avlo: 'Renfe_Avlo.png',
  ALVIA: 'Renfe_Alvia.png',
  Alvia: 'Renfe_Alvia.png',
  AVANT: 'Renfe_Avant.png',
  Avant: 'Renfe_Avant.png',
  'Avant Exprés': 'Renfe_Avant.png',
  EUROMED: 'Renfe_Euromed.png',
  Euromed: 'Renfe_Euromed.png',
  INTERCITY: 'Renfe_Intercity.png',
  Intercity: 'Renfe_Intercity.png',
  MD: 'Renfe_Media_Distancia.png',
  'Media Distancia': 'Renfe_Media_Distancia.png',
  Regional: 'Renfe_regionales.png',
  'Regional Exprés': 'Renfe_regionales.png',
  Proximidad: 'Renfe_regionales.png',
  'Tren Celta': '',

  // --- European Sleeper ---
  'European Sleeper': 'european_sleeper.png',

  // --- Trenitalia (avec préfixe compagnie) ---
  'Trenitalia Frecciarossa': 'frecciarossa.png',
  'Trenitalia Frecciargento': 'frecciargento.png',
  'Trenitalia Frecciabianca': 'frecciabianca.png',
  'Trenitalia FrecciaLink': 'frecciarossa.png',
  'Trenitalia Intercity': 'InterCity trenitalia.png',
  'Trenitalia Intercity Notte': 'trenitalia Intercity Notte.png',
  'Trenitalia EuroCity': 'eurocity trenitalia.png',
  'Trenitalia EuroNight': 'nightjet.png',
  'Trenitalia Espresso': 'trenitalia.png',
  'Trenitalia Regionale Veloce': 'Regionale Veloce.png',
  'Trenitalia Regionale': 'Regionale Veloce.png',
  'Trenitalia Metropolitano': 'trenitalia.png',
  'Trenitalia SFM': 'trenitalia.png',
  'Trenitalia Bus': 'trenitalia.png',
  // Legacy mappings (sans préfixe)
  Frecciarossa: 'frecciarossa.png',
  Frecciargento: 'frecciargento.png',
  Frecciabianca: 'frecciabianca.png',
  FrecciaLink: 'frecciarossa.png',
  'trenitalia Intercity': 'InterCity trenitalia.png',
  'trenitalia Intercity Notte': 'trenitalia Intercity Notte.png',
  EuroCity: 'eurocity trenitalia.png',
  EuroNight: 'nightjet.png',
  Espresso: 'trenitalia.png',
  'Regionale Veloce': 'Regionale Veloce.png',
  Regionale: 'Regionale Veloce.png',
  Metropolitano: 'trenitalia.png',
  SFM: 'trenitalia.png',
  Bus: 'trenitalia.png',

  // --- NTV Italo ---
  'Italo Train': 'italo.png',
  Italo: 'italo.png',

  // --- CP Portugal (avec préfixe compagnie) ---
  'CP Alfa Pendular': 'Alfa_Pendular.png',
  'CP Intercidades': 'Comboios-de-Portugal.png',
  'CP InterRegional': 'InterRegional.png',
  'CP Regional': 'Comboios-de-Portugal.png',
  'CP Urbano': 'Comboios-de-Portugal.png',
  'CP Suburbano': 'Comboios-de-Portugal.png',
  // Legacy mappings (sans préfixe)
  'Alfa Pendular': 'Alfa_Pendular.png',
  'cp Intercidades': 'Comboios-de-Portugal.png',
  'InterRegional': 'InterRegional.png',
  'cp Regional': 'Comboios-de-Portugal.png',
  'Urbano': 'Comboios-de-Portugal.png',
  'Suburbano': 'Comboios-de-Portugal.png',

  // --- SBB/CFF Swiss (logo générique) ---
  // Train type is sent as "SBB" with details in train number (e.g., "SBB #IC 1", "SBB #RE 33")
  SBB: 'sbb.png',
  'SBB InterCity': 'SBB ic.png',
  'SBB InterRegio': 'SBB ir.png',
  'SBB RegioExpress': 'sbb.png',
  'SBB Regio': 'sbb.png',
  'SBB S-Bahn': 'sbb.png',
  'SBB Nightjet': 'nightjet.png',

  // --- SNCB/NMBS Belgique ---
  'SNCB InterCity': 'SNCB.png',
  'SNCB Local': 'SNCB.png',
  'SNCB Heure de pointe': 'SNCB.png',
  'SNCB S-Train': 'SNCB.png',
  'SNCB Touristique': 'SNCB.png',
  'SNCB Extra': 'SNCB.png',
  'SNCB Train': 'SNCB.png',
  'SNCB EuroCity': 'eurocity.png',
  'SNCB ICE': 'ice.png',
  'SNCB Nightjet': 'nightjet.png',

  // --- Pays-Bas (flux "NS" : NS, Arriva, Keolis, Qbuzz et trains des pays voisins) ---
  'NS Intercity': 'NS.png',
  'NS Intercity direct': 'NS.png',
  'NS Sprinter': 'NS.png',
  'NS Eurocity Direct': 'NS.png',
  'NS EuroCity': 'eurocity.png',
  'NS ICE': 'ice.png',
  'NS Nightjet': 'nightjet.png',
  'SNCB Stoptrein': 'SNCB.png',
  'Arriva Stoptrein': 'ns_arriva.png',
  'Arriva Sneltrein': 'ns_arriva.png',
  'Arriva Nachttrein': 'ns_arriva.png',
  'Keolis Sprinter': 'ns_keolis.png',
  'Keolis Intercity': 'ns_keolis.png',
  'Qbuzz Stoptrein': 'ns_Qbuzz.png',
  'DB Stoptrein': 'db.png',
  'VIAS Stoptrein': 'ns_vias.png',
  'Eurobahn Stoptrein': 'ns_eurobahn.png',
  'Eurobahn Sneltrein': 'ns_eurobahn.png',
  GoVolta: 'ns_go_volta.png',

  // --- Trenord (Lombardie) ---
  'Trenord Regionale': 'trenord.png',
  'Trenord RegioExpress': 'trenord.png',
  'Trenord Malpensa Express': 'trenord.png',

  // --- National Rail (UK Operators by Name) ---
  'Transport for Wales': 'transport_for_wales.png',
  c2c: 'c2c.png',
  'Chiltern Railways': 'chiltern_railways.png',
  'Caledonian Sleeper': 'caledonian_sleeper.png',
  'East Midlands Railway': 'east_midlands_railway.png',
  'Grand Central': 'grand_central.png',
  'Great Northern': 'great_northern.png',
  LNER: 'lner.png',
  'Great Western Railway': 'gwr.png',
  'Gatwick Express': 'gatwick_express.png',
  'Hull Trains': 'hull_trains.png',
  'Heathrow Express': 'heathrow_express.png',
  'Island Line': 'South_Western_Railway.png',
  Lumo: 'lumo.png',
  'Greater Anglia': 'greater_anglia.png',
  'West Midlands Trains': 'west_midlands_railway.png',
  'London Overground': 'london_overground.png',
  'London Underground': 'london_underground.png',
  Merseyrail: 'merseyrail.png',
  Northern: 'northern.png',
  'North Yorkshire Moors Railway': 'nymr.png',
  Southeastern: 'southeastern.png',
  'Sheffield Supertram': 'supertram.png',
  Southern: 'southern.png',
  ScotRail: 'scotrail.png',
  'South Western Railway': 'South_Western_Railway.png',
  'Stansted Express': 'stansted_express.png',
  Thameslink: 'thameslink.png',
  'TransPennine Express': 'transpennine_express.png',
  'Tyne and Wear Metro': 'tyne_and_wear_metro.png',
  'Avanti West Coast': 'avanti_west_coast.png',
  'West Coast Railways': 'west_coast_railways.png',
  CrossCountry: 'crosscountry.png',
  'Elizabeth line': 'elizabeth_line.png',
  'UK National Rail': 'SNCB.png',
};

const BY_OPERATOR: Record<string, string> = {
  SNCF: 'TGV InOui.png',
  EUROSTAR: 'eurostar.png',
  RENFE: 'renfe.png',
  EUROPEAN_SLEEPER: 'european_sleeper.png',
  NATIONAL_RAIL: '',
  TRENITALIA: 'trenitalia.png',
  ITALO: 'italo.png',
  CP: 'Comboios-de-Portugal.png',
  SWISS: 'sbb.png', // SBB/CFF/FFS Swiss Railways
  OUIGO_ES: 'ouigo.png',
  SNCB: 'SNCB.png',
  FLIXTRAIN: 'FlixTrain.png',
  NS: 'NS.png',
  DB: 'db.png',
  // compagnies étrangères des flux allemands (opérateurs créés par build_network.py)
  OBB: 'obb.png',
  PKP: 'pkp.svg',
  CD: 'cd.png',
  MAV: 'mav.png',
  DSB: 'dsb.png',
  CFL: 'cfl.png',
  ZSSK: 'zssk.png',
  HZPP: 'hzpp.svg',
};

// Flux allemands et types "<compagnie> <produit>" (ex. "DB ICE", "ÖBB Railjet Xpress", "HLB Regionalbahn").
// Le produit d'abord : un ICE garde le logo ICE quelle que soit la compagnie, comme un TGV INOUI celui d'INOUI.
// Puis la compagnie. Un fichier absent de public/assets/compagnies/ n'est pas une erreur : TrainLogo affiche
// alors le nom du train, et le logo apparaît dès que le fichier est ajouté.
const BY_CATEGORY: [RegExp, string][] = [
  // produits
  [/ ICE$/, 'ice.png'],
  [/ TGV INOUI$/, 'TGV InOui.png'],
  [/ EuroCity(-Express)?$/, 'eurocity.png'],
  [/ (EuroNight|Nightjet)$/, 'nightjet.png'],
  [/ Railjet( Xpress)?$/, 'railjet.svg'],
  // grandes compagnies
  [/^DB /, 'db.png'],
  [/^ÖBB /, 'obb.png'],
  [/^SBB /, 'sbb.png'],
  [/^THURBO /, 'thurbo.png'],
  [/^SNCB /, 'SNCB.png'],
  [/^PKP /, 'pkp.svg'],
  [/^ČD /, 'cd.png'],
  [/^MÁV /, 'mav.png'],
  [/^DSB /, 'dsb.png'],
  [/^CFL /, 'cfl.png'],
  [/^ZSSK /, 'zssk.png'],
  [/^HŽPP /, 'hzpp.svg'],
  [/^WESTbahn/, 'westbahn.png'],
  [/^LEO Express/, 'leo_express.png'],
  // compagnies régionales allemandes (marque donnée par build_network.py, DE_REGIO_BRANDS)
  [/^HLB /, 'hlb.svg'],
  [/^(alex|trilex|trilex-express|vogtlandbahn|oberpfalzbahn|waldbahn) /, 'laenderbahn.svg'],
  [/^VIAS /, 'ns_vias.png'],
  [/^agilis /, 'agilis.png'],
  [/^ODEG /, 'odeg.png'],
  [/^BRB /, 'brb.png'],
  [/^National Express /, 'national_express.png'],
  [/^nordbahn /, 'nordbahn.png'],
  [/^Arverio /, 'arverio.png'],
  [/^eurobahn /, 'ns_eurobahn.png'],
  [/^Erfurter Bahn /, 'erfurter_bahn.png'],
  [/^RegioTram Kassel /, 'regiotram_kassel.png'],
  [/^vlexx /, 'vlexx.png'],
  [/^AKN /, 'akn.png'],
  [/^NordWestBahn /, 'nordwestbahn.png'],
  [/^NEB /, 'neb.png'],
  [/^SWEG /, 'sweg.png'],
  [/^erixx /, 'erixx.png'],
  [/^Abellio /, 'abellio.png'],
  [/^cantus /, 'cantus.png'],
  [/^SÜWEX /, 'suewex.png'],
  [/^Süd-Thüringen-Bahn /, 'sued_thueringen_bahn.png'],
  [/^WestfalenBahn /, 'westfalenbahn.png'],
  [/^metronom /, 'metronom.png'],
  [/^Go-Ahead /, 'go_ahead.png'],
  [/^enno /, 'enno.png'],
  [/^HSB /, 'hsb.png'],
];

/** Chemin du logo, ou null si aucun logo n'est disponible (afficher alors le nom du train). */
export function trainLogo(trainType: string, operator?: string): string | null {
  const tt = trainType ?? '';
  const op = operator?.toUpperCase();

  // Produits propriétaires : afficher le logo seulement si exploité par une compagnie autorisée
  if (tt.includes('ICE') && op && !['DB', 'SNCB', 'NS', 'OBB'].includes(op)) return null;
  if (tt.includes('Railjet') && op && !['OBB', 'CD', 'MAV', 'ZSSK', 'DSB'].includes(op)) return null;
  if ((tt.includes('Nightjet') || tt.includes('EuroNight')) && op && !['OBB', 'SWISS', 'NS', 'SNCB'].includes(op)) return null;
  if (tt.includes('Trenitalia') && op !== 'TRENITALIA') return null;
  if (tt.includes('Renfe') && op !== 'RENFE') return null;
  // SNCF : seulement pour ses propres produits (TGV INOUI, TER, OUIGO, TGV Lyria, trains de nuit SNCF)
  if ((tt.startsWith('SNCF ') || tt.startsWith('sncf ')) && op !== 'SNCF') return null;
  // Trenitalia EuroNight : aussi exploité par ÖBB (NS Nightjet), mais le logo reste Trenitalia seulement si op=Trenitalia

  // Normalisation ou recherche directe
  const file =
    BY_TYPE[tt] ??
    BY_TYPE[tt.toUpperCase()] ??
    BY_CATEGORY.find(([re]) => re.test(tt))?.[1] ??
    (op ? BY_OPERATOR[op] : undefined);
  return file ? `/assets/compagnies/${encodeURIComponent(file)}` : null;
}