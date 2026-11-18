import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { CourseImportDialogComponent } from './course-import-dialog.component';
import type { ImportConfirmResult, ImportPreview } from './course-import-dialog.types';

/**
 * Service for opening the course import confirmation dialog.
 *
 * @remarks
 * Shows a preview of the bundle contents and waits for user confirmation
 * before proceeding with the import.
 */
@Injectable({ providedIn: 'root' })
export class CourseImportDialogService {
  private readonly dialog = inject(MatDialog);

  /**
   * Opens the import confirmation dialog.
   *
   * @param preview — Preview data about the bundle to import.
   * @returns Observable that emits the result if confirmed, or `undefined` if cancelled.
   */
  open(preview: ImportPreview): Promise<ImportConfirmResult | undefined> {
    return new Promise<ImportConfirmResult | undefined>((resolve) => {
      const ref: MatDialogRef<CourseImportDialogComponent, ImportConfirmResult | undefined> =
        this.dialog.open(CourseImportDialogComponent, {
          data: preview,
          maxWidth: '400px',
          width: '90vw',
        });

      ref.afterClosed().subscribe((result) => resolve(result));
    });
  }
}
