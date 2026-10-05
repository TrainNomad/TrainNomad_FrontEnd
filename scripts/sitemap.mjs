// Génère public/sitemap.xml avant chaque build (pages fixes + un guide par slug de l'API des guides).
// API injoignable : le sitemap existant est conservé tel quel.
import { writeFileSync } from 'node:fs';

const SITE = 'https://trainnomad.eu';
const GUIDES_API = process.env.VITE_GUIDES_API_URL || 'https://guides-api.trainnomad.eu';
const PAGES = [
  ['/', '1.0'],
  ['/trajets', '0.9'],
  ['/explorer', '0.9'],
  ['/tgvmax', '0.9'],
  ['/tgvmax/explorer', '0.8'],
  ['/guides', '0.9'],
  ['/a-propos', '0.5'],
  ['/comment-ca-marche', '0.5'],
  ['/mentions-legales', '0.3'],
  ['/conditions', '0.3'],
  ['/confidentialite', '0.3'],
];

try {
  const res = await fetch(`${GUIDES_API}/guides`, { signal: AbortSignal.timeout(90_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { guides } = await res.json();
  const urls = [...PAGES, ...guides.map((g) => [`/guides/${g.slug}`, '0.7'])];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(([path, priority]) => `  <url><loc>${SITE}${path}</loc><priority>${priority}</priority></url>`),
    '</urlset>',
    '',
  ].join('\n');
  writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml);
  console.log(`sitemap.xml : ${urls.length} URLs (${guides.length} guides)`);
} catch (err) {
  console.warn(`sitemap.xml non régénéré (${err.message}) : version existante conservée`);
}
