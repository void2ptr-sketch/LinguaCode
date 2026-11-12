/**
 * Store for the program builder feature.
 *
 * @remarks
 * Manages the program editor state used by the program builder dialog:
 * loading a program for editing, creating and updating programs, and
 * validating drafts. Uses Angular signals for reactive state.
 *
 * Lesson composition (`lessonIds`) is NOT editable in the dialog — it is
 * preserved as-is on update, mirroring the programs API contract.
 */
import { Injectable, computed, inject, signal } from '@angular/core';

import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { CourseSearchService } from '../../../entities/course';
import { ProgramsApiService } from '../../../entities/program/api/programs-api.service';
import type { Program } from '../../../entities/program/model/program.types';
import { AuthStore } from '../../../entities/auth/services/auth.store';
import { isEditableContentAuthor } from '../../../entities/user/lib/system-author.constants';
import type { ProgramFormDraft } from '../types';
import {
  formDraftToProgramCreatePayload,
  formDraftToProgramUpdatePayload,
  validateProgramFormDraft,
} from '../utils';

/**
 * Store for the program builder feature.
 *
 * Responsibilities:
 * - Loading a program for editing (`startEdit`)
 * - Creating programs within a course (`createProgram`)
 * - Updating existing programs (`updateProgram`)
 * - Draft validation and read-only access checks
 */
@Injectable({ providedIn: 'root' })
export class ProgramBuilderStore {
  /** API service for program data access */
  private readonly programsApi = inject(ProgramsApiService);
  /** Service for resolving slug course IDs to numeric backend IDs */
  private readonly courseSearch = inject(CourseSearchService);
  /** Auth store (authenticated user ID, roles) */
  private readonly authStore = inject(AuthStore);
  /** Central logging service */
  private readonly logger = inject(AppLoggerService);

  // -------------------------------------------------------------------------
  // Signals: editor state
  // -------------------------------------------------------------------------

  /** Loading indicator (loading a program for editing) */
  readonly editorLoading = signal(false);
  /** Loading indicator for save operations */
  readonly saving = signal(false);
  /** Error message (or null) */
  readonly error = signal<string | null>(null);
  /** Data of the program being edited (null in create mode) */
  readonly editingProgram = signal<Program | null>(null);
  /** Author ID of the parent course (for read-only checks); null when unknown */
  readonly editingProgramAuthorId = signal<string | null>(null);
  /** Course ID context provided in create mode (fallback for drafts without courseId) */
  private readonly createCourseId = signal('');

  /**
   * Computed signal: `true` if the current user cannot edit the program.
   *
   * @remarks
   * Programs do not carry their own `authorId` — editability is inherited from
   * the parent course author. A program is editable only if the user is the
   * course author or a system author. Unknown authorship keeps the form
   * editable (the backend enforces the final decision).
   */
  readonly isReadOnly = computed(() => {
    const authorId = this.editingProgramAuthorId();
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
   * Switches the editor to create mode for a new program.
   *
   * @param courseId - Optional parent course ID context.
   */
  startCreate(courseId?: string): void {
    this.createCourseId.set(courseId ?? '');
    this.editingProgram.set(null);
    this.editingProgramAuthorId.set(null);
    this.error.set(null);
  }

  /**
   * Loads a program (and its parent course author) for editing.
   *
   * @param programId - The program ID to edit.
   */
  async startEdit(programId: string): Promise<void> {
    this.editorLoading.set(true);
    this.error.set(null);

    try {
      const program = await this.programsApi.getById(programId);
      this.editingProgram.set(program);

      // Programs inherit editability from the parent course author.
      try {
        const course = await this.courseSearch.getById(program.courseId);
        this.editingProgramAuthorId.set(course.authorId);
      } catch (authorError) {
        this.logger.error('ProgramBuilder: failed to load parent course author', authorError);
        this.editingProgramAuthorId.set(null);
      }
    } catch (error) {
      this.logger.error('ProgramBuilder: failed to load program for edit', error);
      this.error.set('Не удалось загрузить программу');
    } finally {
      this.editorLoading.set(false);
    }
  }

  // -------------------------------------------------------------------------
  // Methods: CRUD
  // -------------------------------------------------------------------------

  /**
   * Creates a new program within a course from a draft.
   *
   * @remarks
   * Requires a course context (`draft.courseId` or the `courseId` passed to
   * `startCreate`). Slug course IDs are resolved to the numeric form required
   * by the real backend via `CourseSearchService.resolveCourseIdForWrite`.
   *
   * @param draft - The program draft.
   * @returns `true` if successful, `false` if there is a validation error.
   */
  async createProgram(draft: ProgramFormDraft): Promise<boolean> {
    const courseId = draft.courseId || this.createCourseId();
    if (!courseId) {
      this.error.set('Не указан курс для создания программы');
      return false;
    }

    const validationError = validateProgramFormDraft(draft);
    if (validationError) {
      this.error.set(validationError);
      return false;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const resolvedCourseId = await this.courseSearch.resolveCourseIdForWrite(courseId);
      await this.programsApi.create(formDraftToProgramCreatePayload({ ...draft, courseId: resolvedCourseId }));
      return true;
    } catch (error) {
      this.logger.error('ProgramBuilder: failed to create program', error);
      this.error.set('Не удалось создать программу');
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Updates an existing program from a draft.
   *
   * @remarks
   * Checks access rights (only the course author can edit). Lesson
   * composition is preserved as-is from the loaded program.
   *
   * @param programId - The program ID.
   * @param draft - The program draft.
   * @returns `true` if successful, `false` if there is a validation or access error.
   */
  async updateProgram(programId: string, draft: ProgramFormDraft): Promise<boolean> {
    if (this.isReadOnly()) {
      this.error.set('Нельзя изменять чужую программу');
      return false;
    }

    const validationError = validateProgramFormDraft(draft);
    if (validationError) {
      this.error.set(validationError);
      return false;
    }

    this.saving.set(true);
    this.error.set(null);

    try {
      const lessonIds = [...(this.editingProgram()?.lessonIds ?? [])];
      await this.programsApi.update(programId, formDraftToProgramUpdatePayload(draft, lessonIds));
      return true;
    } catch (error) {
      this.logger.error('ProgramBuilder: failed to update program', error);
      this.error.set('Не удалось сохранить программу');
      return false;
    } finally {
      this.saving.set(false);
    }
  }
}
