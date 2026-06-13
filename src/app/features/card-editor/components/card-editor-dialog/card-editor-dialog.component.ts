import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';

import { CARD_KIND_LABELS } from '../../../../shared/card-catalog-search';
import { CardEditorStore } from '../../services/card-editor.store';
import type { CardDraft } from '../../types';
import { CardFormComponent } from '../card-form/card-form.component';
import { CardEditorDiscardDialogComponent } from './card-editor-discard-dialog.component';
import type { CardEditorDialogData, CardEditorDialogResult } from './card-editor-dialog.types';

function serializeDraft(draft: CardDraft): string {
  return JSON.stringify(draft);
}

@Component({
  selector: 'app-card-editor-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    CardFormComponent,
  ],
  templateUrl: './card-editor-dialog.component.html',
  styleUrl: './card-editor-dialog.component.scss',
})
export class CardEditorDialogComponent implements OnInit {
  private readonly dialogRef =
    inject<MatDialogRef<CardEditorDialogComponent, CardEditorDialogResult>>(MatDialogRef);
  private readonly dialog = inject(MatDialog);
  readonly data = inject<CardEditorDialogData>(MAT_DIALOG_DATA);
  readonly store = inject(CardEditorStore);

  readonly kindLabels = CARD_KIND_LABELS;
  readonly draft = signal<CardDraft>(this.store.emptyDraft('select'));
  private readonly initialSnapshot = signal('');

  readonly dirty = computed(
    () => serializeDraft(this.draft()) !== this.initialSnapshot(),
  );

  readonly title = computed(() => {
    if (this.data.mode === 'create') {
      return `Новая карточка · ${this.kindLabels[this.data.kind]}`;
    }

    return `Редактирование · ${this.kindLabels[this.draft().kind]}`;
  });

  async ngOnInit(): Promise<void> {
    if (this.data.mode === 'create') {
      this.store.startCreate(this.data.kind);
      const nextDraft = this.store.emptyDraft(this.data.kind);
      this.draft.set(nextDraft);
      this.initialSnapshot.set(serializeDraft(nextDraft));
      return;
    }

    await this.store.startEdit(this.data.cardId);
    const editing = this.store.editingCard();

    if (!editing) {
      this.dialogRef.close(undefined);
      return;
    }

    const nextDraft = this.store.cardToDraft(editing);
    this.draft.set(nextDraft);
    this.initialSnapshot.set(serializeDraft(nextDraft));
  }

  updateDraft(nextDraft: CardDraft): void {
    this.draft.set(nextDraft);
  }

  async saveCard(): Promise<void> {
    let saved = false;

    if (this.data.mode === 'create') {
      saved = await this.store.createCard(this.draft());
    } else {
      saved = await this.store.updateCard(this.data.cardId, this.draft());
    }

    if (saved) {
      this.dialogRef.close({ saved: true });
    }
  }

  async cancel(): Promise<void> {
    if (!(await this.confirmClose())) {
      return;
    }

    this.store.cancelEdit();
    this.dialogRef.close({ saved: false });
  }

  private async confirmClose(): Promise<boolean> {
    if (!this.dirty()) {
      return true;
    }

    const ref = this.dialog.open(CardEditorDiscardDialogComponent, {
      width: 'min(24rem, 96vw)',
      autoFocus: 'first-titled-element',
    });

    return (await firstValueFrom(ref.afterClosed())) === true;
  }
}
