import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

// Key is documented in entities/user/overlay/user-content-overlay.types.ts
const USER_CONTENT_OVERLAY_KEY = 'lingua-code.user-content.v1';

/**
 * Dialog data for the reset overlay confirmation.
 */
export type ResetOverlayDialogData = {
  /** Number of items that will be removed from the overlay. */
  itemCount: number;
};

/**
 * Result of the reset overlay dialog.
 */
export type ResetOverlayDialogResult = {
  /** `true` if the user confirmed the reset. */
  reset: boolean;
};

/**
 * Confirmation dialog to clear the user-content overlay from localStorage.
 *
 * @remarks
 * Shows the number of items that will be removed and asks for confirmation.
 * On confirm, clears the overlay key and triggers a page reload to reinitialize
 * with seed data only.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reset-overlay-dialog',
  imports: [MatButtonModule, MatDialogModule],
  standalone: true,
  templateUrl: './reset-overlay-dialog.html',
  styleUrl: './reset-overlay-dialog.scss',
})
export class ResetOverlayDialogComponent {
  readonly data = inject<ResetOverlayDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject<MatDialogRef<ResetOverlayDialogComponent, ResetOverlayDialogResult>>(
    MatDialogRef,
  );
  private readonly snackBar = inject(MatSnackBar);

  /**
   * Handles the confirm button click.
   * Clears the overlay from localStorage and closes the dialog.
   */
  onConfirm(): void {
    localStorage.removeItem(USER_CONTENT_OVERLAY_KEY);
    this.dialogRef.close({ reset: true });
    this.snackBar.open('Пользовательские данные сброшены. Страница перезагрузится.', 'Закрыть', {
      duration: 4000,
    });
  }

  /**
   * Handles the cancel button click.
   * Closes the dialog without changes.
   */
  onCancel(): void {
    this.dialogRef.close({ reset: false });
  }
}
