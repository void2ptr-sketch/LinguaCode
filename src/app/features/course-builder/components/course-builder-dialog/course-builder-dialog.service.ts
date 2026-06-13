import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { CourseBuilderDialogComponent } from './course-builder-dialog.component';
import type { CourseBuilderDialogResult } from './course-builder-dialog.types';

@Injectable({ providedIn: 'root' })
export class CourseBuilderDialogService {
  private readonly dialog = inject(MatDialog);

  openCreate(): Promise<CourseBuilderDialogResult | undefined> {
    return this.open('create', '');
  }

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
