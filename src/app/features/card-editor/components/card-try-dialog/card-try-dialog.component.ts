import { Component, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CardsApiService } from '../../../../core/data/cards/cards-api.service';
import { CardsCatalogMockHandler } from '../../../../core/api/cards/cards-catalog.mock.handler';
import { cardIndexMatchesPair } from '../../../../core/data/language-pair/language-pair.utils';
import type { CardDirection } from '../../../../core/models/language-pair.types';
import { UserStore } from '../../../../core/state';
import { CARD_KIND_LABELS } from '../../../../shared/card-catalog-search';
import { CardHostComponent } from '../../../../shared/components/card-host';
import type { CardTryDialogData } from './card-try-dialog.types';
import { SingleCardPlayStore } from './single-card-play.store';

@Component({
  selector: 'app-card-try-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    CardHostComponent,
  ],
  providers: [SingleCardPlayStore],
  templateUrl: './card-try-dialog.component.html',
  styleUrl: './card-try-dialog.component.scss',
})
export class CardTryDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<CardTryDialogComponent, void>);
  readonly data = inject<CardTryDialogData>(MAT_DIALOG_DATA);
  readonly playStore = inject(SingleCardPlayStore);
  private readonly cardsApi = inject(CardsApiService);
  private readonly cardsCatalogHandler = inject(CardsCatalogMockHandler);
  private readonly userStore = inject(UserStore);

  readonly kindLabels = CARD_KIND_LABELS;
  readonly fontSize = computed(() => this.userStore.preferences().fontSize);

  readonly title = computed(() => {
    const card = this.playStore.card();
    if (!card) {
      return 'Прогон карточки';
    }

    return `${card.title} · ${this.kindLabels[card.kind]}`;
  });

  async ngOnInit(): Promise<void> {
    this.playStore.setLoading(true);

    try {
      const entry = await this.cardsCatalogHandler.getIndexEntry(this.data.cardId);
      const pair = this.userStore.languagePair();

      if (entry && !cardIndexMatchesPair(entry, pair)) {
        this.playStore.setError('Карточка не относится к активному курсу');
        return;
      }

      const card = await this.cardsApi.getById(this.data.cardId);
      this.playStore.setCard(card);
    } catch {
      this.playStore.setError('Не удалось загрузить карточку');
    }
  }

  onDirectionChange(direction: CardDirection): void {
    this.playStore.setSessionDirection(direction);
  }

  checkAnswer(): void {
    this.playStore.checkAnswer();
  }

  close(): void {
    this.dialogRef.close();
  }
}
