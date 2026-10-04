// Logos des trains (public/assets/compagnies/) selon le `train_type` et l'`operator` renvoyés par l'API.

const BY_TYPE: Record<string, string> = {
  // --- SNCF (avec préfixe compagnie) ---
  'SNCF TGV INOUI': 'TGV InOui.png',
  'SNCF OUIGO': 'ouigo.png',
  'SNCF TER': 'TER.png',
  'SNCF Car TER': 'TER.png',
  'SNCF Car': 'TER.png',
  'SNCF Tram-train': 'TER.png',
  'SNCF Navette': 'TER.png',
  'SNCF Intercités': 'intercites.png',
  'sncf Intercités de nuit': 'intercite de nuit sncf.png',
  'SNCF TGV Lyria': 'lyria.png',
  'SNCF ICE': 'ice.png',
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
  SWISS: 'SBB.png', // SBB/CFF/FFS Swiss Railways
  OUIGO_ES: 'ouigo.png',
};

/** Chemin du logo, ou null si aucun logo n'est disponible (afficher alors le nom du train). */
export function trainLogo(trainType: string, operator?: string): string | null {
  // Normalisation ou recherche directe (on gère aussi les variations de casse si besoin)
  const file = BY_TYPE[trainType] ?? BY_TYPE[trainType?.toUpperCase()] ?? (operator ? BY_OPERATOR[operator.toUpperCase()] : undefined);
  return file ? `/assets/compagnies/${encodeURIComponent(file)}` : null;
}