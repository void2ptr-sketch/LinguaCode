/**
 * Хранилище (store) для конструктора курсов.
 * Управляет состоянием списка курсов, редактором курсов и операциями экспорта.
 * Использует Angular signals для реактивного управления состоянием.
 *
 * Основные сценарии использования:
 * - Отображение списка курсов с пагинацией, поиском и фильтрацией
 * - Создание и редактирование курсов через диалоговое окно
 * - Удаление курсов (только собственных)
 * - Экспорт курса в JSON (CourseBundle) для передачи maintainer'у
 * - Экспорт курса в PDF с оглавлением
 */
import { Injectable, computed, inject, signal } from '@angular/core';

import { activeLanguagePairCriteria } from '../../../core/data/language-pair/language-pair-scope.utils';
import { normalizeLanguagePair } from '../../../core/data/language-pair/language-pair.utils';
import { CourseSearchService } from '../../../core/data';
import type { CourseIndexEntry, CourseListScope, CourseWithLessons } from '../../../core/models';
import { sanitizeMarkdownText, sanitizePlainText } from '../../../core/security';
import {
  COURSE_IDEA_MAX_LENGTH,
} from '../../../core/data/courses/course-authoring.utils';
import { UserStore } from '../../../core/state';
import { isEditableContentAuthor } from '../../../core/data/user/system-author.constants';
import { DEFAULT_PAGE_SIZE } from '../../../shared/pagination';
import type { CourseFormDraft, CourseEditorMode } from '../types';
import { formDraftToCourseWritePayload } from '../utils/course-form-draft.utils';
import { collectCourseBundle } from '../../../core/data/courses/course-bundle.utils';
import { loadCourseCatalogFromStorage } from '../../../core/data/courses/courses-storage';
import { loadScenariosFromStorage } from '../../../core/data/scenarios/scenarios-storage';
import { CardRepository } from '../../../core/data/cards/card.repository';
import { loadCardIndexMetaOverrides } from '../../../core/data/cards/card-index-meta.storage';
import { CoursePdfExportService } from './course-pdf-export.service';

/** Санитайзер заголовка курса: макс. 128 символов, очистка от HTML */
const sanitizeTitle = (value: string): string => sanitizePlainText(value, 128);
/** Санитайзер описания курса: макс. 512 символов, очистка от HTML */
const sanitizeDescription = (value: string): string => sanitizePlainText(value, 512);
/** Санитайзер авторской идеи курса: макс. COURSE_IDEA_MAX_LENGTH символов, очистка Markdown */
const sanitizeCourseIdea = (value: string): string =>
  sanitizeMarkdownText(value, COURSE_IDEA_MAX_LENGTH);

/**
 * Хранилище для конструктора курсов.
 *
 * Отвечает за:
 * - Загрузку и отображение списка курсов (пагинация, поиск, фильтрация)
 * - Управление редактором курсов (создание, редактирование, отмена)
 * - CRUD-операции над курсами (создание, обновление, удаление)
 * - Экспорт курса в JSON (CourseBundle) и PDF
 *
 * Состояние управляется через Angular signals:
 * - indexItems — список курсов для отображения
 * - editingCourse — курс, редактируемый в данный момент
 * - editorMode — режим редактора ('list' | 'create' | 'edit')
 */
@Injectable({ providedIn: 'root' })
export class CourseBuilderStore {
  /** Сервис для HTTP-запросов к API курсов */
  private readonly courseSearchService = inject(CourseSearchService);
  /** Хранилище пользователя (текущий язык, ID пользователя) */
  private readonly userStore = inject(UserStore);
  /** Репозиторий карточек для загрузки из localStorage */
  private readonly cardRepository = inject(CardRepository);
  /** Сервис для экспорта курса в PDF */
  private readonly pdfExport = inject(CoursePdfExportService);

  // -------------------------------------------------------------------------
  // Signals: состояние списка курсов
  // -------------------------------------------------------------------------

