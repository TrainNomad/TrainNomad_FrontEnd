// Logos des trains (public/assets/compagnies/) selon le `train_type` renvoyé par l'API.

const BY_TYPE: Record<string, string> = {
  'TGV INOUI': 'TGV InOui.png',
  OUIGO: 'ouigo.png',
  TER: 'TER.png',
  'Car TER': 'TER.png',
  'Tram-train': 'TER.png',
  Navette: 'TER.png',
  'Intercités': 'intercites.png',
  'Intercités de nuit': 'intercites.png',
  'TGV Lyria': 'lyria.png',
  ICE: 'ice.png',
  Eurostar: 'eurostar.png',
  AVE: 'ave.png',
  'AVE International': 'ave.png',
  Avlo: 'Renfe_Avlo.png',
  Alvia: 'Renfe_Alvia.png',
  Avant: 'Renfe_Avant.png',
  'Avant Exprés': 'Renfe_Avant.png',
  Euromed: 'Renfe_Euromed.png',
  Intercity: 'Renfe_Intercity.png',
  'Media Distancia': 'Renfe_Media_Distancia.png',
  Regional: 'Renfe_regionales.png',
  'Regional Exprés': 'Renfe_regionales.png',
  Proximidad: 'Renfe_regionales.png',
  'Tren Celta': 'renfe.png',
  'European Sleeper': 'european_sleeper.png',
};

const BY_OPERATOR: Record<string, string> = {
  RENFE: 'renfe.png',
  EUROSTAR: 'eurostar.png',
  EUROPEAN_SLEEPER: 'european_sleeper.png',
};

/** Chemin du logo, ou null si aucun logo n'est disponible (afficher alors le nom du train). */
export function trainLogo(trainType: string, operator?: string): string | null {
  const file = BY_TYPE[trainType] ?? (operator ? BY_OPERATOR[operator] : undefined);
  return file ? `/assets/compagnies/${encodeURIComponent(file)}` : null;
}
