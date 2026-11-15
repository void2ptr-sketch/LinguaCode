import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';

import { CardEditorDiscardDialogComponent } from '../../../../shared/ui/dialogs';
import { AppLoggerService } from '../../../../shared/logger/app-logger.service';
import { LanguagePairsApiService } from '../../../../entities/language-pair/api';
import type { LanguagePairDto } from '../../../../entities/language-pair/api';
import { CourseSearchService } from '../../../../entities/course';
import type { CourseIndexEntry } from '../../../../entities/course/model';
import { ProgramsApiService } from '../../../../entities/program/api';
import type { ProgramWithLessons } from '../../../../entities/program/model';
import { LessonBuilderStore } from '../../services/lesson-builder.store';
import {
  emptyLessonFormDraft,
  lessonToFormDraft,
  serializeLessonFormDraft,
} from '../../utils/lesson-form-draft.utils';
import { LessonFormComponent } from '../lesson-form/lesson-form.component';
import type {
  LessonBuilderDialogData,
  LessonBuilderDialogResult,
} from './lesson-builder-dialog.types';
import type { LessonFormDraft } from '../../types';

/**
 * Modal dialog component for creating and editing lessons.
 *
 * Tracks dirty state to detect unsaved changes and prompts for confirmation
 * before closing with unsaved edits.
 *
 * @remarks
 * Receives mode and optional `lessonId`/`programId` via `MAT_DIALOG_DATA`
 * injection. Uses `LessonBuilderStore` for state management.
 * @see LessonBuilderDialogData
 * @see LessonBuilderDialogResult
 */
@Component({
  selector: 'app-lesson-builder-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule, MatProgressSpinnerModule, LessonFormComponent],
  templateUrl: './lesson-builder-dialog.component.html',
  styleUrl: './lesson-builder-dialog.component.scss',
})
export class LessonBuilderDialogComponent implements OnInit {
  private readonly dialogRef =
    inject<MatDialogRef<LessonBuilderDialogComponent, LessonBuilderDialogResult>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  readonly data = inject<LessonBuilderDialogData>(MAT_DIALOG_DATA);
  readonly store = inject(LessonBuilderStore);
  private readonly languagePairsApi = inject(LanguagePairsApiService);
  private readonly courseSearch = inject(CourseSearchService);
  private readonly programsApi = inject(ProgramsApiService);
  private readonly logger = inject(AppLoggerService);

  /**
   * Current lesson form draft being edited or created.
   *
   * Updated by `LessonFormComponent` through the `draftChange` event.
   */
  readonly draft = signal<LessonFormDraft>(emptyLessonFormDraft());
  /** Internal snapshot of the initial draft for dirty state tracking. */
  private readonly initialSnapshot = signal('');

  /**
   * Whether the draft has unsaved changes compared to the initial snapshot.
   *
   * @remarks
   * Used to prompt users before closing the dialog with unsaved changes.
   */
  readonly dirty = computed(
    () => serializeLessonFormDraft(this.draft()) !== this.initialSnapshot(),
  );

  /**
   * Dynamic dialog title based on the current mode.
   *
   * @remarks
   * Returns "Новый урок" for create mode, "Просмотр урока" for read-only
   * edit, and "Редактирование урока" for writable edit mode.
   */
  readonly title = computed(() => {
    if (this.data.mode === 'create') {
      return 'Новый урок';
    }

    return this.store.isReadOnly() ? 'Просмотр урока' : 'Редактирование урока';
  });

  /** Available language pairs from the registry. */
  readonly languagePairs = signal<readonly LanguagePairDto[]>([]);
  /** Available courses for the course selector. */
  readonly courses = signal<readonly CourseIndexEntry[]>([]);
  /** Available programs for the program selector. */
  readonly programs = signal<readonly ProgramWithLessons[]>([]);

