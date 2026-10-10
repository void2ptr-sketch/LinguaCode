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
   * @returns A promise resolving to the dialog result.
   */
  openEdit(courseId: string): Promise<CourseBuilderDialogResult | undefined> {
    return this.open('edit', courseId);
  }

  private open(
    mode: 'create' | 'edit',
    courseId: string,
  ): Promise<CourseBuilderDialogResult | undefined> {
    const ref = this.dialog.open(CourseBuilderDialogComponent, {
      width: '48rem',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { mode, courseId },
      panelClass: 'course-builder-dialog',
    });

    return firstValueFrom(ref.afterClosed());
  }
}
