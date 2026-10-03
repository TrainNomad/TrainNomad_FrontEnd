// Vérifie avant le build que chaque icône Material Symbols écrite dans le code fait partie de la police
// réduite (src/assets/fonts/material-symbols-icons.txt). Sinon : python scripts/subset-icons.py
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const known = new Set(readFileSync(join(root, 'src/assets/fonts/material-symbols-icons.txt'), 'utf8').split(/\r?\n/).filter(Boolean));

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(name)) files.push(p);
  }
})(join(root, 'src'));

const missing = new Set();
for (const file of files) {
  const code = readFileSync(file, 'utf8');
  // <span className="material-symbols-outlined ...">nom</span>
  for (const m of code.matchAll(/material-symbols-outlined[^>]*>\s*([a-z0-9_]+)\s*</g)) {
    if (!known.has(m[1])) missing.add(`${m[1]} (${file.slice(root.length)})`);
  }
  // { ? 'nom_a' : 'nom_b' } et icon: 'nom' / icon="nom" (hors Font Awesome)
  for (const m of code.matchAll(/\bicon\s*[:=]\s*['"]([a-z0-9_]+)['"]/g)) {
    if (!known.has(m[1])) missing.add(`${m[1]} (${file.slice(root.length)})`);
  }
}

if (missing.size) {
  console.error(`Icônes absentes de la police réduite :\n  ${[...missing].join('\n  ')}\n→ lancer : python scripts/subset-icons.py`);
  process.exit(1);
}
console.log(`icônes : ${known.size} dans la police, toutes celles du code sont présentes`);
