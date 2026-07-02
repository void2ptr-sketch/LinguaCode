import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { jsPDF } from 'jspdf';

import type { Card, CourseWithLessons, Scenario, Lesson } from '../../../core/models';
import { CardRepository } from '../../../core/data/card.repository';
import { loadScenariosFromStorage } from '../../../core/data/scenarios-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CardEntry = {
  card: Card;
  scenarioTitle: string;
  lessonTitle: string;
};

type IdeaStage = {
  title: string;
  questions: string[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MARGIN = 40;
const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89; // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const FONT_NAME = 'DejaVuSansCondensed';
const FONT_PATH = 'assets/fonts/DejaVuSansCondensed.ttf';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class CoursePdfExportService {
  private readonly http = inject(HttpClient);
  private readonly cardRepository = inject(CardRepository);

  private fontData: string | null = null;

  /**
   * Экспортирует курс в PDF и возвращает Blob для скачивания.
   * @param course — курс с уроками
   * @param showHints — показывать правильные ответы
   */
  async export(course: CourseWithLessons, showHints: boolean): Promise<Blob> {
    // 1. Загружаем шрифт (один раз)
    if (!this.fontData) {
      this.fontData = await this.loadFont();
    }

    // 2. Загружаем сценарии и карточки
    const allScenarios = loadScenariosFromStorage();
    const allCards = this.cardRepository.loadStored();

    // 3. Собираем карточки в порядке курса
    const lessons = [...course.lessons].sort((a, b) => a.order - b.order);
    const cardEntries = this.collectCardEntries(lessons, allScenarios, allCards);

    // 4. Парсим идею для оглавления
    const stages = this.parseIdeaStages(course.authoring?.idea ?? '');

    // 5. Генерируем PDF
    return this.generatePdf(course.title, stages, cardEntries, lessons, showHints);
  }

  // -----------------------------------------------------------------------
  // Private: PDF generation
  // -----------------------------------------------------------------------

  private async generatePdf(
    courseTitle: string,
    stages: IdeaStage[],
    cardEntries: CardEntry[],
    lessons: readonly Lesson[],
    showHints: boolean,
  ): Promise<Blob> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
      compress: true,
    });

    // Регистрируем шрифт
    doc.addFileToVFS(FONT_NAME, this.fontData!);
    doc.addFont(FONT_NAME, FONT_NAME, 'normal');
    doc.setFont(FONT_NAME);

    // --- Title page with TOC (page 1) ---
    if (stages.length > 0) {
      this.renderTitlePage(doc, courseTitle, stages, cardEntries, lessons);
    }

    // --- Card pages (pages 2+) ---
    for (let i = 0; i < cardEntries.length; i++) {
      const { card, scenarioTitle, lessonTitle } = cardEntries[i];
      const pageNum = i + 1;

      doc.addPage();
      this.renderCard(doc, card, scenarioTitle, lessonTitle, courseTitle, pageNum, showHints);
    }

    return doc.output('blob');
  }

  // -----------------------------------------------------------------------
  // Private: Title page with table of contents
  // -----------------------------------------------------------------------

  private renderTitlePage(
    doc: jsPDF,
    courseTitle: string,
    stages: IdeaStage[],
    cardEntries: CardEntry[],
    lessons: readonly Lesson[],
  ): void {
    let y = MARGIN;

    // Заголовок
    doc.setFontSize(18);
    doc.setTextColor(26, 26, 26);
    doc.text(courseTitle, MARGIN, y);
    y += 24;

    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    doc.text('Оглавление', MARGIN, y);
    y += 20;

    // Строим карту: сценарий → страница первой карточки этого сценария
    // Страницы карточек начинаются с 2 (page 1 = title page)
    const CARD_PAGE_OFFSET = 2;
    const scenarioFirstPage = new Map<string, number>();
    for (let i = 0; i < cardEntries.length; i++) {
      const st = cardEntries[i].scenarioTitle;
      if (!scenarioFirstPage.has(st)) {
        scenarioFirstPage.set(st, i + CARD_PAGE_OFFSET);
      }
    }

    // Сопоставляем этапы идеи с уроками по порядку
    for (let stageIdx = 0; stageIdx < stages.length; stageIdx++) {
      const stage = stages[stageIdx];
      const lesson = lessons[stageIdx];
      if (!lesson) continue;

      // Заголовок этапа
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51);
      const stageHeader = `Этап ${stageIdx + 1}: ${stage.title}`;
      doc.text(stageHeader, MARGIN, y);
      y += 16;

      // Собираем все сценарии этого урока
      const lessonScenarioTitles = cardEntries
        .filter((e) => e.lessonTitle === lesson.title)
        .reduce<string[]>((acc, e) => {
          if (!acc.includes(e.scenarioTitle)) acc.push(e.scenarioTitle);
          return acc;
        }, []);

      // Сопоставляем вопросы из идеи со сценариями урока по порядку
      for (let qIdx = 0; qIdx < stage.questions.length; qIdx++) {
        const question = stage.questions[qIdx];
        const scenarioTitle = lessonScenarioTitles[qIdx];
        const pageRef = scenarioTitle ? scenarioFirstPage.get(scenarioTitle) : null;
        const pageStr = pageRef ? `→ с. ${pageRef}` : '';

        doc.setFontSize(9);
        doc.setTextColor(85, 85, 85);
        const text = `  • ${question}  ${pageStr}`;

        // Check page overflow
        const lines = doc.splitTextToSize(text, CONTENT_WIDTH - 20);
        const h = lines.length * 12;

        if (y + h > PAGE_HEIGHT - MARGIN - 20) {
          doc.addPage();
          y = MARGIN;
        }

        doc.text(lines, MARGIN + 10, y);

        // Добавляем кликабельную ссылку на страницу карточки
        if (pageRef) {
          doc.link(MARGIN + 10, y - 8, CONTENT_WIDTH - 20, h + 4, {
            pageNumber: pageRef,
          });
        }

        y += h + 4;
      }

      y += 8;
    }

    // Нижний колонтитул
    doc.setFontSize(7);
    doc.setTextColor(153, 153, 153);
    doc.text('— i —', PAGE_WIDTH / 2, PAGE_HEIGHT - MARGIN - 5, { align: 'center' });
  }

  // -----------------------------------------------------------------------
  // Private: Card rendering
  // -----------------------------------------------------------------------

  private renderCard(
    doc: jsPDF,
    card: Card,
    scenarioTitle: string,
    lessonTitle: string,
    courseTitle: string,
    pageNum: number,
    showHints: boolean,
  ): void {
    let y = MARGIN;

    // --- Header: курс (мелко, только для навигации) ---
    doc.setFontSize(7);
    doc.setTextColor(153, 153, 153);
    doc.text(courseTitle, MARGIN, y);
    y += 10;

    // --- ID карточки (мелко) ---
    doc.setFontSize(6);
    doc.setTextColor(187, 187, 187);
    doc.text(card.id, MARGIN, y);
    y += 8;

    // --- Разделитель ---
    doc.setDrawColor(221, 221, 221);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 12;

    // --- Этап (урок) ---
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    doc.text(lessonTitle, MARGIN, y);
    y += 14;

    // --- Заголовок карточки (тема сценария) ---
    doc.setFontSize(14);
    doc.setTextColor(26, 26, 26);
    const titleLines = doc.splitTextToSize(card.title, CONTENT_WIDTH);
    doc.text(titleLines, MARGIN, y);
    y += titleLines.length * 18 + 8;

    // --- Разделитель перед вопросом ---
    doc.setDrawColor(238, 238, 238);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 5;

    // --- Метка "Вопрос" (увеличен шрифт, добавлен отступ) ---
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Вопрос:', MARGIN, y);
    y += 14;

    // --- Контент в зависимости от типа ---
    switch (card.kind) {
      case 'select': {
        // Вопрос — уменьшен в 1.3 раза (было 15)
        doc.setFontSize(11);
        doc.setTextColor(34, 34, 34);
        const promptLines = doc.splitTextToSize(card.promptKnown, CONTENT_WIDTH);
        doc.text(promptLines, MARGIN, y);
        y += promptLines.length * 16 + 12;

        // --- Разделитель перед ответами ---
        doc.setDrawColor(238, 238, 238);
        doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
        y += 10;

        // --- Метка "Ответы" (увеличен шрифт) ---
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text('Ответы:', MARGIN, y);
        y += 16;

        // Варианты ответов — уменьшен в 1.3 раза (было 14)
        doc.setFontSize(11);
        doc.setTextColor(68, 68, 68);
        for (let idx = 0; idx < card.optionsLearning.length; idx++) {
          const opt = card.optionsLearning[idx];
          const isCorrect = idx === card.correctIndex;
          const prefix = showHints && isCorrect ? '✓ ' : '  ';
          const text = `${prefix}${opt}`;
          const optLines = doc.splitTextToSize(text, CONTENT_WIDTH - 20);
          doc.text(optLines, MARGIN + 10, y);
          y += optLines.length * 16 + 5;
        }

        // Правильный ответ (только в режиме подсказок)
        if (showHints) {
          y += 6;
          doc.setFontSize(10);
          doc.setTextColor(42, 122, 42);
          doc.text(`✓ Правильный ответ: ${card.optionsLearning[card.correctIndex]}`, MARGIN, y);
        }
        break;
      }

      case 'code-select': {
        // caption
        if (card.caption) {
          doc.setFontSize(11);
          doc.setTextColor(34, 34, 34);
          const captionLines = doc.splitTextToSize(card.caption, CONTENT_WIDTH);
          doc.text(captionLines, MARGIN, y);
          y += captionLines.length * 16 + 10;
        }

        // prompt code — блок с фоном
        doc.setFontSize(10);
        doc.setTextColor(26, 26, 26);
        const codeLines = doc.splitTextToSize(card.prompt.code, CONTENT_WIDTH - 20);
        const codeBlockHeight = codeLines.length * 14 + 14;

        doc.setFillColor(245, 245, 245);
        doc.rect(MARGIN, y, CONTENT_WIDTH, codeBlockHeight, 'F');
        doc.setTextColor(26, 26, 26);
        doc.setFontSize(10);
        doc.text(codeLines, MARGIN + 8, y + 10);
        y += codeBlockHeight + 12;

        // --- Разделитель перед ответами ---
        doc.setDrawColor(238, 238, 238);
        doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
        y += 10;

        // --- Метка "Ответы" (увеличен шрифт) ---
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text('Ответы:', MARGIN, y);
        y += 16;

        // Варианты ответов
        doc.setFontSize(11);
        doc.setTextColor(68, 68, 68);
        for (let idx = 0; idx < card.options.length; idx++) {
          const opt = card.options[idx];
          const isCorrect = idx === card.correctIndex;
          const prefix = showHints && isCorrect ? '✓ ' : '  ';
          const langLabel = opt.language === 'plain' ? '' : `${opt.language}: `;
          const optText = `${prefix}${langLabel}${opt.code}`;
          const optLines = doc.splitTextToSize(optText, CONTENT_WIDTH - 20);
          doc.text(optLines, MARGIN + 10, y);
          y += optLines.length * 16 + 5;
        }

        if (showHints) {
          y += 6;
          doc.setFontSize(10);
          doc.setTextColor(42, 122, 42);
          const correctOpt = card.options[card.correctIndex];
          const correctLang = correctOpt.language === 'plain' ? '' : `${correctOpt.language}: `;
          doc.text(`✓ Правильный ответ: ${correctLang}${correctOpt.code}`, MARGIN, y);
        }
        break;
      }

      case 'memory': {
        doc.setFontSize(11);
        doc.setTextColor(34, 34, 34);
        const promptLines = doc.splitTextToSize(card.promptKnown, CONTENT_WIDTH);
        doc.text(promptLines, MARGIN, y);
        y += promptLines.length * 16 + 12;

        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text('Пары:', MARGIN, y);
        y += 16;

        doc.setFontSize(11);
        doc.setTextColor(68, 68, 68);
        for (let idx = 0; idx < card.pairs.length; idx++) {
          const pair = card.pairs[idx];
          const text = `${idx + 1}. ${pair.known} ↔ ${pair.learning}`;
          const pairLines = doc.splitTextToSize(text, CONTENT_WIDTH - 20);
          doc.text(pairLines, MARGIN + 10, y);
          y += pairLines.length * 16 + 5;
        }
        break;
      }

      case 'symbol': {
        doc.setFontSize(11);
        doc.setTextColor(34, 34, 34);
        const promptLines = doc.splitTextToSize(card.promptKnown, CONTENT_WIDTH);
        doc.text(promptLines, MARGIN, y);
        y += promptLines.length * 16 + 12;

        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text('Символы:', MARGIN, y);
        y += 16;

        doc.setFontSize(11);
        doc.setTextColor(68, 68, 68);
        for (let idx = 0; idx < card.symbols.length; idx++) {
          const sym = card.symbols[idx];
          const isCorrect = idx === card.correctIndex;
          const prefix = showHints && isCorrect ? '✓ ' : '  ';
          const text = `${prefix}${sym}`;
          const symLines = doc.splitTextToSize(text, CONTENT_WIDTH - 20);
          doc.text(symLines, MARGIN + 10, y);
          y += symLines.length * 16 + 5;
        }

        if (showHints) {
          y += 6;
          doc.setFontSize(10);
          doc.setTextColor(42, 122, 42);
          doc.text(`✓ Правильный ответ: ${card.symbols[card.correctIndex]}`, MARGIN, y);
        }
        break;
      }

      case 'sound':
      case 'timed':
      case 'reading': {
        doc.setFontSize(11);
        doc.setTextColor(34, 34, 34);
        const promptLines = doc.splitTextToSize(card.promptKnown, CONTENT_WIDTH);
        doc.text(promptLines, MARGIN, y);
        y += promptLines.length * 16 + 12;

        const options: readonly string[] =
          'optionsLearning' in card
            ? (card.optionsLearning ?? [])
            : 'optionsKnown' in card
              ? (card.optionsKnown ?? [])
              : [];

        // --- Разделитель перед ответами ---
        doc.setDrawColor(238, 238, 238);
        doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
        y += 10;

        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text('Ответы:', MARGIN, y);
        y += 16;

        doc.setFontSize(11);
        doc.setTextColor(68, 68, 68);
        for (let idx = 0; idx < options.length; idx++) {
          const opt = options[idx];
          const isCorrect = idx === card.correctIndex;
          const prefix = showHints && isCorrect ? '✓ ' : '  ';
          const text = `${prefix}${opt}`;
          const optLines = doc.splitTextToSize(text, CONTENT_WIDTH - 20);
          doc.text(optLines, MARGIN + 10, y);
          y += optLines.length * 16 + 5;
        }

        if (showHints) {
          y += 6;
          doc.setFontSize(10);
          doc.setTextColor(42, 122, 42);
          const correctText = options[card.correctIndex];
          if (correctText) {
            doc.text(`✓ Правильный ответ: ${correctText}`, MARGIN, y);
          }
        }
        break;
      }

      case 'keyboard': {
        doc.setFontSize(11);
        doc.setTextColor(34, 34, 34);
        const promptLines = doc.splitTextToSize(card.promptKnown, CONTENT_WIDTH);
        doc.text(promptLines, MARGIN, y);
        y += promptLines.length * 16 + 12;

        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text('Допустимые ответы:', MARGIN, y);
        y += 16;

        const answers = card.acceptedAnswersLearning ?? card.acceptedAnswersKnown ?? [];
        doc.setFontSize(11);
        doc.setTextColor(68, 68, 68);
        for (const ans of answers) {
          const text = `  • ${ans}`;
          const ansLines = doc.splitTextToSize(text, CONTENT_WIDTH - 20);
          doc.text(ansLines, MARGIN + 10, y);
          y += ansLines.length * 16 + 5;
        }
        break;
      }

      case 'draw': {
        doc.setFontSize(11);
        doc.setTextColor(34, 34, 34);
        const promptLines = doc.splitTextToSize(card.promptKnown, CONTENT_WIDTH);
        doc.text(promptLines, MARGIN, y);
        y += promptLines.length * 16 + 12;

        doc.setFontSize(11);
        doc.setTextColor(68, 68, 68);
        doc.text(`Подсказка: ${card.referenceHintKnown}`, MARGIN, y);
        if (card.meaningKnown) {
          y += 16;
          doc.text(`Значение: ${card.meaningKnown}`, MARGIN, y);
        }
        break;
      }

      case 'tone': {
        doc.setFontSize(11);
        doc.setTextColor(34, 34, 34);
        const promptLines = doc.splitTextToSize(card.promptKnown, CONTENT_WIDTH);
        doc.text(promptLines, MARGIN, y);
        y += promptLines.length * 16 + 12;

        doc.setFontSize(11);
        doc.setTextColor(68, 68, 68);
        doc.text(`Слог: ${card.syllableBase}`, MARGIN, y);
        y += 16;

        for (let idx = 0; idx < card.toneOptions.length; idx++) {
          const tone = card.toneOptions[idx];
          const isCorrect = idx === card.correctIndex;
          const prefix = showHints && isCorrect ? '✓ ' : '  ';
          const toneStr = String(tone);
          const text = `${prefix}${toneStr}`;
          const toneLines = doc.splitTextToSize(text, CONTENT_WIDTH - 20);
          doc.text(toneLines, MARGIN + 10, y);
          y += toneLines.length * 16 + 5;
        }
        break;
      }

      default: {
        const _exhaustive: never = card;
        doc.setFontSize(14);
        doc.setTextColor(153, 153, 153);
        doc.text(`[Неизвестный тип карточки: ${(_exhaustive as Card).kind}]`, MARGIN, y);
        break;
      }
    }

    // --- Пустая строка перед нижним колонтитулом ---
    y += 8;

    // --- Нижний колонтитул: номер страницы + ссылка "← Оглавление" ---
    const footerY = y + 8;
    doc.setFontSize(7);
    doc.setTextColor(153, 153, 153);
    doc.text(`— ${pageNum} —`, PAGE_WIDTH / 2, footerY, { align: 'center' });

    // Ссылка «← Оглавление» в левом нижнем углу (ведёт на страницу 1)
    doc.setTextColor(51, 102, 204);
    doc.text('← Оглавление', MARGIN, footerY);
    doc.link(MARGIN, footerY - 8, 80, 12, { pageNumber: 1 });
  }

  // -----------------------------------------------------------------------
  // Private: Helpers
  // -----------------------------------------------------------------------

  /**
   * Загружает TTF-шрифт из assets и возвращает как base64 data URL (без префикса).
   */
  private async loadFont(): Promise<string> {
    const arrayBuffer = await firstValueFrom(
      this.http.get(FONT_PATH, { responseType: 'arraybuffer' }),
    );
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  /**
   * Собирает все карточки курса в порядке: уроки → сценарии → карточки.
   */
  private collectCardEntries(
    lessons: readonly Lesson[],
    allScenarios: readonly Scenario[],
    allCards: readonly Card[],
  ): CardEntry[] {
    const entries: CardEntry[] = [];
    const scenarioMap = new Map<string, Scenario>();
    for (const s of allScenarios) {
      scenarioMap.set(s.id, s);
    }

    const cardMap = new Map<string, Card>();
    for (const c of allCards) {
      cardMap.set(c.id, c);
    }

    for (const lesson of lessons) {
      for (const scenarioId of lesson.scenarioIds) {
        const scenario = scenarioMap.get(scenarioId);
        if (!scenario) continue;

        const cardSource = scenario.cardSource;
        const cardIds: readonly string[] =
          cardSource.mode === 'fixed' || cardSource.mode === 'snapshot'
            ? cardSource.cardIds
            : [];
        for (const cardId of cardIds) {
          const card = cardMap.get(cardId);
          if (!card) continue;

          entries.push({
            card,
            scenarioTitle: scenario.title,
            lessonTitle: lesson.title,
          });
        }
      }
    }

    return entries;
  }

  /**
   * Парсит Markdown-идею курса, извлекая структуру «этап → вопросы».
   */
  private parseIdeaStages(markdown: string): IdeaStage[] {
    const stages: IdeaStage[] = [];
    const lines = markdown.split('\n');
    let currentStage: IdeaStage | null = null;

    for (const line of lines) {
      const stageMatch = line.match(/^##\s+Этап\s+\d+\s*:\s*(.+)/i);
      if (stageMatch) {
        currentStage = { title: stageMatch[1].trim(), questions: [] };
        stages.push(currentStage);
        continue;
      }

      const questionMatch = line.match(/^-\s+(.+)/);
      if (currentStage && questionMatch) {
        const q = questionMatch[1].trim();
        if (q.endsWith('?')) {
          currentStage.questions.push(q);
        }
      }
    }

    return stages;
  }
}
