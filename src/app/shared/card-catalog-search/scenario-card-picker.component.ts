import { Component, inject, input, OnInit, output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';

import { UiPaginationComponent } from '../pagination';
import { formatIndexLanguagePair } from '../../core/data/language-pair.utils';
import {
  CARD_KIND_LABELS,
  CONTENT_LANGUAGE_LABELS,
  DIFFICULTY_LABELS,
} from './catalog-labels';
import { CardCatalogFiltersComponent } from './card-catalog-filters.component';
import { CardCatalogSearchStore } from './card-catalog-search.store';

@Component({
  selector: 'app-scenario-card-picker',
  imports: [
    MatCheckboxModule,
    MatListModule,
    UiPaginationComponent,
    CardCatalogFiltersComponent,
  ],
  templateUrl: './scenario-card-picker.component.html',
  styleUrl: './scenario-card-picker.component.scss',
})
export class ScenarioCardPickerComponent implements OnInit {
  readonly store = inject(CardCatalogSearchStore);

  readonly selectedIds = input.required<readonly string[]>();
  readonly selectedIdsChange = output<readonly string[]>();

  readonly kindLabels = CARD_KIND_LABELS;
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;
  readonly difficultyLabels = DIFFICULTY_LABELS;
  readonly formatIndexLanguagePair = formatIndexLanguagePair;

  async ngOnInit(): Promise<void> {
    await this.store.init();
  }

  isSelected(cardId: string): boolean {
    return this.selectedIds().includes(cardId);
  }

  toggleCard(cardId: string, checked: boolean): void {
    const current = this.selectedIds();
    if (checked) {
      if (!current.includes(cardId)) {
        this.selectedIdsChange.emit([...current, cardId]);
      }
      return;
    }

    this.selectedIdsChange.emit(current.filter((id) => id !== cardId));
  }
}
