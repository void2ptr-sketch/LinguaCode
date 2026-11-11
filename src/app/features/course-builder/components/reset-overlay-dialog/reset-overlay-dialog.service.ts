import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import {
  ResetOverlayDialogComponent,
  ResetOverlayDialogData,
  ResetOverlayDialogResult,
} from './reset-overlay-dialog.component';

/**
 * Service to open the reset overlay confirmation dialog.
 *
 * @remarks
 * Used in the course builder page to allow users to clear their
 * localStorage overlay and revert to seed-only data.
 */
@Injectable({ providedIn: 'root' })
export class ResetOverlayDialogService {
  private readonly dialog = inject(MatDialog);

  /**
   * Opens the reset overlay confirmation dialog.
   *
   * @param data - The dialog data (number of items to be removed).
   * @returns Observable that emits when the dialog is closed.
   */
  open(data: ResetOverlayDialogData): ReturnType<typeof this.dialog.open<ResetOverlayDialogComponent, ResetOverlayDialogData, ResetOverlayDialogResult>> {
    return this.dialog.open(ResetOverlayDialogComponent, {
      minWidth: '400px',
      data,
    });
  }
}
