import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { collectHanziCharacters } from './collect-hanzi-chars.mjs';
import { KANGXI_RADICALS } from './kangxi-radicals.mjs';

/** Символы для golden tests и smoke — всегда синхронизируются, даже если нет в cards JSON. */
const GOLDEN_HANZI_CHARACTERS = ['人', '大', '好', '你', '水'];

const require = createRequire(import.meta.url);
const root = process.cwd();
const outDir = path.join(root, 'public', 'assets', 'hanzi');
const radicalOutDir = path.join(outDir, 'radical');
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
fs.mkdirSync(radicalOutDir, { recursive: true });
fs.mkdirSync(licenseDir, { recursive: true });

function copyHanziJson(character, targetDir) {
  const sourcePath = path.join(sourceDir, `${character}.json`);
  const targetPath = path.join(targetDir, `${character}.json`);

  if (!fs.existsSync(sourcePath)) {
    return false;
  }

  fs.copyFileSync(sourcePath, targetPath);
  return true;
}

let copied = 0;
const missing = [];

for (const character of chars) {
  if (copyHanziJson(character, outDir)) {
    copied += 1;
    continue;
  }

  missing.push(character);
}

let radicalCopied = 0;
const radicalMissing = [];

for (const character of KANGXI_RADICALS) {
  if (copyHanziJson(character, radicalOutDir)) {
    radicalCopied += 1;
    continue;
  }

  radicalMissing.push(character);
}

fs.writeFileSync(
  path.join(radicalOutDir, 'manifest.json'),
  `${JSON.stringify(
    {
      version: 1,
      count: KANGXI_RADICALS.length,
      radicals: KANGXI_RADICALS.map((character, index) => ({
        index: index + 1,
        character,
      })),
    },
    null,
    2,
  )}\n`,
);

if (fs.existsSync(licenseSource)) {
  fs.copyFileSync(licenseSource, path.join(licenseDir, 'ARPHICPL.TXT'));
}

console.log(`sync-hanzi-assets: copied ${copied}/${chars.length} → public/assets/hanzi/`);
console.log(
  `sync-hanzi-assets: copied ${radicalCopied}/${KANGXI_RADICALS.length} → public/assets/hanzi/radical/`,
);

if (missing.length > 0) {
  console.warn(`sync-hanzi-assets: missing MMH data for: ${missing.join(' ')}`);
  process.exitCode = 1;
}

if (radicalMissing.length > 0) {
  console.warn(`sync-hanzi-assets: missing radical MMH data for: ${radicalMissing.join(' ')}`);
  process.exitCode = 1;
}
