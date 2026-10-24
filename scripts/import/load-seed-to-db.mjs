#!/usr/bin/env node

/**
 * Загрузка seed-данных из public/data/ в PostgreSQL через API бэкенда.
 *
 * Преобразует frontend-формат JSON → backend DTO-формат.
 *
 * Порядок загрузки:
 * 1. Курсы
 * 2. Сценарии
 * 3. Карточки
 *
 * Использование:
 *   node scripts/load-seed-to-db.mjs [--dry-run]
 *
 * Переменные окружения:
 *   API_URL      — URL бэкенда (по умолчанию: http://localhost:8080/api/v1)
 *   AUTH_TOKEN   — JWT токен авторизации
 *   AUTHOR_UUID  — UUID автора для всех записей (по умолчанию: system UUID)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── Конфиг ────────────────────────────────────────────────────────────────

const API_BASE = process.env.API_URL || 'http://localhost:8080/api/v1';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';
const AUTHOR_UUID = process.env.AUTHOR_UUID || '00000000-0000-0000-0000-000000000001';

const DRY_RUN = process.argv.includes('--dry-run');

// ─── Утилиты ────────────────────────────────────────────────────────────────

async function apiRequest(method, endpoint, body) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };

  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  const opts = { method, headers };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);

  if (!res.ok) {
    const errorText = await res.text().catch(() => '(no body)');
    throw new Error(`[${method} ${endpoint}] ${res.status} ${res.statusText}\n${errorText}`);
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return null;
  }

  return res.json();
}

async function loadBatch(entityType, items, idField = 'id') {
  let loaded = 0;
  let failed = 0;

  for (const item of items) {
    const id = item[idField];

    if (DRY_RUN) {
      console.log(`  [DRY-RUN] ${entityType}: ${id}`);
      loaded++;
      continue;
    }

    try {
      await apiRequest('POST', `/${entityType}`, item);
      console.log(`  ✓ ${entityType}: ${id}`);
      loaded++;
    } catch (err) {
      console.error(`  ✗ ${entityType}: ${id} — ${err.message}`);
      failed++;
    }
  }

  return { loaded, failed };
}

// ─── Трансформация данных ──────────────────────────────────────────────────

/**
 * Преобразует frontend-карточку в backend CreateCardRequest.
 *
 * Frontend: { id, kind, title, appearance, direction, promptKnown, optionsLearning, ... }
 * Backend:  { title, kind, content (JSON), tags (JSON), difficulty }
 */
function transformCardToFrontend(card) {
  // Извлекаем difficulty из meta
  let difficulty = null;
  if (card.meta?.difficulty) {
    const diffMap = {
      beginner: 'BEGINNER',
      intermediate: 'INTERMEDIATE',
      advanced: 'ADVANCED',
    };
    difficulty = diffMap[card.meta.difficulty];
  }

  // Упаковываем все карточные данные в content JSON
  const contentObj = {};

  // Копируем все поля карточки, исключая системные
  const systemFields = new Set([
    'id', 'kind', 'title', 'meta', 'courseId', 'lessonId', 'scenarioId',
  ]);

  for (const [key, value] of Object.entries(card)) {
    if (!systemFields.has(key)) {
      contentObj[key] = value;
    }
  }

  // Извлекаем tags из meta
  const tags = card.meta?.tags || [];

  return {
    title: card.title,
    kind: card.kind.toUpperCase(), // 'select' → 'SELECT'
    content: JSON.stringify(contentObj),
    tags: JSON.stringify(tags),
    difficulty,
  };
}

/**
 * Преобразует frontend-сценарий в backend CreateScenarioRequest.
 *
 * Frontend: { id, title, description, cardSource: {mode, cardIds}, languagePair: {known, learning}, authorId: "system" }
 * Backend:  { title, description, cardSource (JSON), languagePair (JSON) }
 */
function transformScenarioToFrontend(scenario) {
  return {
    title: scenario.title,
    description: scenario.description || '',
    cardSource: JSON.stringify(scenario.cardSource || { mode: 'fixed', cardIds: [] }),
    languagePair: scenario.languagePair
      ? JSON.stringify(scenario.languagePair)
      : null,
  };
}

/**
 * Преобразует frontend-курс в backend CreateCourseRequest.
 *
 * Frontend: { id, title, description, authorId: "system", languagePair, lessonIds, published }
 * Backend:  { title, description, authorId (UUID), languagePair (JSON) }
 */
