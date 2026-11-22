// main.ts — entrypoint for RUNEFUSION: copies game/ + screenshots/ to the
// output dir and writes dossier.json with the kit's buildDossier helper.
// Deterministic: same inputs always produce byte-identical dossier.json
// (verified by running it twice and diffing the outputs).
import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(out, { recursive: true });

const here = new URL('.', import.meta.url).pathname;
for (const dir of ['game', 'screenshots']) {
  const src = join(here, dir);
  if (existsSync(src)) cpSync(src, join(out, dir), { recursive: true });
}

writeFileSync(join(out, 'dossier.json'), buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));
console.log('RUNEFUSION dossier written to ' + out);
