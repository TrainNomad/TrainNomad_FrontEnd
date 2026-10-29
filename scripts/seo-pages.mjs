// Avant chaque build : relève les données des pages générées automatiquement, d'après les API en ligne.
//   - une page par liaison (/train/paris-londres/) : chaque liaison du globe (src/lib/globeNetwork.json), plus
//     les villes de « liaisonsDepuis » vers chaque ville qui a un guide ; journée type dans public/liaisons/ ;
//   - l'encart « Venir en train » des guides (villes de « guideDepuis ») ;
//   - une page TGVmax par ville de « tgvmaxDepuis » (/tgvmax/depuis/lyon/) : places des 30 prochains jours
//     dans public/tgvmax-depuis/ (relevé pour les moteurs de recherche, la page recalcule en direct).
// Réglages : src/lib/seoPages.json. Index écrit dans src/lib/seoPagesData.json (lu par l'application,
// scripts/sitemap.mjs et scripts/prerender.mjs).
// API injoignable : les fichiers existants sont gardés tels quels. Une liaison en erreur garde son relevé précédent.
// Lancé avec node --experimental-strip-types : les calculs sont ceux des pages (src/lib/liaisons.ts, tgvmaxDepuis.ts).
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fetchDay, liaisonDay, slugify, summarize, typicalDay } from '../src/lib/liaisons.ts';
import { fetchMaxFrom } from '../src/lib/tgvmaxDepuis.ts';

const API = process.env.VITE_API_URL || 'https://api.trainnomad.eu';
const TGVMAX_API = process.env.VITE_TGVMAX_API_URL || 'https://tgvmax-api.trainnomad.eu';
const GUIDES_API = process.env.VITE_GUIDES_API_URL || 'https://guides-api.trainnomad.eu';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const CONFIG = read('../src/lib/seoPages.json');
const NETWORK = read('../src/lib/globeNetwork.json');
const INDEX_FILE = new URL('../src/lib/seoPagesData.json', import.meta.url);
const LIAISONS_DIR = new URL('../public/liaisons/', import.meta.url);
const MAX_DIR = new URL('../public/tgvmax-depuis/', import.meta.url);
const previous = existsSync(INDEX_FILE) ? JSON.parse(readFileSync(INDEX_FILE, 'utf8')) : { liaisons: [], guides: {}, tgvmax: [] };

async function getJSON(url, timeout = 60_000) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  if (!res.ok) throw new Error(`HTTP ${res.status} (${url})`);
  return res.json();
}

/** Exécute les tâches `limit` à la fois. */
async function pool(items, limit, task) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await task(items[i], i);
      }
    }),
  );
  return results;
}

const km = (a, b) => {
  const r = Math.PI / 180;
  return 6371 * Math.hypot((b.lon - a.lon) * r * Math.cos(((a.lat + b.lat) / 2) * r), (b.lat - a.lat) * r);
};

/**
 * Ville (ou à défaut gare) de l'API qui correspond à `name` : la plus proche de `near` s'il est donné
 * (coordonnées du globe), sinon celle dont le nom (ou la ville, pour une gare) est `name`. null si rien ne correspond.
 */
const places = new Map();
async function place(api, name, near) {
  const key = `${api}|${name}`;
  if (!places.has(key)) {
    places.set(
      key,
      getJSON(`${api}/stations?${new URLSearchParams({ q: name, limit: '8' })}`).then(({ results }) => {
        const cityFirst = (a, b) => (a.type === 'city' ? 0 : 1) - (b.type === 'city' ? 0 : 1);
        if (near) return results.filter((p) => km(near, p) < 40).sort((a, b) => cityFirst(a, b) || km(near, a) - km(near, b))[0] ?? null;
        // Ville du même nom, sinon sa gare principale (l'API TGVmax n'a pas de ville « Bordeaux », seulement Bordeaux St-Jean)
        return results.filter((p) => slugify(p.name) === slugify(name) || slugify(p.city ?? '') === slugify(name)).sort(cityFirst)[0] ?? null;
      }),
    );
  }
  return places.get(key);
}

const ref = (p, name) => ({ name, id: p.id, country: p.country, lat: p.lat, lon: p.lon });

// ─── API joignables ? ─────────────────────────────────────────────────────────

try {
  await getJSON(`${API}/health`, 90_000);
} catch (err) {
  console.warn(`seo-pages : API injoignable (${err.message}), pages gardées telles quelles`);
  process.exit(0);
}

const builtAt = new Date().toISOString();
const date = typicalDay(new Date());

let guides = [];
try {
  guides = (await getJSON(`${GUIDES_API}/guides`, 90_000)).guides ?? [];
} catch (err) {
  console.warn(`seo-pages : guides indisponibles (${err.message})`);
}

// ─── Liste des liaisons ───────────────────────────────────────────────────────

const wanted = []; // { from: { name, near? }, to: { name, near? }, orient }
const globeCity = (key) => {
  const c = NETWORK.cities[key];
  return { name: c.label || c.name, near: { lat: c.lat, lon: c.lng } };
};
for (const [a, b] of NETWORK.routes) wanted.push({ from: globeCity(a), to: globeCity(b), orient: true });
for (const origin of CONFIG.liaisonsDepuis ?? []) {
  for (const g of guides) wanted.push({ from: { name: origin }, to: { name: g.name } });
}

// Résolution des villes, puis une page par couple (sans doublon, ni aller-retour en double)
const guideByPlace = new Map();
for (const g of guides) {
  const p = await place(API, g.name);
  if (p) guideByPlace.set(p.id, g.slug);
  else console.warn(`seo-pages : ville du guide ${g.slug} introuvable dans l'API (${g.name})`);
}