function transformCourseToFrontend(course) {
  return {
    title: course.title,
    description: course.description || '',
    authorId: AUTHOR_UUID,
    languagePair: course.languagePair
      ? JSON.stringify(course.languagePair)
      : null,
  };
}

// ─── Загрузчики ─────────────────────────────────────────────────────────────

async function loadCards() {
  console.log('\n📦 Загрузка карточек...');

  const manifest = JSON.parse(
    await fs.readFile(path.join(ROOT, 'public/data/content-manifest.json'), 'utf-8'),
  );

  let totalLoaded = 0;
  let totalFailed = 0;

  for (const file of manifest.cardFiles) {
    const filePath = path.join(ROOT, 'public/data', file);
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    if (!Array.isArray(data.cards)) {
      console.warn(`  ⚠ Пропущен файл ${file}: нет поля cards`);
      continue;
    }

    const transformed = data.cards.map(transformCardToFrontend);
    const result = await loadBatch('cards', transformed);
    totalLoaded += result.loaded;
    totalFailed += result.failed;
  }

  console.log(`  Итого: загружено ${totalLoaded}, ошибок ${totalFailed}`);
  return { totalLoaded, totalFailed };
}

async function loadScenarios() {
  console.log('\n📜 Загрузка сценариев...');

  const manifest = JSON.parse(
    await fs.readFile(path.join(ROOT, 'public/data/content-manifest.json'), 'utf-8'),
  );

  let totalLoaded = 0;
  let totalFailed = 0;

  for (const file of manifest.scenarioFiles) {
    const filePath = path.join(ROOT, 'public/data', file);
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    if (!Array.isArray(data.scenarios)) {
      console.warn(`  ⚠ Пропущен файл ${file}: нет поля scenarios`);
      continue;
    }

    const transformed = data.scenarios.map(transformScenarioToFrontend);
    const result = await loadBatch('scenarios', transformed);
    totalLoaded += result.loaded;
    totalFailed += result.failed;
  }

  console.log(`  Итого: загружено ${totalLoaded}, ошибок ${totalFailed}`);
  return { totalLoaded, totalFailed };
}

async function loadCourses() {
  console.log('\n🎓 Загрузка курсов...');

  const manifest = JSON.parse(
    await fs.readFile(path.join(ROOT, 'public/data/content-manifest.json'), 'utf-8'),
  );

  let totalLoaded = 0;
  let totalFailed = 0;

  for (const file of manifest.courseFiles) {
    const filePath = path.join(ROOT, 'public/data', file);
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));

    if (!Array.isArray(data.courses)) {
      console.warn(`  ⚠ Пропущен файл ${file}: нет поля courses`);
      continue;
    }

    const transformed = data.courses.map(transformCourseToFrontend);
    const result = await loadBatch('courses', transformed);
    totalLoaded += result.loaded;
    totalFailed += result.failed;
  }

  console.log(`  Итого: загружено ${totalLoaded}, ошибок ${totalFailed}`);
  return { totalLoaded, totalFailed };
}

// ─── Основная функция ──────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  LinguaCode Seed Loader');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  API: ${API_BASE}`);
  console.log(`  Auth: ${AUTH_TOKEN ? '✓ установлен' : '✗ не установлен (mock-режим)'}`);
  console.log(`  Author UUID: ${AUTHOR_UUID}`);
  console.log(`  Dry-run: ${DRY_RUN ? 'да' : 'нет'}`);
  console.log('═══════════════════════════════════════════════════════════');

  if (!DRY_RUN && !AUTH_TOKEN) {
    console.log('\n⚠  ВНИМАНИЕ: Auth Token не установлен!');
    console.log('   Бэкенд может требовать авторизацию.\n');
  }

  const startTime = Date.now();
  let grandTotalLoaded = 0;
  let grandTotalFailed = 0;

  try {
    const courseResult = await loadCourses();
    grandTotalLoaded += courseResult.totalLoaded;
    grandTotalFailed += courseResult.totalFailed;

    const scenarioResult = await loadScenarios();
    grandTotalLoaded += scenarioResult.totalLoaded;
    grandTotalFailed += scenarioResult.totalFailed;

    const cardResult = await loadCards();
    grandTotalLoaded += cardResult.totalLoaded;
    grandTotalFailed += cardResult.totalFailed;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`  ✅ Загрузка завершена за ${elapsed}с`);
    console.log(`  Загружено: ${grandTotalLoaded}`);
    console.log(`  Ошибок: ${grandTotalFailed}`);
    console.log('═══════════════════════════════════════════════════════════');

    if (grandTotalFailed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ Критическая ошибка:', err.message);
    process.exit(1);
  }
}

main();
