import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import type { CardKind } from '../../../../core/models';

import { CardEditorDialogComponent } from './card-editor-dialog.component';
import type { CardEditorDialogData, CardEditorDialogResult } from './card-editor-dialog.types';

/**
 * Service for opening the card editor dialog.
 *
 * @remarks
 * Ensures only one dialog instance is active at a time. Opens `CardEditorDialogComponent`
 * in create or edit mode.
 */
@Injectable({ providedIn: 'root' })
export class CardEditorDialogService {
  private readonly dialog = inject(MatDialog);

  private activeRef: MatDialogRef<CardEditorDialogComponent, CardEditorDialogResult> | null = null;

  /**
   * Opens the card editor in create mode for a new card.
   *
   * @param kind - The kind of card to create.
   * @returns A promise resolving to the dialog result, or `undefined` if another dialog is already open.
   */
  openCreate(kind: CardKind): Promise<CardEditorDialogResult | undefined> {
    return this.open({ mode: 'create', kind });
  }

  /**
   * Opens the card editor in edit mode for an existing card.
   *
   * @param cardId - The ID of the card to edit.
   * @returns A promise resolving to the dialog result, or `undefined` if another dialog is already open.
   */
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
      maxHeight: '75vh',
      disableClose: true,
      autoFocus: 'first-titled-element',
    });

    return firstValueFrom(this.activeRef.afterClosed()).finally(() => {
      this.activeRef = null;
    });
  }
}