  async ngOnInit(): Promise<void> {
    // Загрузить языковые пары, курсы и программы до инициализации формы
    await this.loadLanguagePairs();
    await this.loadCourses();

    if (this.data.mode === 'create') {
      this.store.startCreate(this.data.programId);

      // Загрузить программу и унаследовать languagePairId + courseId
      if (this.data.programId) {
        try {
          const program = await this.programsApi.getById(this.data.programId);
          this.programs.set([program]);

          const nextDraft = emptyLessonFormDraft(this.data.programId);
          nextDraft.languagePairId = program.languagePairId;
          nextDraft.courseId = program.courseId;
          this.draft.set(nextDraft);
          this.initialSnapshot.set(serializeLessonFormDraft(nextDraft));
        } catch {
          this.logger.error('LessonBuilderDialog: failed to load program for inheritance', new Error());
          const nextDraft = emptyLessonFormDraft(this.data.programId);
          this.draft.set(nextDraft);
          this.initialSnapshot.set(serializeLessonFormDraft(nextDraft));
        }
      } else {
        const nextDraft = emptyLessonFormDraft();
        this.draft.set(nextDraft);
        this.initialSnapshot.set(serializeLessonFormDraft(nextDraft));
      }

      // Prerequisite candidates are loaded separately so that the draft is
      // initialized synchronously (mirrors `ProgramBuilderDialogComponent`).
      if (this.data.programId) {
        void this.store.loadCandidateLessons(this.data.programId).then(() => {
          const lessons = this.store.candidateLessons();
          const nextOrder = lessons.length > 0
            ? Math.max(...lessons.map((l) => l.order)) + 1
            : 1;
          this.draft.update((d) => ({ ...d, order: nextOrder }));
        });
      }
      return;
    }

    await this.store.startEdit(this.data.lessonId ?? '');
    const lesson = this.store.editingLesson();
    if (!lesson) {
      this.dialogRef.close(undefined);
      return;
    }

    // Load programs for the lesson's course (to populate the program selector)
    if (lesson.programId) {
      try {
        const program = await this.programsApi.getById(lesson.programId);
        this.programs.set([program]);
      } catch {
        this.programs.set([]);
      }
    }

    const nextDraft = lessonToFormDraft(lesson);
    this.draft.set(nextDraft);
    this.initialSnapshot.set(serializeLessonFormDraft(nextDraft));
  }

  private async loadLanguagePairs(): Promise<void> {
    try {
      const pairs = await this.languagePairsApi.listAll();
      this.languagePairs.set(pairs);
    } catch {
      this.languagePairs.set([]);
    }
  }

  private async loadCourses(): Promise<void> {
    try {
      const page = await this.courseSearch.search({
        scope: 'all',
        page: { page: 0, pageSize: 100 },
      });
      this.courses.set(page.items);
    } catch {
      this.courses.set([]);
    }
  }

  /**
   * Updates the current draft with the provided form data.
   *
   * Called by `LessonFormComponent` when the user makes changes to the form.
   *
   * @param nextDraft — The updated lesson form draft.
   */
  updateDraft(nextDraft: LessonFormDraft): void {
    this.draft.set(nextDraft);
  }

  /**
   * Saves the current lesson — creates a new one or updates an existing one.
   *
   * @remarks
   * In create mode, calls `LessonBuilderStore.createLesson()`.
   * In edit mode, calls `LessonBuilderStore.updateLesson()`.
   * Closes the dialog with `{ saved: true }` on success.
   */
  async saveLesson(): Promise<void> {
    const saved =
      this.data.mode === 'create'
        ? await this.store.createLesson(this.draft())
        : await this.store.updateLesson(this.data.lessonId ?? '', this.draft());

    if (saved) {
      this.dialogRef.close({ saved: true });
    }
  }

  /**
   * Cancels the current edit and closes the dialog.
   *
   * @remarks
   * Prompts for confirmation if the draft has unsaved changes.
   * Closes the dialog with `{ saved: false }` on confirmation.
   */
  async cancel(): Promise<void> {
    if (!(await this.confirmClose())) {
      return;
    }

    this.dialogRef.close({ saved: false });
  }

  private async confirmClose(): Promise<boolean> {
    if (!this.dirty()) {
      return true;
    }

    const ref = this.dialog.open(CardEditorDiscardDialogComponent, {
      width: 'min(24rem, 96vw)',
      autoFocus: 'first-titled-element',
    });

    return (await firstValueFrom(ref.afterClosed())) === true;
  }
}
