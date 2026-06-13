import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { CardTryDialogComponent } from './card-try-dialog.component';
import type { CardTryDialogData } from './card-try-dialog.types';

@Injectable({ providedIn: 'root' })
export class CardTryDialogService {
  private readonly dialog = inject(MatDialog);

  private activeRef: MatDialogRef<CardTryDialogComponent, void> | null = null;

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
