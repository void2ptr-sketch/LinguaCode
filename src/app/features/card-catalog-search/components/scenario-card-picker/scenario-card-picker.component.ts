import { Component, computed, effect, inject, input, OnInit, output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';

import { UiPaginationComponent } from '../../../../shared/utils/pagination';
import { formatIndexLanguagePair } from '../../../../core/data/language-pair/language-pair.utils';
import { UserStore } from '../../../../core/state';
import { CARD_KIND_LABELS, CONTENT_LANGUAGE_LABELS, DIFFICULTY_LABELS } from '../../../../shared/constants/catalog-labels';
import { CardCatalogFiltersComponent } from '../../';
import { CardCatalogSearchStore } from '../../';
import type { CardIndexEntry } from '../../../../core/models';

/**
 * Component for picking cards from the card catalog within the scenario builder.
 *
 * @remarks
 * Provides search, filtering (by kind, difficulty, language), and pagination.
 * The selected card IDs are communicated via `selectedIds` / `selectedIdsChange`.
 * Automatically reloads when the active language pair changes.
 *
 * @example
 * ```html
 * <app-scenario-card-picker
 *   [selectedIds]="selectedCardIds"
 *   (selectedIdsChange)="onSelectionChange($event)">
 * </app-scenario-card-picker>
 * ```
 */
let lastKnownPickerActiveLanguagePairId: string | null = null;

@Component({
  selector: 'app-scenario-card-picker',
  imports: [MatCheckboxModule, MatListModule, UiPaginationComponent, CardCatalogFiltersComponent],
  templateUrl: './scenario-card-picker.component.html',
  styleUrl: './scenario-card-picker.component.scss',
})
export class ScenarioCardPickerComponent implements OnInit {
  readonly store = inject(CardCatalogSearchStore);
  private readonly userStore = inject(UserStore);

  readonly selectedIds = input.required<readonly string[]>();
  readonly selectedIdsChange = output<readonly string[]>();

  readonly kindLabels = CARD_KIND_LABELS;
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;
  readonly difficultyLabels = DIFFICULTY_LABELS;
  readonly formatIndexLanguagePair = formatIndexLanguagePair;

  readonly entries = computed(() => this.store.entries() as CardIndexEntry[]);

  private readonly reloadOnActivePairChange = effect(() => {
    const activeId = this.userStore.activeLanguagePairId();
    const pair = this.userStore.languagePair();

    if (
      lastKnownPickerActiveLanguagePairId !== null &&
      lastKnownPickerActiveLanguagePairId !== activeId
    ) {
      void this.store.initWithActivePair(pair.known, pair.learning);
    }

    lastKnownPickerActiveLanguagePairId = activeId;
  });

  async ngOnInit(): Promise<void> {
    const pair = this.userStore.languagePair();
    await this.store.initWithActivePair(pair.known, pair.learning);
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
