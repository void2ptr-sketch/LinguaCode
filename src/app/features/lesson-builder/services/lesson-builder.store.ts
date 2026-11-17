/**
 * Store for the lesson builder feature.
 *
 * @remarks
 * Manages the lesson editor state used by the lesson builder dialog:
 * loading a lesson for editing, creating and updating lessons, and
 * validating drafts. Uses Angular signals for reactive state.
 *
 * Scenario composition (`scenarioIds`) is NOT editable in the dialog — it is
 * preserved as-is on update and managed elsewhere (scenario/course builders).
 */
import { Injectable, computed, inject, signal } from '@angular/core';

import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { CourseSearchService } from '../../../entities/course';
import { LessonsApiService } from '../../../entities/lesson/api/lessons-api.service';
import { ProgramsApiService } from '../../../entities/program/api/programs-api.service';
import type { Lesson } from '../../../entities/course/model/lesson.types';
import { AuthStore } from '../../../entities/auth/services/auth.store';
import { isEditableContentAuthor } from '../../../entities/user/lib/system-author.constants';
import type { LessonFormDraft } from '../types';
import {
  formDraftToLessonCreatePayload,
  formDraftToLessonUpdatePayload,
  validateLessonFormDraft,
} from '../utils';

/**
 * Store for the lesson builder feature.
 *
 * Responsibilities:
 * - Loading a lesson for editing (`startEdit`)
 * - Creating lessons within a program (`createLesson`)
 * - Updating existing lessons (`updateLesson`)
 * - Draft validation and read-only access checks
 */
@Injectable({ providedIn: 'root' })
export class LessonBuilderStore {
  /** API service for lesson data access */
  private readonly lessonsApi = inject(LessonsApiService);
  /** API service for resolving the parent program of a lesson */
  private readonly programsApi = inject(ProgramsApiService);
  /** Service for resolving the parent course author (for read-only checks) */
  private readonly courseSearch = inject(CourseSearchService);
  /** Auth store (authenticated user ID, roles) */
  private readonly authStore = inject(AuthStore);
  /** Central logging service */
  private readonly logger = inject(AppLoggerService);

  // -------------------------------------------------------------------------
  // Signals: editor state
  // -------------------------------------------------------------------------

  /** Loading indicator (loading a lesson for editing) */
  readonly editorLoading = signal(false);
  /** Loading indicator for save operations */
  readonly saving = signal(false);
  /** Error message (or null) */
  readonly error = signal<string | null>(null);
  /** Data of the lesson being edited (null in create mode) */
  readonly editingLesson = signal<Lesson | null>(null);
  /** Author ID of the parent course (for read-only checks); null when unknown */
  readonly editingLessonAuthorId = signal<string | null>(null);
  /** Lessons of the parent program available as prerequisite candidates */
  readonly candidateLessons = signal<readonly Lesson[]>([]);
  /** Program ID context provided in create mode (fallback for drafts without programId) */
  private readonly createProgramId = signal('');

  /**
   * Computed signal: `true` if the current user cannot edit the lesson.
   *
   * @remarks
   * Lessons do not carry their own `authorId` — editability is inherited from
   * the parent course author (lesson → program → course). A lesson is editable
   * only if the user is the course author or a system author. Unknown
   * authorship keeps the form editable (the backend enforces the final
   * decision).
   */
  readonly isReadOnly = computed(() => {
    const authorId = this.editingLessonAuthorId();
    if (!authorId) {
      return false;
    }

    const user = this.authStore.user();
    if (!user) {
      return true;
    }

    return !isEditableContentAuthor(authorId, user.id, user.roles);
  });

  // -------------------------------------------------------------------------
  // Methods: editor management
  // -------------------------------------------------------------------------

  /**
   * Switches the editor to create mode for a new lesson.
   *
   * @remarks
   * Synchronous (mirrors `ProgramBuilderStore.startCreate`): prerequisite
   * candidates are loaded separately via {@link loadCandidateLessons}.
   *
   * @param programId - Optional parent program ID context.
   */
  startCreate(programId?: string): void {
    this.createProgramId.set(programId ?? '');
    this.editingLesson.set(null);
    this.editingLessonAuthorId.set(null);
    this.error.set(null);
    this.candidateLessons.set([]);
  }

