import { Component, effect, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CardKind } from '../../../../core/models';
import { formatIndexLanguagePair } from '../../../../core/data/language-pair.utils';
import {
  CARD_KIND_LABELS,
  CardCatalogFiltersComponent,
  CardCatalogSearchStore,
  CONTENT_LANGUAGE_LABELS,
  DIFFICULTY_LABELS,
} from '../../../../shared/card-catalog-search';
import { UiPaginationComponent } from '../../../../shared/pagination';
import { UserStore } from '../../../../core/state';
import { CardEditorDialogService } from '../card-editor-dialog/card-editor-dialog.service';
import { CardTryDialogService } from '../card-try-dialog/card-try-dialog.service';
import { CardEditorStore } from '../../services/card-editor.store';
import { CARD_KINDS } from '../../types';

let lastKnownActiveLanguagePairId: string | null = null;

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
  private readonly cardTryDialog = inject(CardTryDialogService);
  private readonly userStore = inject(UserStore);

  readonly cardKinds = CARD_KINDS;
  readonly kindLabels = CARD_KIND_LABELS;
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;
  readonly difficultyLabels = DIFFICULTY_LABELS;

  private readonly reloadOnActivePairChange = effect(() => {
    const activeId = this.userStore.activeLanguagePairId();
    const pair = this.userStore.languagePair();

    if (lastKnownActiveLanguagePairId !== null && lastKnownActiveLanguagePairId !== activeId) {
      void this.catalogStore.initWithActivePair(pair.known, pair.learning);
    }

    lastKnownActiveLanguagePairId = activeId;
  });

  formatEntryLanguages(entry: {
    knownLanguage: keyof typeof CONTENT_LANGUAGE_LABELS;
    learningLanguage: keyof typeof CONTENT_LANGUAGE_LABELS;
  }): string {
    return formatIndexLanguagePair(entry, this.languageLabels);
  }

  async ngOnInit(): Promise<void> {
    const pair = this.userStore.languagePair();
    await this.catalogStore.initWithActivePair(pair.known, pair.learning);
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

  tryCard(cardId: string): void {
    void this.cardTryDialog.open(cardId);
  }

  async deleteCard(cardId: string): Promise<void> {
    if (await this.store.deleteCard(cardId)) {
      await this.catalogStore.init();
    }
  }
}
