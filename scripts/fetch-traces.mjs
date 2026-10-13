// Télécharge avant chaque build les tracés des trains sur les voies (carte d'un trajet) dans public/traces/.
// Ils sont calculés dans le dépôt TrainNomad_GTFS (traces/build_traces.py) et publiés dans sa Release
// traces-latest : ils ne sont pas dans ce dépôt (public/traces/ est ignoré par git).
// Sur un poste, des tracés déjà présents (python traces/publier.py) sont gardés tels quels.
// Release injoignable : le build continue, la carte relie alors les arrêts par des traits droits.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';

const URL =
  process.env.TRACES_URL ||
  'https://github.com/TrainNomad/TrainNomad_GTFS/releases/download/traces-latest/traces.tar.gz';
const DEST = 'public/traces';

const count = () => (existsSync(DEST) ? readdirSync(DEST).filter((f) => f.endsWith('.json')).length : 0);

// RENDER est défini par Render pendant le build
if (!process.env.RENDER && count() > 0) {
  console.log(`fetch-traces : ${count()} tracés locaux gardés (${DEST})`);
} else {
  try {
    const res = await fetch(URL, { signal: AbortSignal.timeout(120_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // chemin relatif : le tar de Git Bash prend « C: » pour un nom de machine
    const archive = 'traces.tar.gz';
    writeFileSync(archive, Buffer.from(await res.arrayBuffer()));
    rmSync(DEST, { recursive: true, force: true });
    mkdirSync(DEST, { recursive: true });
    // tar est présent sur Render (Linux) comme sur Windows 10+ et macOS
    execFileSync('tar', ['-xzf', archive, '-C', DEST]);
    rmSync(archive, { force: true });
    console.log(`fetch-traces : ${count()} tracés téléchargés dans ${DEST}`);
  } catch (e) {
    console.warn(`fetch-traces : tracés indisponibles (${e.message}), la carte utilisera des traits droits`);
  }
}
