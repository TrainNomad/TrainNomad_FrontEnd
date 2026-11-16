// Devises des prix saisis et conversion en euros pour le budget, au taux de référence de la Banque centrale
// européenne (publié chaque jour ouvré), via le service public Frankfurter. Taux gardés 12 h sur l'appareil.

export const CURRENCIES = ['EUR', 'GBP', 'CHF', 'CZK', 'PLN', 'HUF', 'RON', 'SEK', 'DKK', 'NOK', 'ISK', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_LABELS: Record<Currency, string> = {
  EUR: 'Euro (€)',
  GBP: 'Livre sterling (£)',
  CHF: 'Franc suisse',
  CZK: 'Couronne tchèque',
  PLN: 'Złoty polonais',
  HUF: 'Forint hongrois',
  RON: 'Leu roumain',
  SEK: 'Couronne suédoise',
  DKK: 'Couronne danoise',
  NOK: 'Couronne norvégienne',
  ISK: 'Couronne islandaise',
  USD: 'Dollar américain',
};

export function formatMoney(amount: number | string | null | undefined, currency: string = 'EUR'): string {
  return Number(amount ?? 0).toLocaleString('fr-FR', { style: 'currency', currency });
}

export interface Rates {
  /** Date de publication des taux BCE (AAAA-MM-JJ) */
  date: string;
  /** Unités de devise pour 1 euro */
  perEuro: Record<string, number>;
}

const RATES_URL = 'https://api.frankfurter.dev/v1/latest?base=EUR';
const CACHE_KEY = 'trainnomad-mes-voyages-taux';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

let inflight: Promise<Rates> | null = null;

/** Taux du jour (cache de l'appareil, sinon téléchargement). */
export function getRates(): Promise<Rates> {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return Promise.resolve(cached.rates as Rates);
  } catch {
    // pas de cache : on télécharge
  }
  inflight ??= fetch(RATES_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`taux ${res.status}`);
      return res.json();
    })
    .then((data: { date: string; rates: Record<string, number> }) => {
      const rates: Rates = { date: data.date, perEuro: { ...data.rates, EUR: 1 } };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), rates }));
      } catch {
        // stockage indisponible
      }
      return rates;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Montant converti en euros, ou null si le taux manque. */
export function toEuros(amount: number, currency: string, rates: Rates | null): number | null {
  if (currency === 'EUR') return amount;
  const rate = rates?.perEuro[currency];
  return rate ? Math.round((amount / rate) * 100) / 100 : null;
}
