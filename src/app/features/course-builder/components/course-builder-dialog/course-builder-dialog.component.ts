import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AppLoggerService } from '../../../../shared/logger/app-logger.service';
import { ContentHierarchyService } from '../../../../entities/content-hierarchy';
import { LanguagePairsApiService } from '../../../../entities/language-pair/api';
import type { LanguagePairDto } from '../../../../entities/language-pair/api';
import { CourseBuilderStore } from '../../services/course-builder.store';
import { CoursePdfExportService } from '../../services/course-pdf-export.service';
import {
  courseToFormDraft,
  emptyCourseFormDraft,
  serializeCourseFormDraft,
} from '../../utils/course-form-draft.utils';
import { CourseFormComponent } from '../course-form/course-form.component';
import type { CourseExportType } from '../course-form/course-form.component';
import type {
  CourseBuilderDialogData,
  CourseBuilderDialogResult,
} from './course-builder-dialog.types';
import type { CourseFormDraft } from '../../types';
import { extractEntitiesFromBundle } from '../../utils/course-bundle-import.utils';
import { validateCourseBundle } from '../../../../entities/course/utils/course-bundle.utils';
import type { CourseBundleTyped } from '../../../../entities/course/utils/course-bundle.types';
import type { Course } from '../../../../entities/course/model';
import { CourseImportDialogService } from '../course-import-dialog/course-import-dialog.service';
import type { ImportPreview } from '../course-import-dialog/course-import-dialog.types';

/**
 * Modal dialog component for creating and editing courses.
 *
 * Provides a full interface for course form management, including PDF export
 * with or without answer hints. Tracks dirty state to detect unsaved changes.
 *
 * @remarks
 * Receives mode and optional courseId via `MAT_DIALOG_DATA` injection.
 * Uses `CourseBuilderStore` for state management and `CoursePdfExportService` for PDF generation.
 * @see CourseBuilderDialogData
 * @see CourseBuilderDialogResult
 */
