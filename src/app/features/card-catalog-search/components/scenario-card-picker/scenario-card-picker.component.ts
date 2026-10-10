import { Component, computed, effect, inject, input, OnInit, output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';

import { UiPaginationComponent } from '../../../../shared/utils/pagination';
import { formatIndexLanguagePair } from '../../../../core/domain/language-pair/language-pair.utils';
import { UserStore } from '../../../../core/state';
import {
  CARD_KIND_LABELS,
  CONTENT_LANGUAGE_LABELS,
  DIFFICULTY_LABELS,
} from '../../../../shared/constants/catalog-labels';
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

  /**
   * Required array of currently selected card IDs.
   *
   * @remarks
   * Bound via two-way binding with `selectedIdsChange`. The parent component
   * owns the selected IDs state.
   */
  readonly selectedIds = input.required<readonly string[]>();
  /**
   * Emits the updated array of selected card IDs.
   *
   * @remarks
   * Use two-way binding: `[selectedIds]="ids" (selectedIdsChange)="ids = $event"`.
   */
  readonly selectedIdsChange = output<readonly string[]>();

  /**
   * Labels for card kinds.
   *
   * @remarks
   * Used in templates to display human-readable kind names.
   */
  readonly kindLabels = CARD_KIND_LABELS;
  /**
   * Labels for content languages.
   *
   * @remarks
   * Used in templates to display human-readable language names.
   */
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;
  /**
   * Labels for difficulty levels.
   *
   * @remarks
   * Used in templates to display human-readable difficulty names.
   */
  readonly difficultyLabels = DIFFICULTY_LABELS;
  /**
   * Utility function to format index language pairs.
   *
   * @remarks
   * Used in templates to render language pair labels.
   */
  readonly formatIndexLanguagePair = formatIndexLanguagePair;

  /**
   * Computed search result entries from the catalog store.
   *
   * @remarks
   * Derived from `store.entries()` with explicit casting to `CardIndexEntry[]`.
   */
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

  /**
   * Checks whether a given card is currently selected.
   *
   * @param cardId - The card ID to check.
   * @returns `true` if the card ID is present in the selected IDs array.
   */
  isSelected(cardId: string): boolean {
    return this.selectedIds().includes(cardId);
  }

  /**
   * Toggles the selection state of a card.
   *
   * @param cardId - The card ID to toggle.
   * @param checked - Whether the checkbox is checked (true = select, false = deselect).
   *
   * @remarks
   * Emits the updated selection array via `selectedIdsChange`.
   * Adding an already-selected card or removing a non-selected card is a no-op.
   */
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
