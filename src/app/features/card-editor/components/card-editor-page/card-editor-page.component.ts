import { DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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
import { CardEditorDialogService } from '../card-editor-dialog/card-editor-dialog.service';
import { CardEditorStore } from '../../services/card-editor.store';
import { CARD_KINDS } from '../../types';

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
  ],
  providers: [CardCatalogSearchStore],
  templateUrl: './card-editor-page.component.html',
  styleUrl: './card-editor-page.component.scss',
})
export class CardEditorPageComponent implements OnInit {
  readonly store = inject(CardEditorStore);
  readonly catalogStore = inject(CardCatalogSearchStore);
  private readonly cardEditorDialog = inject(CardEditorDialogService);

  readonly cardKinds = CARD_KINDS;
  readonly kindLabels = CARD_KIND_LABELS;
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;
  readonly difficultyLabels = DIFFICULTY_LABELS;

  async ngOnInit(): Promise<void> {
    await this.catalogStore.init();
  }

  async startCreate(kind: CardKind): Promise<void> {
    const result = await this.cardEditorDialog.openCreate(kind);
    if (result?.saved) {
      await this.catalogStore.init();
    }
  }

  async startEdit(cardId: string): Promise<void> {
    const result = await this.cardEditorDialog.openEdit(cardId);
    if (result?.saved) {
      await this.catalogStore.init();
    }
  }

  async deleteCard(cardId: string): Promise<void> {
    if (await this.store.deleteCard(cardId)) {
      await this.catalogStore.init();
    }
  }
}
