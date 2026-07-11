/**
 * Сервис для экспорта курсов в PDF формат.
 *
 * Генерирует PDF с:
 * - Титульной страницей с оглавлением (из authoring.idea курса)
 * - Отдельными страницами для каждой карточки
 * - Кликабельными ссылками в оглавлении на страницы карточек
 *
 * Использует jsPDF для генерации PDF и DejaVu Sans шрифт для поддержки кириллицы.
 *
 * Пример использования:
 * ```typescript
 * const pdfService = inject(CoursePdfExportService);
 * const blob = await pdfService.export(course, showHints: false);
 * ```
 */

/**
 * Перемешивает массив методом Фишера-Йейтса.
 * Исходный массив не изменяется.
 *
 * @param array — исходный массив
 * @returns новый перемешанный массив
 */
function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { jsPDF } from 'jspdf';

import type { Card, CourseWithLessons, Scenario, Lesson } from '../../../core/models';
import { CardRepository } from '../../../core/data/cards/card.repository';
import { loadScenariosFromStorage } from '../../../core/data/scenarios/scenarios-storage';

/**
 * Представление карточки в контексте курса.
 * Содержит саму карточку и метаданные о её расположении.
 */
type CardEntry = {
  /** Данные карточки */
  card: Card;
  /** Название сценария, в котором находится карточка */
  scenarioTitle: string;
  /** Название урока, в котором находится сценарий */
  lessonTitle: string;
};

/**
 * Этап из authoring.idea курса.
 * Соответствует разделу "## Этап N: название" в Markdown.
 */
type IdeaStage = {
  /** Название этапа (например, "Введение в DBI") */
  title: string;
  /** Список вопросов этапа */
  questions: string[];
};

// -------------------------------------------------------------------------
// Константы для PDF
// -------------------------------------------------------------------------

/** Отступ от краёв страницы (pt) */
const MARGIN = 40;
/** Ширина страницы A4 в пунктах */
const PAGE_WIDTH = 595.28;
/** Высота страницы A4 в пунктах */
const PAGE_HEIGHT = 841.89;
/** Полезная ширина контента */
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

/** Имя шрифта для регистрации в jsPDF */
const FONT_NAME = 'DejaVuSansCondensed';
/** Путь к TTF-шрифту в assets */
const FONT_PATH = 'assets/fonts/DejaVuSansCondensed.ttf';

/**
 * Сервис для экспорта курсов в PDF.
 *
 * Основные возможности:
 * - Генерация PDF с оглавлением из authoring.idea
 * - Рендеринг всех типов карточек (select, code-select, memory, и др.)
 * - Поддержка кириллицы через DejaVu Sans шрифт
 * - Кликабельные ссылки в оглавлении
 * - Опциональное отображение правильных ответов (✓)
 *
 * Архитектура:
 * 1. Загружает шрифт один раз (кэшируется)
 * 2. Загружает сценарии и карточки из хранилищ
 * 3. Собирает карточки в порядке курса (lessons → scenarios → cards)
 * 4. Парсит idea для оглавления
 * 5. Генерирует PDF через jsPDF
 */
@Injectable({ providedIn: 'root' })
export class CoursePdfExportService {
  /** HTTP-клиент для загрузки шрифта */
  private readonly http = inject(HttpClient);
  /** Репозиторий карточек */
  private readonly cardRepository = inject(CardRepository);

  /** Кэш base64-данных шрифта (загружается один раз) */
  private fontData: string | null = null;

  // -------------------------------------------------------------------------
  // Публичный API
  // -------------------------------------------------------------------------