const liaisons = new Map();
const pairs = new Set();
for (const w of wanted) {
  const [from, to] = await Promise.all([place(API, w.from.name, w.from.near), place(API, w.to.name, w.to.near)]);
  if (!from || !to) {
    console.warn(`seo-pages : liaison ${w.from.name} → ${w.to.name} ignorée (ville introuvable dans l'API)`);
    continue;
  }
  // Liaisons du globe, données dans un ordre quelconque : Paris d'abord, sinon la ville française
  const swap = w.orient && (slugify(w.to.name) === 'paris' || (slugify(w.from.name) !== 'paris' && to.country === 'FR' && from.country !== 'FR'));
  if (swap) [w.from, w.to] = [w.to, w.from];
  const [a, b] = swap ? [to, from] : [from, to];
  if (a.id === b.id || pairs.has(`${a.id}|${b.id}`) || pairs.has(`${b.id}|${a.id}`)) continue;
  pairs.add(`${a.id}|${b.id}`);
  const slug = `${slugify(w.from.name)}-${slugify(w.to.name)}`;
  liaisons.set(slug, { slug, from: ref(a, w.from.name), to: ref(b, w.to.name), guide: guideByPlace.get(b.id) ?? null });
}

// ─── Journée type de chaque liaison ───────────────────────────────────────────

mkdirSync(LIAISONS_DIR, { recursive: true });
const previousLiaisons = new Map(previous.liaisons.map((l) => [l.slug, l]));
const pages = await pool([...liaisons.values()], 3, async (l) => {
  try {
    const day = liaisonDay(await fetchDay(API, l.from.id, l.to.id, date), date, builtAt);
    const summary = summarize(day.journeys);
    if (!summary) {
      console.warn(`seo-pages : aucun trajet ${l.from.name} → ${l.to.name} le ${date}, pas de page`);
      return null;
    }
    writeFileSync(new URL(`${l.slug}.json`, LIAISONS_DIR), JSON.stringify(day));
    return { ...l, date, summary };
  } catch (err) {
    const old = previousLiaisons.get(l.slug);
    console.warn(`seo-pages : ${l.slug} non relevée (${err.message})${old ? ', relevé précédent gardé' : ''}`);
    return old ?? null;
  }
});
const liaisonPages = pages.filter(Boolean);
const kept = new Set(liaisonPages.map((l) => `${l.slug}.json`));
for (const file of readdirSync(LIAISONS_DIR)) if (!kept.has(file)) rmSync(new URL(file, LIAISONS_DIR));

// ─── Encart « Venir en train » des guides ─────────────────────────────────────

const bySlug = new Map(liaisonPages.map((l) => [l.slug, l]));
const guideAccess = {};
await pool(guides, 2, async (g) => {
  const to = await place(API, g.name);
  if (!to) return;
  const toMax = await place(TGVMAX_API, g.name).catch(() => null);
  const rows = [];
  for (const origin of CONFIG.guideDepuis ?? []) {
    const from = await place(API, origin);
    if (!from || from.id === to.id) continue;
    const slug = `${slugify(origin)}-${slugify(g.name)}`;
    let summary = bySlug.get(slug)?.summary;
    if (!summary) {
      try {
        summary = summarize(liaisonDay(await fetchDay(API, from.id, to.id, date), date, builtAt).journeys);
      } catch (err) {
        console.warn(`seo-pages : ${origin} → ${g.name} non relevé (${err.message})`);
      }
    }
    if (!summary) continue;
    const fromMax = toMax ? await place(TGVMAX_API, origin).catch(() => null) : null;
    rows.push({
      from: ref(from, origin),
      to: ref(to, g.name),
      summary,
      liaison: bySlug.has(slug) ? slug : null,
      tgvmax: fromMax && toMax ? { from: fromMax.id, to: toMax.id } : null,
    });
  }
  if (rows.length) guideAccess[g.slug] = rows;
});

// ─── Pages TGVmax par ville ───────────────────────────────────────────────────

mkdirSync(MAX_DIR, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
const previousMax = new Map(previous.tgvmax.map((t) => [t.slug, t]));
const maxPages = (
  await pool(CONFIG.tgvmaxDepuis ?? [], 2, async (name) => {
    const slug = slugify(name);
    try {
      const p = await place(TGVMAX_API, name);
      if (!p) throw new Error('ville introuvable dans l’API TGVmax');
      const data = await fetchMaxFrom(TGVMAX_API, p.id, today);
      writeFileSync(new URL(`${slug}.json`, MAX_DIR), JSON.stringify(data));
      return { slug, name, id: p.id, count: data.destinations.length };
    } catch (err) {
      console.warn(`seo-pages : TGVmax depuis ${name} non relevé (${err.message})`);
      return previousMax.get(slug) ?? null;
    }
  })
).filter(Boolean);
const keptMax = new Set(maxPages.map((t) => `${t.slug}.json`));
for (const file of readdirSync(MAX_DIR)) if (!keptMax.has(file)) rmSync(new URL(file, MAX_DIR));

// ─── Index ────────────────────────────────────────────────────────────────────

const sortedGuides = Object.fromEntries(Object.entries(guideAccess).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(INDEX_FILE, JSON.stringify({ built_at: builtAt, date, liaisons: liaisonPages, guides: sortedGuides, tgvmax: maxPages }, null, 1) + '\n');
console.log(
  `seo-pages : ${liaisonPages.length} liaisons (journée du ${date}), ${Object.keys(sortedGuides).length} guides, ${maxPages.length} villes TGVmax`,
);
