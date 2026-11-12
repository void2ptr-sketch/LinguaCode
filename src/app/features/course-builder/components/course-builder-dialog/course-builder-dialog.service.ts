import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { CourseBuilderDialogComponent } from './course-builder-dialog.component';
import type { CourseBuilderDialogResult } from './course-builder-dialog.types';

/**
 * Service for opening the course builder dialog.
 *
 * @remarks
 * Opens `CourseBuilderDialogComponent` in create or edit mode.
 */
@Injectable({ providedIn: 'root' })
export class CourseBuilderDialogService {
  private readonly dialog = inject(MatDialog);

  /**
   * Opens the course builder in create mode.
   *
   * @returns A promise resolving to the dialog result.
   */
  openCreate(): Promise<CourseBuilderDialogResult | undefined> {
    return this.open('create', '');
  }

  /**
   * Opens the course builder in edit mode for an existing course.
   *
   * @param courseId - The ID of the course to edit.
   * @param options - Extra options. `forceEdit` disables the frontend
   *        read-only fallback so the dialog always opens in edit mode
   *        (backend permissions are still enforced on save).
   * @returns A promise resolving to the dialog result.
   */
  openEdit(
    courseId: string,
    options?: { forceEdit?: boolean },
  ): Promise<CourseBuilderDialogResult | undefined> {
    return this.open('edit', courseId, options?.forceEdit);
  }

  private open(
    mode: 'create' | 'edit',
    courseId: string,
    forceEdit?: boolean,
  ): Promise<CourseBuilderDialogResult | undefined> {
    const ref = this.dialog.open(CourseBuilderDialogComponent, {
      width: '48rem',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { mode, courseId, forceEdit },
      panelClass: 'course-builder-dialog',
    });

    return firstValueFrom(ref.afterClosed());
  }
}
