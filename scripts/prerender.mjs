// Après `vite build` : écrit une page HTML par URL dans dist/ (titre, description, URL canonique,
// balises de partage et texte de la page), pour les robots et les aperçus de liens qui n'exécutent
// pas JavaScript. Le navigateur charge ensuite l'application, qui remplace ce contenu.
// Render sert ces fichiers avant d'appliquer la réécriture /* -> /index.html (render.yaml).
// API des guides injoignable : seules les pages fixes sont générées.
// Pages des liaisons et TGVmax par ville : relevés de scripts/seo-pages.mjs (src/lib/seoPagesData.json, public/).
// Lancé avec node --experimental-strip-types : les textes des liaisons sont ceux de l'application.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { formatDuration } from '../src/lib/format.ts';
import { liaisonDescription, liaisonHow } from '../src/lib/liaisons.ts';

const SITE = 'https://trainnomad.eu';
const SITE_NAME = 'TrainNomad.eu';
const GUIDES_API = process.env.VITE_GUIDES_API_URL || 'https://guides-api.trainnomad.eu';
const DIST = new URL('../dist/', import.meta.url);
const PAGES = JSON.parse(readFileSync(new URL('../src/lib/pageMeta.json', import.meta.url), 'utf8'));
const FAQ = JSON.parse(readFileSync(new URL('../src/lib/faq.json', import.meta.url), 'utf8'));
const SEO = JSON.parse(readFileSync(new URL('../src/lib/seoPagesData.json', import.meta.url), 'utf8'));
const readPublic = (path) => JSON.parse(readFileSync(new URL(`../public/${path}`, import.meta.url), 'utf8'));

const NAV = [
  ['/trajets', 'Voyager'],
  ['/explorer', 'Explorer'],
  ['/guides', 'Guides'],
  ['/train', 'Liaisons en train'],
  ['/tgvmax', 'Outils TGVmax'],
  ['/a-propos', 'À propos'],
];

const template = readFileSync(new URL('index.html', DIST), 'utf8');
// Le script part de la page vide produite par `vite build` : il ne se relance pas sur un dist/ déjà traité.
if (!template.includes('<div id="root"></div>')) throw new Error('dist/index.html a déjà été traité : relancer `vite build` avant prerender');

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Remplace l'attribut `content` (ou `href`) d'une balise repérée par son début. */
function setTag(html, start, attr, value) {
  const re = new RegExp(`(${start}[^>]*?${attr}=")[^"]*(")`);
  if (!re.test(html)) throw new Error(`balise introuvable dans index.html : ${start}`);
  return html.replace(re, (_, before, after) => before + esc(value) + after);
}

/** Texte de la page, dans des classes déjà utilisées par l'application. */
function shell(body) {
  const nav = NAV.map(([href, label]) => `<a class="font-semibold underline" href="${href}">${label}</a>`).join(' · ');
  return [
    '<div class="max-w-4xl mx-auto px-6 py-16 font-display text-midnight">',
    `<p class="text-xl font-extrabold mb-10"><a href="/">${SITE_NAME}</a></p>`,
    body,
    `<nav class="mt-10 text-sm text-slate-500">${nav}</nav>`,
    '</div>',
  ].join('\n');
}

const h1 = (text) => `<h1 class="text-4xl font-extrabold tracking-tight mb-6">${esc(text)}</h1>`;
const h2 = (text) => `<h2 class="text-2xl font-bold mt-10 mb-4">${esc(text)}</h2>`;
const p = (text) => `<p class="text-lg text-slate-600 mb-4">${esc(text)}</p>`;
const list = (items) =>
  items?.length
    ? `<ul class="text-slate-600 mb-4">${items
        .map((i) => `<li><strong>${esc(i.name ?? i.title)}</strong>${i.description ? ` — ${esc(i.description)}` : ''}</li>`)
        .join('')}</ul>`
    : '';

/**
 * Image d'aperçu des liens partagés : celle de la page (public/og/, scripts/og-images.py), sinon l'image du
 * site déjà présente dans index.html. Toutes font 1200 x 630, comme le déclarent og:image:width / height.
 */