  /**
   * Loads a lesson (and its parent course author) for editing.
   *
   * @param lessonId - The lesson ID to edit.
   */
  async startEdit(lessonId: string): Promise<void> {
    this.editorLoading.set(true);
    this.error.set(null);
    this.candidateLessons.set([]);

    try {
      const lesson = await this.lessonsApi.getById(lessonId);
      this.editingLesson.set(lesson);
      await this.loadCandidateLessons(lesson.programId, lesson.id);

      // Lessons inherit editability from the parent course author
      // (lesson → program → course).
      try {
        const program = await this.programsApi.getById(lesson.programId);
        const course = await this.courseSearch.getById(program.courseId);
        this.editingLessonAuthorId.set(course.authorId);
      } catch (authorError) {
        this.logger.error('LessonBuilder: failed to load parent course author', authorError);
        this.editingLessonAuthorId.set(null);
      }
    } catch (error) {
      this.logger.error('LessonBuilder: failed to load lesson for edit', error);
      this.error.set('Не удалось загрузить урок');
    } finally {
      this.editorLoading.set(false);
    }
  }

  // -------------------------------------------------------------------------
  // Methods: CRUD
  // -------------------------------------------------------------------------

  /**
   * Creates a new lesson within a program from a draft.
   *
   * @remarks
   * Requires a program context (`draft.programId` or the `programId` passed to
   * `startCreate`).
   *
   * @param draft - The lesson draft.
   * @returns `true` if successful, `false` if there is a validation error.
   */
  async createLesson(draft: LessonFormDraft): Promise<boolean> {
    const programId = draft.programId || this.createProgramId();
    if (!programId) {
      this.error.set('Не указан трек для создания урока');
      return false;
    }

    const validationError = validateLessonFormDraft(draft);
    if (validationError) {
      this.error.set(validationError);
      return false;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      await this.lessonsApi.create(formDraftToLessonCreatePayload({ ...draft, programId }));
      return true;
    } catch (error) {
      this.logger.error('LessonBuilder: failed to create lesson', error);
      this.error.set('Не удалось создать урок');
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Updates an existing lesson from a draft.
   *
   * @remarks
   * Checks access rights (only the course author can edit). Scenario
   * composition is managed elsewhere and is not touched here (`programId` is
   * immutable on update per the lessons API contract).
   *
   * @param lessonId - The lesson ID.
   * @param draft - The lesson draft.
   * @returns `true` if successful, `false` if there is a validation or access error.
   */
  async updateLesson(lessonId: string, draft: LessonFormDraft): Promise<boolean> {
    if (this.isReadOnly()) {
      this.error.set('Нельзя изменять чужой урок');
      return false;
    }

    const validationError = validateLessonFormDraft(draft);
    if (validationError) {
      this.error.set(validationError);
      return false;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      await this.lessonsApi.update(lessonId, formDraftToLessonUpdatePayload(draft));
      return true;
    } catch (error) {
      this.logger.error('LessonBuilder: failed to update lesson', error);
      this.error.set('Не удалось сохранить урок');
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  // -------------------------------------------------------------------------
  // Methods: helpers
  // -------------------------------------------------------------------------

  /**
   * Loads lessons of the parent program as prerequisite candidates.
   *
   * @remarks
   * Public: the dialog calls it fire-and-forget after a synchronous
   * `startCreate`, and `startEdit` awaits it internally.
   *
   * @param programId - The parent program ID.
   * @param excludeLessonId - Lesson ID to exclude (the edited lesson itself).
   */
  async loadCandidateLessons(programId: string, excludeLessonId?: string): Promise<void> {
    try {
      const lessons = await this.lessonsApi.getByProgramId(programId);
      this.candidateLessons.set(lessons.filter((lesson) => lesson.id !== excludeLessonId));
    } catch (error) {
      this.logger.error('LessonBuilder: failed to load prerequisite candidates', error);
      this.candidateLessons.set([]);
    }
  }
}
