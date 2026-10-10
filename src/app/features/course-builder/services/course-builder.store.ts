/**
 * Store for the course builder feature.
 *
 * @remarks
 * Manages course list state (pagination, search, filtering), course editor state,
 * and export operations (JSON bundle and PDF). Uses Angular signals for reactive state.
 *
 * Key use cases:
 * - Displaying the course list with pagination, search, and filtering
 * - Creating and editing courses via dialog
 * - Deleting courses (only own courses)
 * - Exporting a course to JSON (CourseBundle) for maintainer submission
 * - Exporting a course to PDF with table of contents
 */
import { Injectable, computed, inject, signal } from '@angular/core';

import { activeLanguagePairCriteria } from '../../../core/domain/language-pair/language-pair-scope.utils';
import { normalizeLanguagePair } from '../../../core/domain/language-pair/language-pair.utils';
import { CourseSearchService } from '../../../core/repositories';
import type { CourseIndexEntry, CourseListScope, CourseWithLessons } from '../../../core/models';
import { sanitizeMarkdownText, sanitizePlainText } from '../../../core/security';
import { COURSE_IDEA_MAX_LENGTH } from '../../../core/repositories/courses/utils/course-authoring.utils';
import { UserStore } from '../../../core/state';
import { isEditableContentAuthor } from '../../../core/domain/user/system-author.constants';
import { DEFAULT_PAGE_SIZE } from '../../../shared/utils/pagination';
import type { CourseFormDraft, CourseEditorMode } from '../types';
import { formDraftToCourseWritePayload } from '../utils/course-form-draft.utils';
import { collectCourseBundle } from '../../../core/repositories/courses/utils/course-bundle.utils';
import { loadCourseCatalogFromStorage } from '../../../core/repositories/courses/storage/courses-storage';
import { loadScenariosFromStorage } from '../../../core/repositories/scenarios/storage/scenarios-storage';
import { CardRepository } from '../../../core/repositories/cards/repository/card.repository';
import { loadCardIndexMetaOverrides } from '../../../core/repositories/cards/storage/card-index-meta.storage';
import { CoursePdfExportService } from './course-pdf-export.service';

/** Sanitizer for course title: max 128 characters, HTML cleaned */
const sanitizeTitle = (value: string): string => sanitizePlainText(value, 128);
/** Sanitizer for course description: max 512 characters, HTML cleaned */
const sanitizeDescription = (value: string): string => sanitizePlainText(value, 512);
/** Sanitizer for course authoring idea: max COURSE_IDEA_MAX_LENGTH characters, Markdown cleaned */
const sanitizeCourseIdea = (value: string): string =>
  sanitizeMarkdownText(value, COURSE_IDEA_MAX_LENGTH);

/**
 * Store for the course builder feature.
 *
 * Responsibilities:
 * - Loading and displaying the course list (pagination, search, filtering)
 * - Managing the course editor (create, edit, cancel)
 * - CRUD operations on courses (create, update, delete)
 * - Exporting courses to JSON (CourseBundle) and PDF
 *
 * State is managed via Angular signals:
 * - indexItems — courses to display
 * - editingCourse — course currently being edited
 * - editorMode — editor mode ('list' | 'create' | 'edit')
 */
@Injectable({ providedIn: 'root' })
export class CourseBuilderStore {
  /** Service for HTTP requests to the courses API */
  private readonly courseSearchService = inject(CourseSearchService);
  /** User store (current language pair, user ID) */
  private readonly userStore = inject(UserStore);
  /** Card repository for loading from localStorage */
  private readonly cardRepository = inject(CardRepository);
  /** Service for exporting courses to PDF */
  private readonly pdfExport = inject(CoursePdfExportService);

  // -------------------------------------------------------------------------
  // Signals: course list state
  // -------------------------------------------------------------------------

  /** Courses displayed on the current page */
  readonly indexItems = signal<readonly CourseIndexEntry[]>([]);
  /** Total number of courses (for pagination) */
  readonly totalItems = signal(0);
  /** Current page (0-based) */
  readonly pageIndex = signal(0);
  /** Page size (number of items) */
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  /** Search query text */
  readonly listQuery = signal('');
  /** Scope filter ('mine' | 'published' | 'all') */
  readonly listScope = signal<CourseListScope>('mine');

  // -------------------------------------------------------------------------
  // Signals: editor state
  // -------------------------------------------------------------------------

