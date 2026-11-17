import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { LessonBuilderDialogComponent } from './lesson-builder-dialog.component';
import type {
  LessonBuilderDialogData,
  LessonBuilderDialogResult,
} from './lesson-builder-dialog.types';

/**
 * Service for opening the lesson builder dialog.
 *
 * @remarks
 * Ensures only one dialog instance is active at a time. Opens
 * `LessonBuilderDialogComponent` in create or edit mode. The dialog should
 * only be opened through this service (page-level orchestration).
 */
@Injectable({ providedIn: 'root' })
export class LessonBuilderDialogService {
  private readonly dialog = inject(MatDialog);

  private activeRef: MatDialogRef<LessonBuilderDialogComponent, LessonBuilderDialogResult> | null =
    null;

  /**
   * Opens the lesson builder in create mode for a given program.
   *
   * @param programId - The ID of the parent program for the new lesson.
   * @returns A promise resolving to the dialog result, or `undefined` if another dialog is already open.
   */
  openCreate(programId?: string): Promise<LessonBuilderDialogResult | undefined> {
    return this.open({ mode: 'create', programId });
  }

  /**
   * Opens the lesson builder in edit mode for an existing lesson.
   *
   * @param lessonId - The ID of the lesson to edit.
   * @returns A promise resolving to the dialog result, or `undefined` if another dialog is already open.
   */
  openEdit(lessonId: string): Promise<LessonBuilderDialogResult | undefined> {
    return this.open({ mode: 'edit', lessonId });
  }

  private open(data: LessonBuilderDialogData): Promise<LessonBuilderDialogResult | undefined> {
    if (this.activeRef) {
      return Promise.resolve(undefined);
    }

    this.activeRef = this.dialog.open(LessonBuilderDialogComponent, {
      data,
      width: '48rem',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      autoFocus: 'first-titled-element',
      panelClass: 'lessons-builder-dialog',
    });

    return firstValueFrom(this.activeRef.afterClosed()).finally(() => {
      this.activeRef = null;
    });
  }
}