@Component({
  selector: 'app-course-builder-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule, MatProgressSpinnerModule, CourseFormComponent],
  providers: [ContentHierarchyService],
  templateUrl: './course-builder-dialog.component.html',
  styleUrl: './course-builder-dialog.component.scss',
})
export class CourseBuilderDialogComponent implements OnInit {
  private readonly dialogRef =
    inject<MatDialogRef<CourseBuilderDialogComponent, CourseBuilderDialogResult>>(MatDialogRef);
  private readonly pdfExportService = inject(CoursePdfExportService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly logger = inject(AppLoggerService);
  private readonly languagePairsApi = inject(LanguagePairsApiService);
  private readonly importDialog = inject(CourseImportDialogService);
  readonly data = inject<CourseBuilderDialogData>(MAT_DIALOG_DATA);
  readonly store = inject(CourseBuilderStore);

  /** Available language pairs from the registry. */
  readonly languagePairs = signal<readonly LanguagePairDto[]>([]);

  /**
   * Current course form draft being edited or created.
   *
   * Updated by `CourseFormComponent` through the `draftChange` event.
   */
  readonly draft = signal<CourseFormDraft>(emptyCourseFormDraft());
  /** Internal snapshot of the initial draft for dirty state tracking. */
  private readonly initialSnapshot = signal('');

  /**
   * Whether the draft has unsaved changes compared to the initial snapshot.
   *
   * @remarks
   * Used to prompt users before closing the dialog with unsaved changes.
   */
  readonly dirty = computed(
    () => serializeCourseFormDraft(this.draft()) !== this.initialSnapshot(),
  );

  /**
   * Whether the dialog is editable.
   *
   * @remarks
   * Editable when the store allows editing, or when the dialog was opened
   * with `forceEdit` (content explorer flow). Backend permissions are still
   * enforced on save.
   */
  readonly isEditable = computed(() => !this.store.isReadOnly() || this.data.forceEdit === true);

  /**
   * Dynamic dialog title based on the current mode.
   *
   * @remarks
   * Returns "Новый курс" for create mode, "Просмотр курса" for read-only edit,
   * and "Редактирование курса" for writable edit mode.
   */
  readonly title = computed(() => {
    if (this.data.mode === 'create') {
      return 'Новый курс';
    }

    return this.isEditable() ? 'Редактирование курса' : 'Просмотр курса';
  });

  async ngOnInit(): Promise<void> {
    // Загрузить языковые пары до инициализации формы
    await this.loadLanguagePairs();

    if (this.data.mode === 'create') {
      this.store.startCreate();
      const nextDraft = emptyCourseFormDraft();
      this.draft.set(nextDraft);
      this.initialSnapshot.set(serializeCourseFormDraft(nextDraft));
      return;
    }

    await this.store.startEdit(this.data.courseId);
    const course = this.store.editingCourse();
    if (!course) {
      this.dialogRef.close(undefined);
      return;
    }

    const nextDraft = courseToFormDraft(course);
    this.draft.set(nextDraft);
    this.initialSnapshot.set(serializeCourseFormDraft(nextDraft));
  }

  private async loadLanguagePairs(): Promise<void> {
    try {
      const pairs = await this.languagePairsApi.listAll();
      this.languagePairs.set(pairs);
    } catch {
      this.languagePairs.set([]);
    }
  }

  /**
   * Updates the current draft with the provided form data.
   *
   * Called by `CourseFormComponent` when the user makes changes to the form.
   *
   * @param nextDraft — The updated course form draft.
   */
  updateDraft(nextDraft: CourseFormDraft): void {
    this.draft.set(nextDraft);
  }

  /**
   * Saves the current course — creates a new one or updates an existing one.
   *
   * @remarks
   * In create mode, calls `CourseBuilderStore.createCourse()`.
   * In edit mode, calls `CourseBuilderStore.updateCourse()`.
   * Closes the dialog with `{ saved: true }` on success.
   */
  async saveCourse(): Promise<void> {
    const saved =
      this.data.mode === 'create'
        ? await this.store.createCourse(this.draft())
        : await this.store.updateCourse(this.data.courseId, this.draft());

    if (saved) {
      this.dialogRef.close({ saved: true });
    }
  }

  /**
   * Handles export requests from the course form's Export tab.
   *
   * @param type — The export type: pdf-without-hints, pdf-with-hints, json, or scorm.
   * @remarks
   * PDF and JSON export are implemented; SCORM is a placeholder.
   */
  async onExportRequested(type: CourseExportType): Promise<void> {
    const course = this.store.editingCourse();
    if (!course) {
      this.snackBar.open('Курс не загружен', 'Закрыть', { duration: 3000 });
      return;
    }

    // ── PDF export ──
    if (type === 'pdf-without-hints' || type === 'pdf-with-hints') {
      const withHints = type === 'pdf-with-hints';
      try {
        const blob = await this.pdfExportService.export(course, withHints);
        this.downloadBlob(blob, `${course.id}${withHints ? '.hints' : ''}.pdf`);
        this.snackBar.open('PDF успешно выгружен', 'Закрыть', { duration: 3000 });
      } catch (err) {
        this.logger.error('PDF export failed', err);
        this.snackBar.open('Ошибка при выгрузке PDF', 'Закрыть', { duration: 5000 });
      }
      return;
    }

    // ── JSON export ──
    if (type === 'json') {
      try {
        const json = await this.store.exportCourseBundle(course.id);
        if (!json) {
          const err = this.store.exportError();
          this.snackBar.open(err || 'Ошибка при экспорте курса', 'Закрыть', { duration: 5000 });
          return;
        }
        const blob = new Blob([json], { type: 'application/json' });
        this.downloadBlob(blob, `${course.id}-bundle.json`);
        this.snackBar.open('JSON пакет успешно выгружен', 'Закрыть', { duration: 3000 });
      } catch (err) {
        this.logger.error('JSON export failed', err);
        this.snackBar.open('Ошибка при выгрузке JSON', 'Закрыть', { duration: 5000 });
      }
      return;
    }

    // ── SCORM — placeholder ──
    this.snackBar.open('SCORM / xAPI — в разработке', 'Закрыть', { duration: 3000 });
  }

  /**
   * Handles import requests from the course form's Import section.
   *
   * @param file — The JSON file selected by the user.
   */
  async onImportRequested(file: File): Promise<void> {
    const text = await file.text();
    const preview = await this.parseBundlePreview(text, file.size);
    if (!preview) {
      this.snackBar.open('Не удалось прочитать пакет', 'Закрыть', { duration: 3000 });
      return;
    }

    const confirmed = await this.importDialog.open(preview);
    if (!confirmed) return;

    const success = await this.store.importCourseBundle(text);
    if (success) {
      this.snackBar.open('Курс успешно импортирован', 'Закрыть', { duration: 3000 });
      await this.store.loadList();
      this.dialogRef.close();
    } else {
      const err = this.store.exportError();
      this.snackBar.open(err || 'Ошибка при импорте', 'Закрыть', { duration: 5000 });
    }
  }

  /**
   * Parses a bundle JSON string and returns a preview for the confirmation dialog.
   *
   * @param json — The JSON string of the bundle.
   * @param fileSize — File size in bytes (for warning about localStorage limits).
   * @returns Preview data, or `null` if parsing/validation fails.
   * @private
   */
  private async parseBundlePreview(json: string, fileSize?: number): Promise<ImportPreview | null> {
    try {
      const parsed = JSON.parse(json) as CourseBundleTyped;
      const validation = validateCourseBundle(parsed);
      if (!validation.valid) return null;

      const extracted = extractEntitiesFromBundle(parsed);
      if (!extracted) return null;

      const course = Object.values(extracted.courses)[0] as Course;
      return {
        courseTitle: course.title,
        programCount: Object.keys(extracted.programs).length,
        lessonCount: Object.keys(extracted.lessons).length,
        scenarioCount: Object.keys(extracted.scenarios).length,
        cardCount: Object.keys(extracted.cards).length,
        fileSize,
      };
    } catch {
      return null;
    }
  }

  /**
   * Closes the dialog without saving.
   *
   * @remarks
   * Returns `undefined` to indicate no changes were saved.
   */
  close(): void {
    this.dialogRef.close(undefined);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
