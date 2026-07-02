/**
 * Скрипт для выгрузки вопросов курса в PDF файл.
 * Один лист PDF = одна карточка.
 *
 * Использование:
 *   node scripts/export-course-pdf.mjs <course-id>          # без подсказок
 *   node scripts/export-course-pdf.mjs --hints <course-id>  # с подсказками (✓)
 *
 * Пример:
 *   node scripts/export-course-pdf.mjs course-ru-perl-interview
 *   node scripts/export-course-pdf.mjs --hints course-ru-perl-interview
 *
 * Результат: public/data/export/<course-id>[.hints].pdf
 */

import { readFileSync, existsSync, mkdirSync, createWriteStream, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(ROOT, 'public/data');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadJson(manifestPath) {
  const cleanPath = manifestPath.startsWith('/') ? manifestPath.slice(1) : manifestPath;
  const full = resolve(DATA_DIR, cleanPath);
  if (!existsSync(full)) {
    console.error(`[ERROR] File not found: ${full}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(full, 'utf-8'));
}

/**
 * Парсит Markdown-идею курса, извлекая структуру «этап → вопросы».
 * Возвращает массив этапов: [{ title, questions: [q1, q2, ...] }]
 * where title is the lesson title (e.g. "Контексты и sigils") without the "Этап N:" prefix.
 */
function parseIdeaStages(markdown) {
  const stages = [];
  const lines = markdown.split('\n');
  let currentStage = null;

  for (const line of lines) {
    // Match "## Этап N: название" — capture the name after "N: "
    const stageMatch = line.match(/^##\s+Этап\s+\d+\s*:\s*(.+)/i);
    if (stageMatch) {
      currentStage = { title: stageMatch[1].trim(), questions: [] };
      stages.push(currentStage);
      continue;
    }

    const questionMatch = line.match(/^-\s+(.+)/);
    if (currentStage && questionMatch) {
      const q = questionMatch[1].trim();
      // Only add if it looks like a question (ends with ?)
      if (q.endsWith('?')) {
        currentStage.questions.push(q);
      }
    }
  }

  return stages;
}

// ---------------------------------------------------------------------------
// Font registration
// ---------------------------------------------------------------------------

function registerCyrillicFont(doc) {
  const fontPaths = [
    '/usr/share/fonts/dejavu-sans-fonts/DejaVuSansCondensed.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
    '/usr/share/fonts/truetype/msttcorefonts/Arial.ttf',
    '/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf',
  ];

  for (const fp of fontPaths) {
    if (existsSync(fp)) {
      doc.registerFont('Cyrillic', fp);
      doc.font('Cyrillic');
      console.log(`[INFO] Using font: ${fp}`);
      return true;
    }
  }

  try {
    const result = execSync(
      'find /usr/share/fonts -name "*.ttf" 2>/dev/null | head -20',
      { encoding: 'utf-8' },
    );
    const fonts = result.trim().split('\n').filter(Boolean);
    for (const fp of fonts) {
      if (existsSync(fp)) {
        doc.registerFont('Cyrillic', fp);
        doc.font('Cyrillic');
        console.log(`[INFO] Using font: ${fp}`);
        return true;
      }
    }
  } catch {
    // ignore
  }

  console.warn('[WARN] No Cyrillic-capable font found. Install fonts-dejavu.');
  return false;
}

// ---------------------------------------------------------------------------
// Card rendering
// ---------------------------------------------------------------------------

const MARGIN = 40;
const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89; // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

/**
 * Рендерит титульную страницу с оглавлением курса.
 * Этапы из идеи сопоставляются с уроками по порядку (индексу).
 * Вопросы из идеи сопоставляются со сценариями урока по порядку.
 * Каждый пункт оглавления — кликабельная ссылка на соответствующую страницу.
 *
 * @param {object} doc - PDFDocument
 * @param {string} courseTitle - название курса
 * @param {Array} stages - [{ title, questions: [q1, q2, ...] }] — из идеи
 * @param {Array} cardEntries - [{ card, scenarioTitle, lessonTitle }] — в порядке курса
 * @param {Array} lessons - уроки курса в порядке сортировки
 */
function renderTitlePage(doc, courseTitle, stages, cardEntries, lessons) {
  let y = MARGIN;

  // Именованная метка для возврата из карточек в оглавление
  doc.addNamedDestination('toc', 'XYZ', MARGIN, null, null);

  // Заголовок
  doc.fontSize(18).fillColor('#1a1a1a');
  doc.text(courseTitle, MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
  y += 24;

  doc.fontSize(10).fillColor('#666');
  doc.text('Оглавление', MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
  y += 20;

  // Строим карту: сценарий → страница первой карточки этого сценария
  // Нумерация страниц: title page = i (римская), карточки начинаются с 1
  const scenarioFirstPage = new Map();
  for (let i = 0; i < cardEntries.length; i++) {
    const st = cardEntries[i].scenarioTitle;
    if (!scenarioFirstPage.has(st)) {
      scenarioFirstPage.set(st, i + 1);
    }
  }

  // Сопоставляем этапы идеи с уроками по порядку
  // Каждый этап идеи соответствует одному уроку (по индексу)
  for (let stageIdx = 0; stageIdx < stages.length; stageIdx++) {
    const stage = stages[stageIdx];
    const lesson = lessons[stageIdx];
    if (!lesson) continue;

    // Заголовок этапа
    doc.fontSize(12).fillColor('#333');
    doc.text(`Этап ${stageIdx + 1}: ${stage.title}`, MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
    y += doc.heightOfString(`Этап ${stageIdx + 1}: ${stage.title}`, { width: CONTENT_WIDTH }) + 6;

    // Собираем все сценарии этого урока
    const lessonScenarioTitles = cardEntries
      .filter((e) => e.lessonTitle === lesson.title)
      .reduce((acc, e) => {
        if (!acc.includes(e.scenarioTitle)) acc.push(e.scenarioTitle);
        return acc;
      }, []);

    // Сопоставляем вопросы из идеи со сценариями урока по порядку
    for (let qIdx = 0; qIdx < stage.questions.length; qIdx++) {
      const question = stage.questions[qIdx];
      const scenarioTitle = lessonScenarioTitles[qIdx];
      const pageRef = scenarioTitle ? scenarioFirstPage.get(scenarioTitle) : null;
      const pageStr = pageRef ? `→ с. ${pageRef}` : '';

      doc.fontSize(9).fillColor('#555');
      const text = `  • ${question}  ${pageStr}`;
      const h = doc.heightOfString(text, { width: CONTENT_WIDTH - 20 });

      if (y + h > PAGE_HEIGHT - MARGIN - 20) {
        doc.addPage();
        y = MARGIN;
      }

      // Рисуем текст
      doc.text(text, MARGIN + 10, y, { width: CONTENT_WIDTH - 20, align: 'left' });

      // Добавляем кликабельную ссылку на страницу карточки
      // Используем annotate напрямую с именованным назначением
      if (pageRef) {
        const linkHeight = Math.max(h, 14);
        doc.annotate(MARGIN + 10, y, CONTENT_WIDTH - 20, linkHeight, {
          Subtype: 'Link',
          Dest: `card-${pageRef}`,
        });
      }

      y += h + 4;
    }

    y += 8;
  }

  // Нижний колонтитул
  doc.fontSize(7).fillColor('#999');
  doc.text('— i —', MARGIN, PAGE_HEIGHT - MARGIN - 5, {
    width: CONTENT_WIDTH,
    align: 'center',
  });
}

/**
 * Нарисовать одну карточку на странице PDF.
 * @param {boolean} showHints — если true, показывать правильный ответ (✓)
 */
function renderCard(doc, card, scenarioTitle, lessonTitle, courseTitle, pageNum, showHints) {
  let y = MARGIN;

  // --- Header: курс (мелко, только для навигации) ---
  doc.fontSize(7).fillColor('#999');
  doc.text(courseTitle, MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
  y += 10;

  // --- ID карточки (мелко) ---
  doc.fontSize(6).fillColor('#bbb');
  doc.text(card.id, MARGIN, y);
  y += 8;

  // --- Разделитель ---
  doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).strokeColor('#ddd').stroke();
  y += 12;

  // --- Этап (урок) ---
  doc.fontSize(10).fillColor('#666');
  doc.text(lessonTitle, MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
  y += 14;

  // --- Заголовок карточки (тема сценария) ---
  doc.fontSize(14).fillColor('#1a1a1a');
  doc.text(card.title, MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
  y += doc.heightOfString(card.title, { width: CONTENT_WIDTH }) + 14;

  // --- Разделитель перед вопросом ---
  doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).strokeColor('#eee').stroke();
  y += 10;

  // --- Метка "Вопрос" ---
  doc.fontSize(9).fillColor('#888');
  doc.text('Вопрос:', MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
  y += 12;

  // --- Контент в зависимости от типа ---
  switch (card.kind) {
    case 'select': {
      // Вопрос — крупно (1.5x от предыдущего 10 → 15)
      doc.fontSize(15).fillColor('#222');
      doc.text(card.promptKnown, MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
      y += doc.heightOfString(card.promptKnown, { width: CONTENT_WIDTH }) + 14;

      // --- Метка "Ответы" ---
      doc.fontSize(9).fillColor('#888');
      doc.text('Ответы:', MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
      y += 12;

      // Варианты ответов — крупно (1.5x от предыдущего 9 → 13.5 → 14)
      doc.fontSize(14).fillColor('#444');
      card.optionsLearning.forEach((opt, idx) => {
        const isCorrect = idx === card.correctIndex;
        const prefix = showHints && isCorrect ? '✓ ' : '  ';
        const text = `${prefix}${opt}`;
        const h = doc.heightOfString(text, { width: CONTENT_WIDTH - 20 });
        doc.text(text, MARGIN + 10, y, { width: CONTENT_WIDTH - 20, align: 'left' });
        y += h + 6;
      });

      // Правильный ответ (только в режиме подсказок)
      if (showHints) {
        y += 6;
        doc.fontSize(10).fillColor('#2a7a2a');
        doc.text(`✓ Правильный ответ: ${card.optionsLearning[card.correctIndex]}`, MARGIN, y, {
          width: CONTENT_WIDTH,
          align: 'left',
        });
      }
      break;
    }

    case 'code-select': {
      // caption
      if (card.caption) {
        doc.fontSize(15).fillColor('#222');
        doc.text(card.caption, MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
        y += doc.heightOfString(card.caption, { width: CONTENT_WIDTH }) + 10;
      }

      // prompt code — блок с фоном
      doc.fontSize(10).fillColor('#1a1a1a');
      const codeText = card.prompt.code;
      const codeHeight = doc.heightOfString(codeText, { width: CONTENT_WIDTH - 20 });
      const codeBlockHeight = codeHeight + 14;

      doc.rect(MARGIN, y, CONTENT_WIDTH, codeBlockHeight).fill('#f5f5f5');
      doc.fillColor('#1a1a1a').fontSize(10);
      doc.text(codeText, MARGIN + 8, y + 6, { width: CONTENT_WIDTH - 16, align: 'left' });
      y += codeBlockHeight + 12;

      // --- Метка "Ответы" ---
      doc.fontSize(9).fillColor('#888');
      doc.text('Ответы:', MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
      y += 12;

      // Варианты ответов — язык без скобок
      doc.fontSize(14).fillColor('#444');
      card.options.forEach((opt, idx) => {
        const isCorrect = idx === card.correctIndex;
        const prefix = showHints && isCorrect ? '✓ ' : '  ';
        const langLabel = opt.language === 'plain' ? '' : `${opt.language}: `;
        const optText = `${prefix}${langLabel}${opt.code}`;
        const h = doc.heightOfString(optText, { width: CONTENT_WIDTH - 20 });
        doc.text(optText, MARGIN + 10, y, { width: CONTENT_WIDTH - 20, align: 'left' });
        y += h + 6;
      });

      if (showHints) {
        y += 6;
        doc.fontSize(10).fillColor('#2a7a2a');
        const correctOpt = card.options[card.correctIndex];
        const correctLang = correctOpt.language === 'plain' ? '' : `${correctOpt.language}: `;
        doc.text(`✓ Правильный ответ: ${correctLang}${correctOpt.code}`, MARGIN, y, {
          width: CONTENT_WIDTH,
          align: 'left',
        });
      }
      break;
    }

    case 'memory': {
      doc.fontSize(15).fillColor('#222');
      doc.text(card.promptKnown, MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
      y += doc.heightOfString(card.promptKnown, { width: CONTENT_WIDTH }) + 14;

      doc.fontSize(9).fillColor('#888');
      doc.text('Пары:', MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
      y += 12;

      doc.fontSize(14).fillColor('#444');
      card.pairs.forEach((pair, idx) => {
        const text = `${idx + 1}. ${pair.known} ↔ ${pair.learning}`;
        const h = doc.heightOfString(text, { width: CONTENT_WIDTH - 20 });
        doc.text(text, MARGIN + 10, y, { width: CONTENT_WIDTH - 20, align: 'left' });
        y += h + 6;
      });
      break;
    }

    case 'symbol': {
      doc.fontSize(15).fillColor('#222');
      doc.text(card.promptKnown, MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
      y += doc.heightOfString(card.promptKnown, { width: CONTENT_WIDTH }) + 14;

      doc.fontSize(9).fillColor('#888');
      doc.text('Символы:', MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
      y += 12;

      doc.fontSize(14).fillColor('#444');
      card.symbols.forEach((sym, idx) => {
        const isCorrect = idx === card.correctIndex;
        const prefix = showHints && isCorrect ? '✓ ' : '  ';
        const text = `${prefix}${sym}`;
        const h = doc.heightOfString(text, { width: CONTENT_WIDTH - 20 });
        doc.text(text, MARGIN + 10, y, { width: CONTENT_WIDTH - 20, align: 'left' });
        y += h + 6;
      });

      if (showHints) {
        y += 6;
        doc.fontSize(10).fillColor('#2a7a2a');
        doc.text(`✓ Правильный ответ: ${card.symbols[card.correctIndex]}`, MARGIN, y, {
          width: CONTENT_WIDTH,
          align: 'left',
        });
      }
      break;
    }

    case 'sound':
    case 'timed':
    case 'reading': {
      doc.fontSize(15).fillColor('#222');
      doc.text(card.promptKnown, MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
      y += doc.heightOfString(card.promptKnown, { width: CONTENT_WIDTH }) + 14;

      const options = card.optionsLearning ?? card.optionsKnown ?? [];
      doc.fontSize(9).fillColor('#888');
      doc.text('Ответы:', MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
      y += 12;

      doc.fontSize(14).fillColor('#444');
      options.forEach((opt, idx) => {
        const isCorrect = idx === card.correctIndex;
        const prefix = showHints && isCorrect ? '✓ ' : '  ';
        const text = `${prefix}${opt}`;
        const h = doc.heightOfString(text, { width: CONTENT_WIDTH - 20 });
        doc.text(text, MARGIN + 10, y, { width: CONTENT_WIDTH - 20, align: 'left' });
        y += h + 6;
      });

      if (showHints) {
        y += 6;
        doc.fontSize(10).fillColor('#2a7a2a');
        const correctText = options[card.correctIndex];
        if (correctText) {
          doc.text(`✓ Правильный ответ: ${correctText}`, MARGIN, y, {
            width: CONTENT_WIDTH,
            align: 'left',
          });
        }
      }
      break;
    }

    case 'keyboard': {
      doc.fontSize(15).fillColor('#222');
      doc.text(card.promptKnown, MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
      y += doc.heightOfString(card.promptKnown, { width: CONTENT_WIDTH }) + 14;

      doc.fontSize(9).fillColor('#888');
      doc.text('Допустимые ответы:', MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
      y += 14;

      const answers = card.acceptedAnswersLearning ?? card.acceptedAnswersKnown ?? [];
      doc.fontSize(14).fillColor('#444');
      answers.forEach((ans) => {
        const text = `  • ${ans}`;
        const h = doc.heightOfString(text, { width: CONTENT_WIDTH - 20 });
        doc.text(text, MARGIN + 10, y, { width: CONTENT_WIDTH - 20, align: 'left' });
        y += h + 6;
      });
      break;
    }

    case 'draw': {
      doc.fontSize(15).fillColor('#222');
      doc.text(card.promptKnown, MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
      y += doc.heightOfString(card.promptKnown, { width: CONTENT_WIDTH }) + 14;

      doc.fontSize(14).fillColor('#444');
      doc.text(`Подсказка: ${card.referenceHintKnown}`, MARGIN, y, {
        width: CONTENT_WIDTH,
        align: 'left',
      });
      if (card.meaningKnown) {
        y += 16;
        doc.text(`Значение: ${card.meaningKnown}`, MARGIN, y, {
          width: CONTENT_WIDTH,
          align: 'left',
        });
      }
      break;
    }

    case 'tone': {
      doc.fontSize(15).fillColor('#222');
      doc.text(card.promptKnown, MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
      y += doc.heightOfString(card.promptKnown, { width: CONTENT_WIDTH }) + 14;

      doc.fontSize(14).fillColor('#444');
      doc.text(`Слог: ${card.syllableBase}`, MARGIN, y, { width: CONTENT_WIDTH, align: 'left' });
      y += 16;

      card.toneOptions.forEach((tone, idx) => {
        const isCorrect = idx === card.correctIndex;
        const prefix = showHints && isCorrect ? '✓ ' : '  ';
        const text = `${prefix}${tone.mark ?? tone.name ?? String(tone)}`;
        const h = doc.heightOfString(text, { width: CONTENT_WIDTH - 20 });
        doc.text(text, MARGIN + 10, y, { width: CONTENT_WIDTH - 20, align: 'left' });
        y += h + 6;
      });
      break;
    }

    default: {
      doc.fontSize(14).fillColor('#999');
      doc.text(`[Неизвестный тип карточки: ${card.kind}]`, MARGIN, y, {
        width: CONTENT_WIDTH,
        align: 'left',
      });
      break;
    }
  }

  // --- Нижний колонтитул: номер страницы + ссылка "назад" ---
  const footerY = doc.y + 8;
  doc.fontSize(7).fillColor('#999');
  doc.text(`— ${pageNum} —`, MARGIN, footerY, {
    width: CONTENT_WIDTH,
    align: 'center',
  });

  // Ссылка «← Оглавление» в левом нижнем углу
  doc.fontSize(7).fillColor('#3366cc');
  doc.text('← Оглавление', MARGIN, footerY, { width: 80, align: 'left' });
  doc.annotate(MARGIN, footerY, 80, 12, {
    Subtype: 'Link',
    Dest: 'toc',
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const showHints = args.includes('--hints');
  const courseId = args.find((a) => !a.startsWith('--'));

  if (!courseId) {
    console.error('Usage: node scripts/export-course-pdf.mjs [--hints] <course-id>');
    console.error('  --hints    show correct answers (✓)');
    console.error('  <course-id>  course identifier');
    console.error('\nAvailable courses:');
    const manifest = loadJson('content-manifest.json');
    manifest.courseFiles.forEach((f) => {
      const data = loadJson(f);
      data.courses.forEach((c) => console.error(`  ${c.id} — ${c.title}`));
    });
    process.exit(1);
  }

  // -----------------------------------------------------------------------
  // 1. Load data
  // -----------------------------------------------------------------------
  const manifest = loadJson('content-manifest.json');

  let courseData = null;
  for (const f of manifest.courseFiles) {
    const data = loadJson(f);
    const found = data.courses.find((c) => c.id === courseId);
    if (found) {
      courseData = data;
      break;
    }
  }

  if (!courseData) {
    console.error(`[ERROR] Course "${courseId}" not found in any course file.`);
    process.exit(1);
  }

  const course = courseData.courses[0];
  const lessons = courseData.lessons.filter((l) => l.courseId === courseId);
  lessons.sort((a, b) => a.order - b.order);

  console.log(`Course: ${course.title} (${course.id})`);
  console.log(`Lessons: ${lessons.length}`);
  console.log(`Mode: ${showHints ? 'with hints' : 'without hints'}`);

  // Load all scenarios
  const allScenarios = {};
  for (const f of manifest.scenarioFiles) {
    const data = loadJson(f);
    for (const s of data.scenarios) {
      allScenarios[s.id] = s;
    }
  }

  // Load all cards
  const allCards = {};
  for (const f of manifest.cardFiles) {
    const data = loadJson(f);
    for (const c of data.cards) {
      allCards[c.id] = c;
    }
  }

  // -----------------------------------------------------------------------
  // 2. Collect cards in course order
  // -----------------------------------------------------------------------
  const cardEntries = [];

  for (const lesson of lessons) {
    for (const scenarioId of lesson.scenarioIds) {
      const scenario = allScenarios[scenarioId];
      if (!scenario) {
        console.warn(`[WARN] Scenario "${scenarioId}" not found, skipping.`);
        continue;
      }

      const cardIds = scenario.cardSource?.cardIds ?? [];
      for (const cardId of cardIds) {
        const card = allCards[cardId];
        if (!card) {
          console.warn(`[WARN] Card "${cardId}" not found, skipping.`);
          continue;
        }
        cardEntries.push({
          card,
          scenarioTitle: scenario.title,
          lessonTitle: lesson.title,
        });
      }
    }
  }

  console.log(`Cards to export: ${cardEntries.length}`);

  if (cardEntries.length === 0) {
    console.error('[ERROR] No cards found for this course.');
    process.exit(1);
  }

  // -----------------------------------------------------------------------
  // 3. Parse course idea for table of contents
  // -----------------------------------------------------------------------
  let stages = [];
  if (course.authoring?.idea) {
    stages = parseIdeaStages(course.authoring.idea);
    console.log(`Stages in idea: ${stages.length}`);
    stages.forEach((s) => console.log(`  ${s.title} (${s.questions.length} questions)`));
  }

  // -----------------------------------------------------------------------
  // 4. Generate PDF
  // -----------------------------------------------------------------------
  const exportDir = resolve(DATA_DIR, 'export');
  if (!existsSync(exportDir)) {
    mkdirSync(exportDir, { recursive: true });
  }

  const suffix = showHints ? '.hints' : '';
  const outputPath = resolve(exportDir, `${courseId}${suffix}.pdf`);

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    info: {
      Title: `${course.title}${showHints ? ' (с подсказками)' : ''}`,
      Author: 'LinguaCode',
      Subject: `Course export: ${course.id}`,
    },
  });

  const writeStream = createWriteStream(outputPath);
  doc.pipe(writeStream);

  registerCyrillicFont(doc);

  // --- Title page with table of contents ---
  if (stages.length > 0) {
    renderTitlePage(doc, course.title, stages, cardEntries, lessons);
  }

  // --- Card pages ---
  for (let i = 0; i < cardEntries.length; i++) {
    const { card, scenarioTitle, lessonTitle } = cardEntries[i];
    const pageNum = i + 1;

    // Add a page for each card (including first — after title page)
    doc.addPage();

    // Named destination for TOC links: "card-1", "card-2", etc.
    doc.addNamedDestination(`card-${pageNum}`, 'XYZ', null, null, null);

    renderCard(doc, card, scenarioTitle, lessonTitle, course.title, pageNum, showHints);
  }

  doc.end();

  await new Promise((resolve) => writeStream.on('finish', resolve));

  const stats = statSync(outputPath);
  const sizeKb = (stats.size / 1024).toFixed(1);
  console.log(`\n✅ PDF exported: ${outputPath}`);
  console.log(`   Pages: ${1 + cardEntries.length} (1 title + ${cardEntries.length} cards)`);
  console.log(`   Size: ${sizeKb} KB`);
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
