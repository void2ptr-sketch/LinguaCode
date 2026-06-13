import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CardKind } from '../../../../core/models';
import {
  CARD_KIND_LABELS,
  CardCatalogFiltersComponent,
  CardCatalogSearchStore,
  CONTENT_LANGUAGE_LABELS,
  DIFFICULTY_LABELS,
} from '../../../../shared/card-catalog-search';
import { UiPaginationComponent } from '../../../../shared/pagination';
import { CardEditorStore } from '../../services/card-editor.store';
import { CARD_KINDS, CardDraft } from '../../types';
import { CardFormComponent } from '../card-form/card-form.component';

@Component({
  selector: 'app-card-editor-page',
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    UiPaginationComponent,
    CardCatalogFiltersComponent,
    CardFormComponent,
  ],
  providers: [CardCatalogSearchStore],
  templateUrl: './card-editor-page.component.html',
  styleUrl: './card-editor-page.component.scss',
})
export class CardEditorPageComponent implements OnInit {
  readonly store = inject(CardEditorStore);
  readonly catalogStore = inject(CardCatalogSearchStore);

  readonly cardKinds = CARD_KINDS;
  readonly kindLabels = CARD_KIND_LABELS;
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;
  readonly difficultyLabels = DIFFICULTY_LABELS;

  readonly draft = signal<CardDraft>(this.store.emptyDraft('select'));

  async ngOnInit(): Promise<void> {
    await this.catalogStore.init();
  }

  startCreate(kind: CardKind): void {
    this.store.startCreate(kind);
    this.draft.set(this.store.emptyDraft(kind));
  }

  async startEdit(cardId: string): Promise<void> {
    await this.store.startEdit(cardId);

    const editing = this.store.editingCard();
    if (editing) {
      this.draft.set(this.store.cardToDraft(editing));
    }
  }

  cancelEdit(): void {
    this.store.cancelEdit();
    this.draft.set(this.store.emptyDraft('select'));
  }

  async saveCard(): Promise<void> {
    let saved = false;

    if (this.store.editorMode() === 'create') {
      saved = await this.store.createCard(this.draft());
    } else {
      const cardId = this.store.editingCardId();
      if (cardId) {
        saved = await this.store.updateCard(cardId, this.draft());
      }
    }

    if (saved) {
      this.draft.set(this.store.emptyDraft('select'));
      await this.catalogStore.init();
    }
  }

  async deleteCard(cardId: string): Promise<void> {
    if (await this.store.deleteCard(cardId)) {
      await this.catalogStore.init();
    }
  }

  updateDraft(nextDraft: CardDraft): void {
    this.draft.set(nextDraft);
  }
}
