import fs from 'node:fs';
import path from 'node:path';

const HAN_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/gu;

/** @param {string} dir */
function readJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => path.join(dir, name));
}

/** @param {unknown} value @param {Set<string>} chars */
function collectFromValue(value, chars) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(HAN_RE)) {
      chars.add(match[0]);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectFromValue(item, chars);
    }
    return;
  }

  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) {
      collectFromValue(nested, chars);
    }
  }
}

/** @param {string} root */
export function collectHanziCharacters(root) {
  const chars = new Set();
  const dataDir = path.join(root, 'public', 'data');

  for (const filePath of readJsonFiles(dataDir)) {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    collectFromValue(parsed, chars);
  }

  return [...chars].sort((left, right) => left.codePointAt(0) - right.codePointAt(0));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  const chars = collectHanziCharacters(root);
  process.stdout.write(`${chars.join('')}\n`);
}