  /** Loading indicator for the course list */
  readonly loading = signal(false);
  /** Loading indicator for the editor (loading a course for editing) */
  readonly editorLoading = signal(false);
  /** Error message (or null) */
  readonly error = signal<string | null>(null);
  /** Export error message (or null) */
  readonly exportError = signal<string | null>(null);
  /** Current editor mode */
  readonly editorMode = signal<CourseEditorMode>('list');
  /** ID of the course being edited (null when not editing) */
  readonly editingCourseId = signal<string | null>(null);
  /** Data of the course being edited, including lessons */
  readonly editingCourse = signal<CourseWithLessons | null>(null);

  /**
   * Computed signal: `true` if the current user cannot edit the course.
   *
   * @remarks
   * A course is editable only if the user is the author or a system author.
   */
  readonly isReadOnly = computed(() => {
    const course = this.editingCourse();
    if (!course) {
      return false;
    }

    return !isEditableContentAuthor(course.authorId, this.userStore.user().id);
  });

  // -------------------------------------------------------------------------
  // Methods: list loading
  // -------------------------------------------------------------------------

  /**
   * Loads the course list considering current filters and pagination.
   *
   * @remarks
   * Requests data from the API via CourseSearchService.
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
   * Loads the course list (alias for loadList).
   *
   * @remarks
   * Called during component initialization.
   */
  async load(): Promise<void> {
    await this.loadList();
  }

  /**
   * Sets the search query and resets to the first page.
   *
   * @param query - The search query text.
   */
  setListQuery(query: string): void {
    this.listQuery.set(query);
    this.pageIndex.set(0);
  }

  /**
   * Sets the scope filter and resets to the first page.
   *
   * @param scope - The scope ('mine', 'published', or 'all').
   */
  setListScope(scope: CourseListScope): void {
    this.listScope.set(scope);
    this.pageIndex.set(0);
  }

  /**
   * Sets pagination parameters.
   *
   * @param pageIndex - The page number (0-based).
   * @param pageSize - The page size.
   */
  setPage(pageIndex: number, pageSize: number): void {
    this.pageIndex.set(pageIndex);
    this.pageSize.set(pageSize);
  }

  // -------------------------------------------------------------------------
  // Methods: editor management
  // -------------------------------------------------------------------------

  /**
   * Switches the editor to create mode for a new course.
   *
   * @remarks
   * Resets the editing state.
   */
  startCreate(): void {
    this.editorMode.set('create');
    this.editingCourseId.set(null);
    this.editingCourse.set(null);
    this.error.set(null);
  }

  /**
   * Loads a course for editing and switches the editor to 'edit' mode.
   *
   * @param courseId - The course ID to edit.
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
   * Cancels editing and returns to list view.
   *
   * @remarks
   * Resets all editor states.
   */
  cancelEdit(): void {
    this.editorMode.set('list');
    this.editingCourseId.set(null);
    this.editingCourse.set(null);
    this.error.set(null);
  }

  // -------------------------------------------------------------------------
  // Methods: CRUD
  // -------------------------------------------------------------------------

  /**
   * Creates a new course from a draft.
   *
   * @remarks
   * Validates data, sanitizes fields, and sends to the server.
   *
   * @param draft - The course draft.
   * @returns `true` if successful, `false` if there is a validation error.
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
   * Updates an existing course from a draft.
   *
   * @remarks
   * Checks access rights (only the author can edit).
   *
   * @param courseId - The course ID.
   * @param draft - The course draft.
   * @returns `true` if successful, `false` if there is a validation or access error.
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
   * Deletes a course.
   *
   * @remarks
   * Checks access rights (only the author can delete). If the deleted course is currently
   * being edited, cancels the editing state.
   *
   * @param courseId - The course ID to delete.
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
  // Methods: export
  // -------------------------------------------------------------------------

  /**
   * Exports a course to a self-contained CourseBundle file (JSON).
   *
   * @remarks
   * Collects all data: course, lessons, scenarios, cards, and metadata.
   * Used for transferring the course to a maintainer for inclusion in the public catalog.
   *
   * @param courseId - The course ID to export.
   * @returns A JSON string for download, or `null` with an error description.
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
   * Exports a course to PDF with a table of contents.
   *
   * @remarks
   * Generates a PDF with a title page (TOC) and pages for each card.
   *
   * @param courseId - The course ID to export.
   * @param showHints - If `true`, shows correct answers (✓).
   * @returns `true` on success, `false` on error.
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
   * Downloads a Blob file in the browser.
   *
   * @remarks
   * Creates a temporary URL, simulates a click, then cleans up.
   *
   * @param blob - The data to download.
   * @param filename - The file name.
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
  // Helper methods
  // -------------------------------------------------------------------------

  /**
   * Normalizes and validates a course draft.
   *
   * @remarks
   * Sanitizes all fields and checks for required data.
   *
   * @param draft - The user-provided course draft.
   * @returns An object for sending to the server, or `null` if validation fails.
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