  /**
   * Экспортирует курс в PDF и возвращает Blob для скачивания.
   *
   * Процесс:
   * 1. Загружает шрифт (если ещё не загружен)
   * 2. Загружает сценарии и карточки из хранилищ
   * 3. Собирает карточки в порядке курса
   * 4. Парсит authoring.idea для оглавления
   * 5. Генерирует PDF
   *
   * @param course — курс с уроками для экспорта
   * @param showHints — если true, показывает правильные ответы (✓)
   * @returns Blob с PDF-данными
   */
  async export(course: CourseWithLessons, showHints: boolean): Promise<Blob> {
    // 1. Загружаем шрифт (один раз)
    if (!this.fontData) {
      this.fontData = await this.loadFont();
    }

    // 2. Загружаем сценарии и карточки
    const allScenarios = loadScenariosFromStorage();
    const allCards = this.cardRepository.loadStored() as readonly Card[];

    // 3. Собираем карточки в порядке курса
    const lessons = [...course.lessons].sort((a, b) => a.order - b.order);
    const cardEntries = this.collectCardEntries(lessons, allScenarios, allCards);

    // 4. Парсим идею для оглавления
    const stages = this.parseIdeaStages(course.authoring?.idea ?? '');

    // 5. Генерируем PDF
    return this.generatePdf(course.title, stages, cardEntries, lessons, showHints);
  }

  // -------------------------------------------------------------------------
  // Генерация PDF
  // -------------------------------------------------------------------------