  /** Список курсов, отображаемых на странице (текущая страница) */
  readonly indexItems = signal<readonly CourseIndexEntry[]>([]);
  /** Общее количество курсов (для пагинации) */
  readonly totalItems = signal(0);
  /** Текущая страница (0-based) */
  readonly pageIndex = signal(0);
  /** Размер страницы (кол-во элементов) */
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  /** Текст поискового запроса */
  readonly listQuery = signal('');
  /** Фильтр области видимости ('mine' | 'published' | 'all') */
  readonly listScope = signal<CourseListScope>('mine');

  // -------------------------------------------------------------------------
  // Signals: состояние редактора
  // -------------------------------------------------------------------------

  /** Индикатор загрузки списка курсов */
  readonly loading = signal(false);
  /** Индикатор загрузки редактора (загрузка курса для редактирования) */
  readonly editorLoading = signal(false);
  /** Сообщение об ошибке (или null) */
  readonly error = signal<string | null>(null);
  /** Сообщение об ошибке экспорта (или null) */
  readonly exportError = signal<string | null>(null);
  /** Текущий режим редактора */
  readonly editorMode = signal<CourseEditorMode>('list');
  /** ID курса, который редактируется (null если не редактируем) */
  readonly editingCourseId = signal<string | null>(null);
  /** Данные редактируемого курса с уроками */
  readonly editingCourse = signal<CourseWithLessons | null>(null);

  /**
   * Вычисляемый сигнал: true если текущий пользователь не может редактировать курс.
   * Курс считается редактируемым только если пользователь — автор или системный автор.
   */
  readonly isReadOnly = computed(() => {
    const course = this.editingCourse();
    if (!course) {
      return false;
    }

    return !isEditableContentAuthor(course.authorId, this.userStore.user().id);
  });

  // -------------------------------------------------------------------------
  // Методы: загрузка списка
  // -------------------------------------------------------------------------

