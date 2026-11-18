import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import type { ImportConfirmResult, ImportPreview } from './course-import-dialog.types';

/**
 * Confirmation dialog shown before importing a CourseBundle.
 *
 * Displays a preview of the bundle contents (course title, entity counts)
 * and warns about potential collisions with existing overlay data.
 */
@Component({
  selector: 'app-course-import-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './course-import-dialog.component.html',
  styleUrl: './course-import-dialog.component.scss',
})
export class CourseImportDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<CourseImportDialogComponent, ImportConfirmResult>>(
    MatDialogRef,
  );
  readonly data = inject<ImportPreview>(MAT_DIALOG_DATA);

  /** Warning message for large bundles approaching localStorage limits. */
  get fileSizeWarning(): string | null {
    const bytes = this.data.fileSize ?? 0;
    // localStorage limit is ~5MB; warn at 3MB
    if (bytes > 3 * 1024 * 1024) {
      const mb = (bytes / (1024 * 1024)).toFixed(1);
      return `Размер файла ${mb} МБ. При большом количестве карточек пакет может превысить лимит localStorage (~5 МБ).`;
    }
    return null;
  }

  /** Confirms the import and closes the dialog with the result. */
  onConfirm(): void {
    this.dialogRef.close({ confirmed: true, bundleJson: '' } as ImportConfirmResult);
  }

  /** Cancels the import and closes the dialog without a result. */
  onCancel(): void {
    this.dialogRef.close();
  }
}
