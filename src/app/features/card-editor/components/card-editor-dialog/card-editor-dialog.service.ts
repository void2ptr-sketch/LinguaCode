import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import type { CardKind } from '../../../../core/models';

import { CardEditorDialogComponent } from './card-editor-dialog.component';
import type { CardEditorDialogData, CardEditorDialogResult } from './card-editor-dialog.types';

@Injectable({ providedIn: 'root' })
export class CardEditorDialogService {
  private readonly dialog = inject(MatDialog);

  private activeRef: MatDialogRef<CardEditorDialogComponent, CardEditorDialogResult> | null = null;

  openCreate(kind: CardKind): Promise<CardEditorDialogResult | undefined> {
    return this.open({ mode: 'create', kind });
  }

  openEdit(cardId: string): Promise<CardEditorDialogResult | undefined> {
    return this.open({ mode: 'edit', cardId });
  }

  private open(data: CardEditorDialogData): Promise<CardEditorDialogResult | undefined> {
    if (this.activeRef) {
      return Promise.resolve(undefined);
    }

    this.activeRef = this.dialog.open(CardEditorDialogComponent, {
      data,
      panelClass: 'card-editor-dialog',
      width: '960px',
      maxWidth: '96vw',
      maxHeight: '90vh',
      disableClose: true,
      autoFocus: 'first-titled-element',
    });

    return firstValueFrom(this.activeRef.afterClosed()).finally(() => {
      this.activeRef = null;
    });
  }
}
