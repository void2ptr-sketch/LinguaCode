import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CardKind } from '../../../../core/models';
import { CardEditorStore } from '../../services/card-editor.store';
import { CARD_KIND_LABELS, CARD_KINDS, CardDraft } from '../../types';
import { cardSummary } from '../../utils/card-draft.utils';
import { CardFormComponent } from '../card-form/card-form.component';

@Component({
  selector: 'app-card-editor-page',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    CardFormComponent,
  ],
  templateUrl: './card-editor-page.component.html',
  styleUrl: './card-editor-page.component.scss',
})
export class CardEditorPageComponent implements OnInit {
  readonly store = inject(CardEditorStore);

  readonly cardKinds = CARD_KINDS;
  readonly kindLabels = CARD_KIND_LABELS;
  readonly cardSummary = cardSummary;

  readonly draft = signal<CardDraft>(this.store.emptyDraft('select'));

  async ngOnInit(): Promise<void> {
    await this.store.load();
  }

  startCreate(kind: CardKind): void {
    this.store.startCreate(kind);
    this.draft.set(this.store.emptyDraft(kind));
  }

  startEdit(cardId: string): void {
    this.store.startEdit(cardId);

    const editing = this.store.editingCard();
    if (editing) {
      this.draft.set(this.store.cardToDraft(editing));
    }
  }

  cancelEdit(): void {
    this.store.cancelEdit();
    this.draft.set(this.store.emptyDraft('select'));
  }

  saveCard(): void {
    if (this.store.editorMode() === 'create') {
      if (this.store.createCard(this.draft())) {
        this.draft.set(this.store.emptyDraft('select'));
      }
      return;
    }

    const cardId = this.store.editingCardId();
    if (cardId && this.store.updateCard(cardId, this.draft())) {
      this.draft.set(this.store.emptyDraft('select'));
    }
  }

  deleteCard(cardId: string): void {
    this.store.deleteCard(cardId);
  }

  updateDraft(nextDraft: CardDraft): void {
    this.draft.set(nextDraft);
  }
}