  /**
   * Генерирует PDF-документ и возвращает Blob.
   *
   * Структура PDF:
   * - Страница 1: титульная страница с оглавлением (i)
   * - Страницы 2+: карточки (1, 2, 3, ...)
   *
   * @param courseTitle — название курса
   * @param stages — этапы из authoring.idea
   * @param cardEntries — карточки в порядке курса
   * @param lessons — уроки курса
   * @param showHints — показывать правильные ответы
   * @returns Blob с PDF
   * @private
   */
  private async generatePdf(
    courseTitle: string,
    stages: IdeaStage[],
    cardEntries: CardEntry[],
    lessons: readonly Lesson[],
    showHints: boolean,
  ): Promise<Blob> {
    // Создаём PDF документ A4
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
      compress: true,
    });

    // Регистрируем шрифт с кириллицей
    doc.addFileToVFS(FONT_NAME, this.fontData!);
    doc.addFont(FONT_NAME, FONT_NAME, 'normal');
    doc.setFont(FONT_NAME);

    // --- Титульная страница с оглавлением (стр. 1) ---
    if (stages.length > 0) {
      this.renderTitlePage(doc, courseTitle, stages, cardEntries, lessons);
    }

    // --- Страницы карточек (стр. 2+) ---
    for (let i = 0; i < cardEntries.length; i++) {
      const { card, scenarioTitle, lessonTitle } = cardEntries[i];
      const pageNum = i + 1;

      doc.addPage();
      this.renderCard(doc, card, scenarioTitle, lessonTitle, courseTitle, pageNum, showHints);
    }

    return doc.output('blob');
  }

  // -------------------------------------------------------------------------
  // Рендеринг титульной страницы
  // -------------------------------------------------------------------------

  /**
   * Рендерит титульную страницу с оглавлением.
   *
   * Содержимое:
   * - Название курса
   * - Заголовок "Оглавление"
   * - Этапы из authoring.idea с вопросами
   * - Номера страниц для каждого вопроса
   * - Кликабельные ссылки на страницы карточек
   * - Нижний колонтитул с римской цифрой "— i —"
   *
   * @param doc — jsPDF документ
   * @param courseTitle — название курса
   * @param stages — этапы из authoring.idea
   * @param cardEntries — карточки в порядке курса
   * @param lessons — уроки курса
   * @private
   */
  private renderTitlePage(
    doc: jsPDF,
    courseTitle: string,
    stages: IdeaStage[],
    cardEntries: CardEntry[],
    lessons: readonly Lesson[],
  ): void {
    let y = MARGIN;

    // Заголовок курса
    doc.setFontSize(18);
    doc.setTextColor(26, 26, 26);
    doc.text(courseTitle, MARGIN, y);
    y += 24;

    // Подзаголовок "Оглавление"
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    doc.text('Оглавление', MARGIN, y);
    y += 20;

    // Строим карту: сценарий → страница первой карточки этого сценария
    // Страницы карточек начинаются с 2 (стр. 1 = оглавление)
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

        // Проверяем переполнение страницы
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

  // -------------------------------------------------------------------------
  // Рендеринг карточек
  // -------------------------------------------------------------------------

  /**
   * Рендерит одну карточку на странице PDF.
   *
   * Содержимое карточки:
   * - Название курса (мелко, для навигации)
   * - ID карточки
   * - Разделитель
   * - Название урока
   * - Заголовок карточки (тема сценария)
   * - Разделитель
   * - Метка "Вопрос:"
   * - Контент в зависимости от типа карточки
   * - Нижний колонтитул с номером страницы
   *
   * @param doc — jsPDF документ
   * @param card — данные карточки
   * @param scenarioTitle — название сценария
   * @param lessonTitle — название урока
   * @param courseTitle — название курса
   * @param pageNum — номер страницы
   * @param showHints — показывать правильные ответы
   * @private
   */
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

    // --- Название курса (мелко, для навигации) ---
    // doc.setFontSize(7);
    // doc.setTextColor(153, 153, 153);
    // doc.text(courseTitle, MARGIN, y);
    // y += 10;

    // --- ID карточки (мелко) ---
    // doc.setFontSize(6);
    // doc.setTextColor(187, 187, 187);
    // doc.text(card.id, MARGIN, y);
    // y += 8;

    // -- Ссылка "← Оглавление" --
    const SHIFT_LINK = PAGE_WIDTH / 2 - MARGIN;
    doc.setFontSize(8);
    doc.setTextColor(51, 102, 204);
    doc.text('← Оглавление', SHIFT_LINK, y);
    doc.link(SHIFT_LINK, y, 80, 12, { pageNumber: 1 });


    // --- Название урока ---
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    //doc.setTextColor(51, 102, 204);
    doc.text(lessonTitle, MARGIN, y);
    // doc.link(MARGIN, y, 80, 12, { destination: lessonTitle });
    // doc.textWithLink('← ' + lessonTitle, MARGIN, y, { destination: lessonTitle });

    y += 10;

    // --- Заголовок карточки (тема сценария) ---
    // doc.setFontSize(8);
    // doc.setTextColor(26, 26, 26);
    // const titleLines = doc.splitTextToSize(card.title, CONTENT_WIDTH);
    // doc.text(titleLines, MARGIN, y);
    // y += titleLines.length * 18 + 8;

    // --- Разделитель ---
    doc.setDrawColor(221, 221, 221);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 12;

    // --- Разделитель перед вопросом ---
    // doc.setDrawColor(238, 238, 238);
    // doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 5;

    // --- Метка "Вопрос" ---
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Вопрос:', MARGIN, y);
    y += 14;

    // --- Контент в зависимости от типа карточки ---
    switch (card.kind) {
      case 'select': {
        this.renderSelectCard(doc, card, y, showHints, CONTENT_WIDTH, MARGIN, PAGE_WIDTH);
        break;
      }

      case 'code-select': {
        this.renderCodeSelectCard(doc, card, y, showHints, CONTENT_WIDTH, MARGIN, PAGE_WIDTH);
        break;
      }

      case 'memory': {
        this.renderMemoryCard(doc, card, y, CONTENT_WIDTH, MARGIN);
        break;
      }

      case 'symbol': {
        this.renderSymbolCard(doc, card, y, showHints, CONTENT_WIDTH, MARGIN);
        break;
      }

      case 'sound':
      case 'timed':
      case 'reading': {
        this.renderOptionCard(
          doc,
          card,
          y,
          showHints,
          CONTENT_WIDTH,
          MARGIN,
          PAGE_WIDTH,
        );
        break;
      }

      case 'keyboard': {
        this.renderKeyboardCard(doc, card, y, CONTENT_WIDTH, MARGIN);
        break;
      }

      case 'draw': {
        this.renderDrawCard(doc, card, y, CONTENT_WIDTH, MARGIN);
        break;
      }

      case 'tone': {
        this.renderToneCard(doc, card, y, showHints, CONTENT_WIDTH, MARGIN);
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

    // --- Нижний колонтитул ---
    this.renderFooter(doc, pageNum, y + CONTENT_WIDTH, PAGE_WIDTH, MARGIN);
  }

  // -------------------------------------------------------------------------
  // Рендеринг типов карточек
  // -------------------------------------------------------------------------

  /**
   * Рендерит карточку типа 'select'.
   * Ответы перемешиваются при экспорте.
   * @private
   */
  private renderSelectCard(
    doc: jsPDF,
    card: Card & { kind: 'select' },
    startY: number,
    showHints: boolean,
    contentWidth: number,
    margin: number,
    pageWidth: number,
  ): void {
    let y = startY;

    // Вопрос
    doc.setFontSize(11);
    doc.setTextColor(34, 34, 34);
    const promptLines = doc.splitTextToSize(card.promptKnown, contentWidth);
    doc.text(promptLines, margin, y);
    y += promptLines.length * 16 + 12;

    // Разделитель
    doc.setDrawColor(238, 238, 238);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Метка "Ответы"
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Ответы:', margin, y);
    y += 16;

    // Перемешиваем варианты ответов
    const shuffledOptions = shuffle(card.optionsLearning);

    // Находим индекс правильного ответа в перемешанном массиве
    const originalCorrectOption = card.optionsLearning[card.correctIndex];
    const shuffledCorrectIndex = shuffledOptions.indexOf(originalCorrectOption);

    // Варианты ответов
    doc.setFontSize(11);
    doc.setTextColor(68, 68, 68);
    for (let idx = 0; idx < shuffledOptions.length; idx++) {
      const opt = shuffledOptions[idx];
      const isCorrect = idx === shuffledCorrectIndex;
      const prefix = showHints && isCorrect ? '✓ ' : '  ';
      const text = `${prefix}${opt}`;
      const optLines = doc.splitTextToSize(text, contentWidth - 20);
      doc.text(optLines, margin + 10, y);
      y += optLines.length * 16 + 5;
    }

    // Правильный ответ (если showHints)
    if (showHints) {
      y += 6;
      doc.setFontSize(10);
      doc.setTextColor(42, 122, 42);
      doc.text(
        `✓ Правильный ответ: ${shuffledOptions[shuffledCorrectIndex]}`,
        margin,
        y,
      );
    }
  }

  /**
   * Рендерит карточку типа 'code-select'.
   * Ответы перемешиваются при экспорте.
   * @private
   */
  private renderCodeSelectCard(
    doc: jsPDF,
    card: Card & { kind: 'code-select' },
    startY: number,
    showHints: boolean,
    contentWidth: number,
    margin: number,
    pageWidth: number,
  ): void {
    let y = startY;

    // Caption
    if (card.caption) {
      doc.setFontSize(11);
      doc.setTextColor(34, 34, 34);
      const captionLines = doc.splitTextToSize(card.caption, contentWidth);
      doc.text(captionLines, margin, y);
      y += captionLines.length * 16 + 10;
    }

    // Код с фоном
    doc.setFontSize(10);
    doc.setTextColor(26, 26, 26);
    const codeLines = doc.splitTextToSize(card.prompt.code, contentWidth - 20);
    const codeBlockHeight = codeLines.length * 14 + 14;

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, contentWidth, codeBlockHeight, 'F');
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(10);
    doc.text(codeLines, margin + 8, y + 10);
    y += codeBlockHeight + 12;

    // Разделитель
    doc.setDrawColor(238, 238, 238);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Метка "Ответы"
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Ответы:', margin, y);
    y += 16;

    // Перемешиваем варианты ответов
    const shuffledOptions = shuffle(card.options);

    // Находим индекс правильного ответа в перемешанном массиве
    const originalCorrectOption = card.options[card.correctIndex];
    const shuffledCorrectIndex = shuffledOptions.indexOf(originalCorrectOption);

    // Варианты ответов
    doc.setFontSize(11);
    doc.setTextColor(68, 68, 68);
    for (let idx = 0; idx < shuffledOptions.length; idx++) {
      const opt = shuffledOptions[idx];
      const isCorrect = idx === shuffledCorrectIndex;
      const prefix = showHints && isCorrect ? '✓ ' : '  ';
      const langLabel = opt.language === 'plain' ? '' : `${opt.language}: `;
      const optText = `${prefix}${langLabel}${opt.code}`;
      const optLines = doc.splitTextToSize(optText, contentWidth - 20);
      doc.text(optLines, margin + 10, y);
      y += optLines.length * 16 + 5;
    }

    if (showHints) {
      y += 6;
      doc.setFontSize(10);
      doc.setTextColor(42, 122, 42);
      const correctOpt = shuffledOptions[shuffledCorrectIndex];
      const correctLang = correctOpt.language === 'plain' ? '' : `${correctOpt.language}: `;
      doc.text(`✓ Правильный ответ: ${correctLang}${correctOpt.code}`, margin, y);
    }
  }

  /**
   * Рендерит карточку типа 'memory'.
   * @private
   */
  private renderMemoryCard(
    doc: jsPDF,
    card: Card & { kind: 'memory' },
    startY: number,
    contentWidth: number,
    margin: number,
  ): void {
    let y = startY;

    doc.setFontSize(11);
    doc.setTextColor(34, 34, 34);
    const promptLines = doc.splitTextToSize(card.promptKnown, contentWidth);
    doc.text(promptLines, margin, y);
    y += promptLines.length * 16 + 12;

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Пары:', margin, y);
    y += 16;

    doc.setFontSize(11);
    doc.setTextColor(68, 68, 68);
    for (let idx = 0; idx < card.pairs.length; idx++) {
      const pair = card.pairs[idx];
      const text = `${idx + 1}. ${pair.known} ↔ ${pair.learning}`;
      const pairLines = doc.splitTextToSize(text, contentWidth - 20);
      doc.text(pairLines, margin + 10, y);
      y += pairLines.length * 16 + 5;
    }
  }

  /**
   * Рендерит карточку типа 'symbol'.
   * Ответы перемешиваются при экспорте.
   * @private
   */
  private renderSymbolCard(
    doc: jsPDF,
    card: Card & { kind: 'symbol' },
    startY: number,
    showHints: boolean,
    contentWidth: number,
    margin: number,
  ): void {
    let y = startY;

    doc.setFontSize(11);
    doc.setTextColor(34, 34, 34);
    const promptLines = doc.splitTextToSize(card.promptKnown, contentWidth);
    doc.text(promptLines, margin, y);
    y += promptLines.length * 16 + 12;

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Символы:', margin, y);
    y += 16;

    // Перемешиваем варианты ответов
    const shuffledSymbols = shuffle(card.symbols);

    // Находим индекс правильного ответа в перемешанном массиве
    const originalCorrectSymbol = card.symbols[card.correctIndex];
    const shuffledCorrectIndex = shuffledSymbols.indexOf(originalCorrectSymbol);

    doc.setFontSize(11);
    doc.setTextColor(68, 68, 68);
    for (let idx = 0; idx < shuffledSymbols.length; idx++) {
      const sym = shuffledSymbols[idx];
      const isCorrect = idx === shuffledCorrectIndex;
      const prefix = showHints && isCorrect ? '✓ ' : '  ';
      const text = `${prefix}${sym}`;
      const symLines = doc.splitTextToSize(text, contentWidth - 20);
      doc.text(symLines, margin + 10, y);
      y += symLines.length * 16 + 5;
    }

    if (showHints) {
      y += 6;
      doc.setFontSize(10);
      doc.setTextColor(42, 122, 42);
      doc.text(`✓ Правильный ответ: ${shuffledSymbols[shuffledCorrectIndex]}`, margin, y);
    }
  }

  /**
   * Рендерит карточки типов 'sound', 'timed', 'reading'.
   * Ответы перемешиваются при экспорте.
   * @private
   */
  private renderOptionCard(
    doc: jsPDF,
    card: Card & { kind: 'sound' | 'timed' | 'reading' },
    startY: number,
    showHints: boolean,
    contentWidth: number,
    margin: number,
    pageWidth: number,
  ): void {
    let y = startY;

    doc.setFontSize(11);
    doc.setTextColor(34, 34, 34);
    const promptLines = doc.splitTextToSize(card.promptKnown, contentWidth);
    doc.text(promptLines, margin, y);
    y += promptLines.length * 16 + 12;

    const options: readonly string[] =
      'optionsLearning' in card
        ? (card.optionsLearning ?? [])
        : 'optionsKnown' in card
          ? (card.optionsKnown ?? [])
          : [];

    // Разделитель
    doc.setDrawColor(238, 238, 238);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Ответы:', margin, y);
    y += 16;

    // Перемешиваем варианты ответов
    const shuffledOptions = shuffle(options);

    // Находим индекс правильного ответа в перемешанном массиве
    const originalCorrectOption = options[card.correctIndex];
    const shuffledCorrectIndex = shuffledOptions.indexOf(originalCorrectOption);

    doc.setFontSize(11);
    doc.setTextColor(68, 68, 68);
    for (let idx = 0; idx < shuffledOptions.length; idx++) {
      const opt = shuffledOptions[idx];
      const isCorrect = idx === shuffledCorrectIndex;
      const prefix = showHints && isCorrect ? '✓ ' : '  ';
      const text = `${prefix}${opt}`;
      const optLines = doc.splitTextToSize(text, contentWidth - 20);
      doc.text(optLines, margin + 10, y);
      y += optLines.length * 16 + 5;
    }

    if (showHints) {
      y += 6;
      doc.setFontSize(10);
      doc.setTextColor(42, 122, 42);
      const correctText = shuffledOptions[shuffledCorrectIndex];
      if (correctText) {
        doc.text(`✓ Правильный ответ: ${correctText}`, margin, y);
      }
    }
  }

  /**
   * Рендерит карточку типа 'keyboard'.
   * @private
   */
  private renderKeyboardCard(
    doc: jsPDF,
    card: Card & { kind: 'keyboard' },
    startY: number,
    contentWidth: number,
    margin: number,
  ): void {
    let y = startY;

    doc.setFontSize(11);
    doc.setTextColor(34, 34, 34);
    const promptLines = doc.splitTextToSize(card.promptKnown, contentWidth);
    doc.text(promptLines, margin, y);
    y += promptLines.length * 16 + 12;

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Допустимые ответы:', margin, y);
    y += 16;

    const answers = card.acceptedAnswersLearning ?? card.acceptedAnswersKnown ?? [];
    doc.setFontSize(11);
    doc.setTextColor(68, 68, 68);
    for (const ans of answers) {
      const text = `  • ${ans}`;
      const ansLines = doc.splitTextToSize(text, contentWidth - 20);
      doc.text(ansLines, margin + 10, y);
      y += ansLines.length * 16 + 5;
    }
  }

  /**
   * Рендерит карточку типа 'draw'.
   * @private
   */
  private renderDrawCard(
    doc: jsPDF,
    card: Card & { kind: 'draw' },
    startY: number,
    contentWidth: number,
    margin: number,
  ): void {
    let y = startY;

    doc.setFontSize(11);
    doc.setTextColor(34, 34, 34);
    const promptLines = doc.splitTextToSize(card.promptKnown, contentWidth);
    doc.text(promptLines, margin, y);
    y += promptLines.length * 16 + 12;

    doc.setFontSize(11);
    doc.setTextColor(68, 68, 68);
    doc.text(`Подсказка: ${card.referenceHintKnown}`, margin, y);
    if (card.meaningKnown) {
      y += 16;
      doc.text(`Значение: ${card.meaningKnown}`, margin, y);
    }
  }

  /**
   * Рендерит карточку типа 'tone'.
   * Ответы перемешиваются при экспорте.
   * @private
   */
  private renderToneCard(
    doc: jsPDF,
    card: Card & { kind: 'tone' },
    startY: number,
    showHints: boolean,
    contentWidth: number,
    margin: number,
  ): void {
    let y = startY;

    doc.setFontSize(11);
    doc.setTextColor(34, 34, 34);
    const promptLines = doc.splitTextToSize(card.promptKnown, contentWidth);
    doc.text(promptLines, margin, y);
    y += promptLines.length * 16 + 12;

    doc.setFontSize(11);
    doc.setTextColor(68, 68, 68);
    doc.text(`Слог: ${card.syllableBase}`, margin, y);
    y += 16;

    // Перемешиваем варианты ответов
    const shuffledTones = shuffle(card.toneOptions);

    // Находим индекс правильного ответа в перемешанном массиве
    const originalCorrectTone = card.toneOptions[card.correctIndex];
    const shuffledCorrectIndex = shuffledTones.indexOf(originalCorrectTone);

    for (let idx = 0; idx < shuffledTones.length; idx++) {
      const tone = shuffledTones[idx];
      const isCorrect = idx === shuffledCorrectIndex;
      const prefix = showHints && isCorrect ? '✓ ' : '  ';
      const toneStr = String(tone);
      const text = `${prefix}${toneStr}`;
      const toneLines = doc.splitTextToSize(text, contentWidth - 20);
      doc.text(toneLines, margin + 10, y);
      y += toneLines.length * 16 + 5;
    }
  }

  /**
   * Рендерит нижний колонтитул страницы.
   * Содержит только номер страницы.
   *
   * @param doc — jsPDF документ
   * @param pageNum — номер страницы
   * @param currentY — текущая позиция Y
   * @param pageWidth — ширина страницы
   * @param margin — отступ от края
   * @private
   */
  private renderFooter(
    doc: jsPDF,
    pageNum: number,
    currentY: number,
    pageWidth: number,
    margin: number,
  ): void {
    const footerY = currentY + 8;

    // --- Разделитель ---
    doc.setDrawColor(221, 221, 221);
    doc.line(margin, currentY, PAGE_WIDTH - MARGIN, currentY);

    // Номер страницы
    doc.setFontSize(7);
    doc.setTextColor(153, 153, 153);
    doc.text(`— ${pageNum} —`, pageWidth / 2, footerY, { align: 'center' });
  }

  // -------------------------------------------------------------------------
  // Вспомогательные методы
  // -------------------------------------------------------------------------

  /**
   * Загружает TTF-шрифт из assets и возвращает как base64.
   * Результат кэшируется в this.fontData.
   *
   * @returns base64-строка шрифта
   * @private
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
   *
   * @param lessons — уроки курса (отсортированные по order)
   * @param allScenarios — все сценарии
   * @param allCards — все карточки
   * @returns массив CardEntry в порядке курса
   * @private
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
   *
   * Формат Markdown:
   * ```
   * ## Этап 1: Название этапа
   * - Вопрос 1?
   * - Вопрос 2?
   *
   * ## Этап 2: Другой этап
   * - Вопрос 3?
   * ```
   *
   * @param markdown — Markdown-текст из authoring.idea
   * @returns массив этапов с вопросами
   * @private
   */
  private parseIdeaStages(markdown: string): IdeaStage[] {
    const stages: IdeaStage[] = [];
    const lines = markdown.split('\n');
    let currentStage: IdeaStage | null = null;

    for (const line of lines) {
      // Ищем заголовок этапа: "## Этап N: название"
      const stageMatch = line.match(/^##\s+Этап\s+\d+\s*:\s*(.+)/i);
      if (stageMatch) {
        currentStage = { title: stageMatch[1].trim(), questions: [] };
        stages.push(currentStage);
        continue;
      }

      // Ищем вопрос: "- текст?"
      const questionMatch = line.match(/^-\s+(.+)/);
      if (currentStage && questionMatch) {
        const q = questionMatch[1].trim();
        // Добавляем только если вопрос заканчивается на "?"
        if (q.endsWith('?')) {
          currentStage.questions.push(q);
        }
      }
    }

    return stages;
  }
}
