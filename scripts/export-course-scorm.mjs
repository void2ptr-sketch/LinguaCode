/**
 * export-course-scorm.mjs
 *
 * Экспортирует курс из базы данных в SCORM/xAPI формат.
 * Загружает ScormExportBundle из backend API и сохраняет в JSON.
 *
 * Backend генерирует:
 *   - SCORM manifest (Course → Program → Lesson → Card hierarchy)
 *   - xAPI statements для аналитики
 *
 * Использование:
 *   node scripts/export-course-scorm.mjs <course-id> [options]
 *
 * Опции:
 *   --api <url>    Базовый URL API (по умолчанию: http://localhost:8080/api/v1)
 *   --output <dir>  Директория для вывода (по умолчанию: public/data/export)
 *
 * Пример:
 *   node scripts/export-course-scorm.mjs 444
 *   node scripts/export-course-scorm.mjs 444 --api http://myserver:8080/api/v1
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = join(ROOT, 'public/data');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    courseId: null,
    api: 'http://localhost:8080/api/v1',
    output: join(ROOT, 'public/data/export'),
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--api' && args[i + 1]) {
      opts.api = args[++i];
    } else if (args[i] === '--output' && args[i + 1]) {
      opts.output = args[++i];
    } else if (!args[i].startsWith('--')) {
      opts.courseId = args[i];
    }
  }

  return opts;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `HTTP ${response.status} ${response.statusText} for ${url}${body ? `: ${body}` : ''}`,
    );
  }
  return response.json();
}

function writeJson(filePath, payload) {
  const full = resolve(filePath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`  ✓ ${filePath}`);
}

function updateScormManifest(scormFiles) {
  const manifestPath = join(DATA_DIR, 'export', 'content-manifest-scorm.json');
  let manifest;

  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch {
    manifest = { version: 1, scormFiles: [] };
  }

  const addUnique = (arr, item) => (arr.includes(item) ? arr : [...arr, item]);

  manifest.scormFiles = addUnique(manifest.scormFiles, scormFiles);

  writeJson('export/content-manifest-scorm.json', manifest);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs();

  if (!opts.courseId) {
    console.error('Использование:');
    console.error('  node scripts/export-course-scorm.mjs <course-id> [options]');
    console.error('');
    console.error('Опции:');
    console.error('  --api <url>       Базовый URL API (по умолчанию: http://localhost:8080/api/v1)');
    console.error('  --output <dir>    Директория для вывода (по умолчанию: public/data/export)');
    console.error('');
    console.error('Пример:');
    console.error('  node scripts/export-course-scorm.mjs 444');
    console.error('  node scripts/export-course-scorm.mjs 444 --api http://myserver:8080/api/v1');
    process.exit(1);
  }

  console.log(`Экспорт курса в SCORM/xAPI:`);
  console.log(`  course id: ${opts.courseId}`);
  console.log(`  API URL:   ${opts.api}`);
  console.log(`  Output:    ${opts.output}`);

  // -----------------------------------------------------------------------
  // 1. Load ScormExportBundle from backend API
  // -----------------------------------------------------------------------
  console.log('\n[1/3] Загрузка ScormExportBundle из API...');

  try {
    const scormUrl = `${opts.api}/courses/${opts.courseId}/scorm-export`;
    console.log(`  GET ${scormUrl} ...`);
    const response = await fetchJson(scormUrl);

    // Unwrap ApiResponse<T> -> { data: ScormExportBundle }
    const bundle = response.data || response;

    if (!bundle) {
      throw new Error('Backend не вернул данные (response.data пустой)');
    }

    // -----------------------------------------------------------------------
    // 2. Summary
    // -----------------------------------------------------------------------
    console.log('\n[2/3] Статистика экспорта:');

    const course = bundle.courses?.[0] || {};
    const programs = bundle.programs || [];
    const lessons = bundle.lessons || [];
    const scenarios = bundle.scenarios || [];
    const cards = bundle.cards || [];
    const xapiStatements = bundle.xapiStatements || [];
    const manifest = bundle.manifest || {};

    const totalOrgs = manifest.organizations?.length || 0;
    const totalLessonsInManifest = (manifest.organizations || []).reduce(
      (sum, org) => sum + (org.items?.length || 0),
      0,
    );
    const totalResources = (manifest.organizations || []).reduce(
      (sum, org) =>
        sum + (org.items || []).reduce((s, item) => s + (item.resources?.length || 0), 0),
      0,
    );

    console.log(`  Курс:       ${course.title} (${course.id})`);
    console.log(`  Programs:   ${programs.length}`);
    console.log(`  Lessons:    ${lessons.length}`);
    console.log(`  Scenarios:  ${scenarios.length}`);
    console.log(`  Cards:      ${cards.length}`);
    console.log(`  xAPI stmts: ${xapiStatements.length}`);
    console.log(`  Manifest orgs: ${totalOrgs}`);
    console.log(`  Manifest lessons: ${totalLessonsInManifest}`);
    console.log(`  Manifest resources: ${totalResources}`);

    // -----------------------------------------------------------------------
    // 3. Save to file
    // -----------------------------------------------------------------------
    console.log('\n[3/3] Сохранение в файл...');

    const scormBundle = {
      format: 'linguacode-scorm-export',
      version: 1,
      exportedAt: bundle.exportedAt || new Date().toISOString(),
      manifest,
      courses: bundle.courses || [],
      programs,
      lessons,
      scenarios,
      cards,
      xapiStatements,
    };

    const outputFile = join(opts.output, `${opts.courseId}-scorm.json`);
    writeJson(outputFile, scormBundle);

    // Update manifest
    const relativePath = `export/${opts.courseId}-scorm.json`;
    updateScormManifest(relativePath);

    console.log(`\n✅ Экспорт завершён:`);
    console.log(`  Файл: ${outputFile}`);
    console.log(`  Manifest: ${relativePath}`);
    console.log(`  Размер: ${(JSON.stringify(scormBundle).length / 1024).toFixed(1)} KB`);
  } catch (err) {
    console.error(`  ✗ Ошибка: ${err.message}`);
    console.error('\n  Проверьте:');
    console.error('    1. Backend запущен на указанном URL');
    console.error('    2. Курс с таким ID существует');
    console.error('    3. Эндпоинт /courses/:id/scorm-export доступен');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