function writePage(path, { title, description, body, jsonLd, image }) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} · L'Europe en train`;
  const url = SITE + path;
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${esc(fullTitle)}</title>`);
  html = setTag(html, '<meta name="description"', 'content', description);
  html = setTag(html, '<link rel="canonical"', 'href', url);
  html = setTag(html, '<meta property="og:url"', 'content', url);
  html = setTag(html, '<meta property="og:title"', 'content', fullTitle);
  html = setTag(html, '<meta property="og:description"', 'content', description);
  if (image) html = setTag(html, '<meta property="og:image"', 'content', SITE + image);
  html = html.replace('<div id="root"></div>', `<div id="root">${shell(body)}</div>`);
  // Données structurées : « < » écrit sous sa forme échappée, pour que le texte ne puisse pas refermer la balise <script>
  if (jsonLd) {
    const json = JSON.stringify(jsonLd).replace(/</g, String.fromCharCode(92) + 'u003c');
    html = html.replace('</head>', `  <script type="application/ld+json">${json}</script>\n  </head>`);
  }

  // "/tgvmax" comme "/train/paris-londres/" (barre finale : Render sert alors directement le fichier)
  const dir = new URL(path === '/' ? './' : `.${path.replace(/\/$/, '')}/`, DIST);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('index.html', dir), html);
}

function guideBody(g) {
  const days = (g.itinerary ?? [])
    .map((d) => h2(`Jour ${d.day} : ${d.title}`) + (d.description ? p(d.description) : '') + list(d.steps))
    .join('\n');
  const practical = (g.practical ?? []).map((x) => `<p class="text-slate-600 mb-4"><strong>${esc(x.title)}</strong> — ${esc(x.content)}</p>`).join('');
  // `sections[].content` : HTML rédigé dans les fichiers des guides, repris tel quel comme dans l'application
  const sections = (g.sections ?? []).map((s) => h2(s.title) + `<div class="text-slate-600 mb-4">${s.content ?? ''}</div>`).join('\n');
  return [
    h1(g.featured_title || `Guide ${g.name}`),
    g.featured_subtitle ? p(g.featured_subtitle) : '',
    g.introduction ? p(g.introduction) : p(g.description),
    g.essentials?.to_see?.length ? h2('À voir') + list(g.essentials.to_see) : '',
    g.essentials?.experiences?.length ? h2('Expériences') + list(g.essentials.experiences) : '',
    g.essentials?.mobility?.length ? h2('Se déplacer') + list(g.essentials.mobility) : '',
    days,
    sections,
    practical ? h2('Infos pratiques') + practical : '',
  ].join('\n');
}

// ─── Pages fixes ──────────────────────────────────────────────────────────────

let guides = [];
try {
  const res = await fetch(`${GUIDES_API}/guides`, { signal: AbortSignal.timeout(90_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  guides = (await res.json()).guides ?? [];
} catch (err) {
  console.warn(`prerender : guides non générés (${err.message})`);
}

let count = 0;
for (const [path, page] of Object.entries(PAGES)) {
  if (page.prerender === false) continue;
  let body = h1(page.heading) + page.intro.map(p).join('\n');
  if (path === '/guides' && guides.length) {
    body += `<ul class="text-slate-600 mb-4">${guides
      .map((g) => `<li><a class="font-semibold underline" href="/guides/${esc(g.slug)}">${esc(g.name)}, ${esc(g.country)}</a> — ${esc(g.description)}</li>`)
      .join('')}</ul>`;
  }
  if (path === '/train' && SEO.liaisons.length) {
    body += `<ul class="text-slate-600 mb-4">${SEO.liaisons
      .map((l) => `<li><a class="font-semibold underline" href="/train/${esc(l.slug)}/">${esc(l.from.name)} → ${esc(l.to.name)}</a> — ${esc(formatDuration(l.summary.fastest_min))}, ${esc(liaisonHow(l.summary))}</li>`)
      .join('')}</ul>`;
  }
  // Accueil : questions fréquentes (src/lib/faq.json), en texte et en données structurées FAQPage
  let jsonLd;
  if (path === '/') {
    body += h2('Questions fréquentes') + FAQ.map((f) => `<h3 class="font-bold mt-6 mb-2">${esc(f.question)}</h3>${p(f.answer)}`).join('');
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
    };
  }
  writePage(path, { title: page.title, description: page.description, body, jsonLd, image: page.image });
  count++;
}

// ─── Un fichier par guide ─────────────────────────────────────────────────────

for (const { slug } of guides) {
  try {
    const res = await fetch(`${GUIDES_API}/guides/${slug}`, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const g = await res.json();
    // image produite par scripts/og-images.py ; guide ajouté depuis : aperçu général du site
    const image = existsSync(new URL(`og/guides/${slug}.jpg`, DIST)) ? `/og/guides/${slug}.jpg` : undefined;
    if (!image) console.warn(`prerender : pas d'image d'aperçu pour le guide ${slug} (python scripts/og-images.py)`);
    writePage(`/guides/${slug}`, { title: `Guide ${g.name}`, description: g.description, body: guideBody(g), image });
    count++;
  } catch (err) {
    console.warn(`prerender : guide ${slug} ignoré (${err.message})`);
  }
}

// ─── Pages générées chaque semaine (scripts/seo-pages.mjs) ─────────────────────
// Adresses avec barre finale : servies directement par Render, sans règle dans render.yaml.

const dateFr = (date) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const hhmm = (iso) => iso.slice(11, 16);

for (const l of SEO.liaisons) {
  let day = null;
  try {
    day = readPublic(`liaisons/${l.slug}.json`);
  } catch {
    // relevé absent : la page garde le résumé
  }
  const { summary: s } = l;
  const rows = (day?.journeys ?? [])
    .map((j) => {
      const how = j.transfers === 0 ? 'direct' : `${j.transfers} correspondance${j.transfers > 1 ? 's' : ''}`;
      const trains = [...new Set(j.trains.map((t) => t.type))].join(', ');
      return `<li>${hhmm(j.departure)} → ${hhmm(j.arrival)} · ${esc(formatDuration(j.duration_min))} · ${esc(how)} · ${esc(trains)}</li>`;
    })
    .join('');
  const others = SEO.liaisons.filter((o) => o.slug !== l.slug && (o.from.id === l.from.id || o.to.id === l.to.id));
  const body = [
    h1(`${l.from.name} → ${l.to.name} en train`),
    p(`${formatDuration(s.fastest_min)} au plus rapide, ${liaisonHow(s)}. Premier départ à ${s.first}, dernier à ${s.last}.`),
    p(`Trains : ${s.train_types.join(', ')}.`),
    rows ? h2(`Les trains du ${dateFr(day.date)}`) + `<ul class="text-slate-600 mb-4">${rows}</ul>` : '',
    l.guide ? `<p class="text-lg text-slate-600 mb-4"><a class="underline" href="/guides/${esc(l.guide)}">Guide de ${esc(l.to.name)}</a></p>` : '',
    others.length
      ? h2('Autres liaisons') +
        `<ul class="text-slate-600 mb-4">${others.map((o) => `<li><a class="underline" href="/train/${esc(o.slug)}/">${esc(o.from.name)} → ${esc(o.to.name)}</a></li>`).join('')}</ul>`
      : '',
  ].join('\n');
  writePage(`/train/${l.slug}/`, {
    title: `Train ${l.from.name} → ${l.to.name}`,
    description: liaisonDescription(l.from.name, l.to.name, s),
    body,
    image: '/og/trajets.jpg',
  });
  count++;
}

for (const c of SEO.tgvmax) {
  let data = null;
  try {
    data = readPublic(`tgvmax-depuis/${c.slug}.json`);
  } catch {
    // relevé absent
  }
  const rows = (data?.destinations ?? [])
    .slice(0, 60)
    .map((d) => `<li>${esc(d.name)} — direct en ${esc(formatDuration(d.min_duration))}, places ${d.dates.length} jour${d.dates.length > 1 ? 's' : ''} sur ${data.days}</li>`)
    .join('');
  const body = [
    h1(`Où partir avec TGVmax depuis ${c.name} ?`),
    p(`Les destinations en train direct avec des places MAX JEUNE et MAX SENIOR à 0 € au départ de ${c.name}, jour par jour, d'après les données ouvertes de SNCF Voyageurs mises à jour chaque matin.`),
    rows ? h2(`Relevé du ${dateFr(data.start)}`) + `<ul class="text-slate-600 mb-4">${rows}</ul>` : '',
    p('Site indépendant, sans lien avec SNCF Voyageurs. TGVmax, MAX JEUNE et MAX SENIOR sont des marques de SNCF Voyageurs.'),
  ].join('\n');
  writePage(`/tgvmax/depuis/${c.slug}/`, {
    title: `TGVmax depuis ${c.name}`,
    description: `Où partir avec TGVmax depuis ${c.name} ? Les destinations directes avec des places MAX JEUNE et MAX SENIOR dans les 30 prochains jours, mises à jour chaque matin.`,
    body,
    image: '/og/tgvmax.jpg',
  });
  count++;
}

// Sans règle de réécriture dans render.yaml, Render sert l'accueil à la place de la page générée.
const renderYaml = readFileSync(new URL('../render.yaml', import.meta.url), 'utf8');
const paths = [...Object.keys(PAGES).filter((path) => path !== '/' && PAGES[path].prerender !== false), ...guides.map((g) => `/guides/${g.slug}`)];
const missing = paths.filter((path) => !renderYaml.includes(`destination: ${path}/index.html`));
if (missing.length) console.warn(`prerender : règle de réécriture absente de render.yaml pour ${missing.join(', ')}`);

console.log(`prerender : ${count} pages HTML écrites dans dist/`);
