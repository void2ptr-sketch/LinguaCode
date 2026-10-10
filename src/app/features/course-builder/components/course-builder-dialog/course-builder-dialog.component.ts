import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CourseBuilderStore } from '../../services/course-builder.store';
import { CoursePdfExportService } from '../../services/course-pdf-export.service';
import {
  courseToFormDraft,
  emptyCourseFormDraft,
  serializeCourseFormDraft,
} from '../../utils/course-form-draft.utils';
import { CourseFormComponent } from '../course-form/course-form.component';
import type {
  CourseBuilderDialogData,
  CourseBuilderDialogResult,
} from './course-builder-dialog.types';
import type { CourseFormDraft } from '../../types';

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
  imports: [MatButtonModule, MatDialogModule, MatProgressSpinnerModule, CourseFormComponent],
  templateUrl: './course-builder-dialog.component.html',
  styleUrl: './course-builder-dialog.component.scss',
})
export class CourseBuilderDialogComponent implements OnInit {
  private readonly dialogRef =
    inject<MatDialogRef<CourseBuilderDialogComponent, CourseBuilderDialogResult>>(MatDialogRef);
  private readonly pdfExportService = inject(CoursePdfExportService);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<CourseBuilderDialogData>(MAT_DIALOG_DATA);
  readonly store = inject(CourseBuilderStore);

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

    return this.store.isReadOnly() ? 'Просмотр курса' : 'Редактирование курса';
  });

  async ngOnInit(): Promise<void> {
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
   * Exports the current course to a PDF file.
   *
   * @param withHints — If `true`, includes correct answers marked with ✓.
   * @remarks
   * Downloads the generated PDF as a file. Shows a snackbar notification
   * on success or error. Requires a course to be loaded in the store.
   */
  async exportPdf(withHints: boolean): Promise<void> {
    const course = this.store.editingCourse();
    if (!course) {
      this.snackBar.open('Курс не загружен', 'Закрыть', { duration: 3000 });
      return;
    }

    try {
      const blob = await this.pdfExportService.export(course, withHints);
      this.downloadBlob(blob, `${course.id}${withHints ? '.hints' : ''}.pdf`);
      this.snackBar.open('PDF успешно выгружен', 'Закрыть', { duration: 3000 });
    } catch (err) {
      console.error('[PDF Export]', err);
      this.snackBar.open('Ошибка при выгрузке PDF', 'Закрыть', { duration: 5000 });
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
