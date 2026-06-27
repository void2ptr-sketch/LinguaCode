import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { collectHanziCharacters } from './collect-hanzi-chars.mjs';

/** Символы для golden tests и smoke — всегда синхронизируются, даже если нет в cards JSON. */
const GOLDEN_HANZI_CHARACTERS = ['人', '大', '好', '你', '水'];

const require = createRequire(import.meta.url);
const root = process.cwd();
const outDir = path.join(root, 'public', 'assets', 'hanzi');
const licenseDir = path.join(root, 'public', 'licenses');
const sourceDir = path.dirname(require.resolve('hanzi-writer-data/人.json'));
const licenseSource = path.join(sourceDir, 'ARPHICPL.TXT');

const chars = [
  ...new Set([...collectHanziCharacters(root), ...GOLDEN_HANZI_CHARACTERS]),
].sort((left, right) => left.codePointAt(0) - right.codePointAt(0));

if (chars.length === 0) {
  console.warn('sync-hanzi-assets: no Han characters found in public/data');
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(licenseDir, { recursive: true });

let copied = 0;
const missing = [];

for (const character of chars) {
  const sourcePath = path.join(sourceDir, `${character}.json`);
  const targetPath = path.join(outDir, `${character}.json`);

  if (!fs.existsSync(sourcePath)) {
    missing.push(character);
    continue;
  }

  fs.copyFileSync(sourcePath, targetPath);
  copied += 1;
}

if (fs.existsSync(licenseSource)) {
  fs.copyFileSync(licenseSource, path.join(licenseDir, 'ARPHICPL.TXT'));
}

console.log(`sync-hanzi-assets: copied ${copied}/${chars.length} → public/assets/hanzi/`);

if (missing.length > 0) {
  console.warn(`sync-hanzi-assets: missing MMH data for: ${missing.join(' ')}`);
  process.exitCode = 1;
}