  /**
   * Загружает список курсов с учётом текущих фильтров и пагинации.
   * Запрос идёт к API через CourseSearchService.
   */
  async loadList(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const pair = this.userStore.languagePair();
      const page = await this.courseSearchService.search({
        query: this.listQuery().trim() || undefined,
        scope: this.listScope(),
        ...activeLanguagePairCriteria(pair),
        page: { page: this.pageIndex(), pageSize: this.pageSize() },
      });

      this.indexItems.set(page.items);
      this.totalItems.set(page.totalItems);
    } catch {
      this.error.set('Не удалось загрузить список курсов');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Загружает список курсов (алиас для loadList).
   * Вызывается при инициализации компонента.
   */
  async load(): Promise<void> {
    await this.loadList();
  }

  /**
   * Устанавливает поисковый запрос и сбрасывает на первую страницу.
   * @param query — текст поиска
   */
  setListQuery(query: string): void {
    this.listQuery.set(query);
    this.pageIndex.set(0);
  }

  /**
   * Устанавливает область видимости и сбрасывает на первую страницу.
   * @param scope — 'mine' | 'published' | 'all'
   */
  setListScope(scope: CourseListScope): void {
    this.listScope.set(scope);
    this.pageIndex.set(0);
  }

  /**
   * Устанавливает параметры пагинации.
   * @param pageIndex — номер страницы (0-based)
   * @param pageSize — размер страницы
   */
  setPage(pageIndex: number, pageSize: number): void {
    this.pageIndex.set(pageIndex);
    this.pageSize.set(pageSize);
  }

  // -------------------------------------------------------------------------
  // Методы: управление редактором
  // -------------------------------------------------------------------------

  /**
   * Переключает редактор в режим создания нового курса.
   * Сбрасывает состояние редактирования.
   */
  startCreate(): void {
    this.editorMode.set('create');
    this.editingCourseId.set(null);
    this.editingCourse.set(null);
    this.error.set(null);
  }

  /**
   * Загружает курс для редактирования и переключает редактор в режим 'edit'.
   * @param courseId — ID курса для редактирования
   */
  async startEdit(courseId: string): Promise<void> {
    this.editorLoading.set(true);
    this.error.set(null);

    try {
      const course = await this.courseSearchService.getById(courseId);
      this.editorMode.set('edit');
      this.editingCourseId.set(courseId);
      this.editingCourse.set(course);
    } catch {
      this.error.set('Не удалось загрузить курс');
    } finally {
      this.editorLoading.set(false);
    }
  }

  /**
   * Отменяет редактирование и возвращает в режим списка.
   * Сбрасывает все состояния редактора.
   */
  cancelEdit(): void {
    this.editorMode.set('list');
    this.editingCourseId.set(null);
    this.editingCourse.set(null);
    this.error.set(null);
  }

  // -------------------------------------------------------------------------
  // Методы: CRUD
  // -------------------------------------------------------------------------

  /**
   * Создаёт новый курс на основе черновика (draft).
   * Валидирует данные, санитайзит, отправляет на сервер.
   * @param draft — черновик курса
   * @returns true если успешно, false если ошибка валидации
   */
  async createCourse(draft: CourseFormDraft): Promise<boolean> {
    const payload = this.normalizeDraft(draft);
    if (!payload) {
      return false;
    }

    try {
      await this.courseSearchService.create({
        ...payload,
        languagePair: this.userStore.languagePair(),
      });
      this.cancelEdit();
      await this.loadList();
      return true;
    } catch {
      this.error.set('Не удалось создать курс');
      return false;
    }
  }

  /**
   * Обновляет существующий курс на основе черновика (draft).
   * Проверяет права доступа (только автор может редактировать).
   * @param courseId — ID курса
   * @param draft — черновик курса
   * @returns true если успешно, false если ошибка валидации или прав
   */
  async updateCourse(courseId: string, draft: CourseFormDraft): Promise<boolean> {
    if (this.isReadOnly()) {
      this.error.set('Нельзя изменять чужой курс');
      return false;
    }

    const payload = this.normalizeDraft(draft);
    if (!payload) {
      return false;
    }

    const current = this.editingCourse();

    try {
      await this.courseSearchService.update(courseId, {
        ...payload,
        languagePair: normalizeLanguagePair(current?.languagePair ?? this.userStore.languagePair()),
      });
      this.cancelEdit();
      await this.loadList();
      return true;
    } catch {
      this.error.set('Не удалось сохранить курс');
      return false;
    }
  }

  /**
   * Удаляет курс.
   * Проверяет права доступа (только автор может удалять).
   * Если удаляется курс, который сейчас редактируется — отменяет редактирование.
   * @param courseId — ID курса для удаления
   */
  async deleteCourse(courseId: string): Promise<void> {
    const item = this.indexItems().find((course) => course.id === courseId);
    if (item && !isEditableContentAuthor(item.authorId, this.userStore.user().id)) {
      this.error.set('Нельзя удалять чужой курс');
      return;
    }

    try {
      await this.courseSearchService.delete(courseId);
      if (this.editingCourseId() === courseId) {
        this.cancelEdit();
      }
      await this.loadList();
    } catch {
      this.error.set('Не удалось удалить курс');
    }
  }

  // -------------------------------------------------------------------------
  // Методы: экспорт
  // -------------------------------------------------------------------------

  /**
   * Экспортирует курс в самодостаточный CourseBundle-файл (JSON).
   * Собирает все данные: курс, уроки, сценарии, карточки, мета-данные.
   *
   * Используется для передачи курса maintainer'у для добавления в общий каталог.
   *
   * @param courseId — ID курса для экспорта
   * @returns JSON-строка для скачивания или null с описанием ошибки
   */
  async exportCourseBundle(courseId: string): Promise<string | null> {
    this.exportError.set(null);

    const item = this.indexItems().find((course) => course.id === courseId);
    if (item && !isEditableContentAuthor(item.authorId, this.userStore.user().id)) {
      this.exportError.set('Нельзя экспортировать чужой курс');
      return null;
    }

    try {
      const catalog = loadCourseCatalogFromStorage();
      const scenarios = loadScenariosFromStorage();
      const cards = this.cardRepository.loadStored();
      const cardIndexMeta = loadCardIndexMetaOverrides();

      const result = collectCourseBundle(courseId, catalog, scenarios, cards, cardIndexMeta);

      if (!result) {
        this.exportError.set('Не удалось собрать пакет: курс не найден');
        return null;
      }

      if (result.errors.length > 0) {
        this.exportError.set(result.errors.join('\n'));
        return null;
      }

      return JSON.stringify(result.bundle, null, 2);
    } catch {
      this.exportError.set('Ошибка при экспорте курса');
      return null;
    }
  }

  /**
   * Экспортирует курс в PDF с оглавлением.
   * Генерирует PDF с титульной страницей (оглавление) и страницами для каждой карточки.
   *
   * @param courseId — ID курса для экспорта
   * @param showHints — если true, показывает правильные ответы (✓)
   * @returns true при успехе, false при ошибке
   */
  async exportPdf(courseId: string, showHints: boolean): Promise<boolean> {
    this.exportError.set(null);

    const item = this.indexItems().find((course) => course.id === courseId);
    if (item && !isEditableContentAuthor(item.authorId, this.userStore.user().id)) {
      this.exportError.set('Нельзя экспортировать чужой курс');
      return false;
    }

    try {
      const course = await this.courseSearchService.getById(courseId);
      const blob = await this.pdfExport.export(course, showHints);
      this.downloadBlob(blob, `${courseId}.pdf`);
      return true;
    } catch {
      this.exportError.set('Ошибка при экспорте в PDF');
      return false;
    }
  }

  /**
   * Скачивает Blob-файл в браузер.
   * Создаёт временную ссылку, имитирует клик, затем очищает.
   *
   * @param blob — данные для скачивания
   * @param filename — имя файла
   * @private
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  // -------------------------------------------------------------------------
  // Вспомогательные методы
  // -------------------------------------------------------------------------

  /**
   * Нормализует и валидирует черновик курса.
   * Санитайзит все поля, проверяет обязательные данные.
   *
   * @param draft — черновик курса от пользователя
   * @returns объект для отправки на сервер или null если валидация не пройдена
   * @private
   */
  private normalizeDraft(draft: CourseFormDraft) {
    const title = sanitizeTitle(draft.title);
    const description = sanitizeDescription(draft.description);
    const lessons = draft.lessons
      .map((lesson, index) => ({
        ...lesson,
        title: sanitizeTitle(lesson.title),
        description: sanitizeDescription(lesson.description),
        scenarioIds: lesson.scenarioIds.map((id) => sanitizePlainText(id, 64)).filter(Boolean),
        prerequisiteLessonIds: lesson.prerequisiteLessonIds
          .map((id) => sanitizePlainText(id, 64))
          .filter(Boolean),
        order: lesson.order ?? index,
      }))
      .filter((lesson) => lesson.title);

    if (!title) {
      this.error.set('Укажите название курса');
      return null;
    }

    if (lessons.length === 0) {
      this.error.set('Добавьте хотя бы один урок');
      return null;
    }

    for (const lesson of lessons) {
      if (lesson.scenarioIds.length === 0) {
        this.error.set(`Урок «${lesson.title}»: добавьте хотя бы один сценарий`);
        return null;
      }
    }

    return formDraftToCourseWritePayload({
      title,
      description,
      published: draft.published,
      authoring: {
        ...draft.authoring,
        idea: sanitizeCourseIdea(draft.authoring.idea),
      },
      lessons,
    });
  }
}
