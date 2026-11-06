// Génère public/sitemap.xml avant chaque build : pages fixes, un guide par slug de l'API des guides, et les
// liaisons et pages TGVmax par ville de src/lib/seoPagesData.json (écrit juste avant par scripts/seo-pages.mjs).
// Les cartes « Depuis <ville> » (src/lib/cartes.json) sont déclarées comme images de /train.
// API injoignable : le sitemap existant est conservé tel quel.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const SITE = 'https://trainnomad.eu';
const GUIDES_API = process.env.VITE_GUIDES_API_URL || 'https://guides-api.trainnomad.eu';
const PAGES = [
  ['/', '1.0'],
  ['/trajets', '0.9'],
  ['/explorer', '0.9'],
  ['/tgvmax', '0.9'],
  ['/tgvmax/explorer', '0.8'],
  ['/guides', '0.9'],
  ['/train', '0.8'],
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
  const seo = JSON.parse(readFileSync(new URL('../src/lib/seoPagesData.json', import.meta.url), 'utf8'));
  const urls = [
    ...PAGES,
    ...guides.map((g) => [`/guides/${g.slug}`, '0.7']),
    ...seo.liaisons.map((l) => [`/train/${l.slug}/`, '0.7']),
    ...seo.tgvmax.map((c) => [`/tgvmax/depuis/${c.slug}/`, '0.6']),
  ];
  const cartesFile = new URL('../src/lib/cartes.json', import.meta.url);
  const cartes = existsSync(cartesFile) ? JSON.parse(readFileSync(cartesFile, 'utf8')).cities.flatMap((c) => c.maps) : [];
  const images = { '/train': cartes.filter((m) => m.image).map((m) => `${SITE}/cartes/${m.image}.webp`) };
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...urls.map(([path, priority]) => `  <url><loc>${SITE}${path}</loc><priority>${priority}</priority>${(images[path] ?? [])
      .map((img) => `<image:image><image:loc>${img}</image:loc></image:image>`)
      .join('')}</url>`),
    '</urlset>',
    '',
  ].join('\n');
  writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml);
  console.log(`sitemap.xml : ${urls.length} URLs (${guides.length} guides, ${seo.liaisons.length} liaisons, ${seo.tgvmax.length} villes TGVmax)`);
} catch (err) {
  console.warn(`sitemap.xml non régénéré (${err.message}) : version existante conservée`);
}
