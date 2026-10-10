import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { CardTryDialogComponent } from './card-try-dialog.component';
import type { CardTryDialogData } from './card-try-dialog.types';

/**
 * Service for opening the card preview (try) dialog.
 *
 * @remarks
 * Allows users to preview a card in practice mode. Ensures only one dialog instance is active.
 */
@Injectable({ providedIn: 'root' })
export class CardTryDialogService {
  private readonly dialog = inject(MatDialog);

  private activeRef: MatDialogRef<CardTryDialogComponent, void> | null = null;

  /**
   * Opens the card preview dialog for a given card.
   *
   * @param cardId - The ID of the card to preview.
   * @returns A promise that resolves when the dialog closes.
   */
  open(cardId: string): Promise<void> {
    if (this.activeRef) {
      return Promise.resolve();
    }

    const data: CardTryDialogData = { cardId };

    this.activeRef = this.dialog.open(CardTryDialogComponent, {
      data,
      panelClass: 'card-try-dialog',
      width: '720px',
      maxWidth: '96vw',
      maxHeight: '90vh',
      autoFocus: 'first-titled-element',
    });

    return firstValueFrom(this.activeRef.afterClosed()).finally(() => {
      this.activeRef = null;
    });
  }
}
