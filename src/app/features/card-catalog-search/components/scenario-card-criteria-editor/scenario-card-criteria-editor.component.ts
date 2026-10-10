import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { CardSearchService } from '../../../../core/repositories';
import {
  DEFAULT_CRITERIA_LIMIT,
  resolveScenarioCardIds,
} from '../../../../core/repositories/scenarios/scenario-card-source.utils';
import type { CardSearchCriteria, ScenarioCardSort } from '../../../../core/models';
import { UserStore } from '../../../../core/state';

import { CardCatalogFiltersComponent } from '../../';
import { CardCatalogSearchStore } from '../../';

const SORT_OPTIONS: readonly { value: ScenarioCardSort; label: string }[] = [
  { value: 'updatedAt', label: 'По дате обновления' },
  { value: 'difficulty', label: 'По сложности' },
  { value: 'random', label: 'Случайно' },
];

let lastKnownCriteriaEditorActiveLanguagePairId: string | null = null;

/**
 * Scenario card criteria editor component. Allows users to define search criteria for
 * automatically populating a scenario with cards from the catalog.
 * @remarks Supports live preview of matching cards and reloads on language pair change.
 */
@Component({
  selector: 'app-scenario-card-criteria-editor',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    CardCatalogFiltersComponent,
  ],
  templateUrl: './scenario-card-criteria-editor.component.html',
  styleUrl: './scenario-card-criteria-editor.component.scss',
})
export class ScenarioCardCriteriaEditorComponent implements OnInit {
  private readonly cardSearchService = inject(CardSearchService);
  private readonly userStore = inject(UserStore);
  readonly store = inject(CardCatalogSearchStore);

  /**
   * Required search criteria for filtering cards (without pagination).
   *
   * @remarks
   * Set by the parent scenario builder to define which cards are eligible.
   * Changes to this input are not propagated to the store automatically;
   * use the emitted `criteriaChange` output to keep the parent in sync.
   */
  readonly criteria = input.required<Omit<CardSearchCriteria, 'page'>>();
  /**
   * Maximum number of cards to include in the result set.
   *
   * @remarks
   * Defaults to `DEFAULT_CRITERIA_LIMIT`. Changes trigger a preview refresh.
   */
  readonly limit = input<number>(DEFAULT_CRITERIA_LIMIT);
  /**
   * Sort order for matching cards.
   *
   * @remarks
   * Affects how cards are ranked when selecting them for a scenario.
   */
  readonly sort = input<ScenarioCardSort>('updatedAt');
  /**
   * Seed value for random sorting.
   *
   * @remarks
   * Used when `sort` is set to `'random'` to produce reproducible results.
   */
  readonly seed = input<string>('');

  /**
   * Emits updated search criteria whenever internal filters change.
   *
   * @remarks
   * The parent component should bind this output to keep its own criteria
   * model in sync with the filter state.
   */
  readonly criteriaChange = output<Omit<CardSearchCriteria, 'page'>>();
  /**
   * Emits the updated card limit value.
   *
   * @remarks
   * Triggered when the user modifies the limit input field.
   */
  readonly limitChange = output<number>();
  /**
   * Emits the updated sort order.
   *
   * @remarks
   * Triggered when the user selects a different sort option.
   */
  readonly sortChange = output<ScenarioCardSort>();
  /**
   * Emits the updated seed value.
   *
   * @remarks
   * Triggered when the user modifies the seed input field.
   */
  readonly seedChange = output<string>();

  /** Available sort options for card selection. */
  readonly sortOptions = SORT_OPTIONS;
  /**
   * Total number of cards matching the current search criteria.
   *
   * @remarks
   * `null` while the preview is loading or has not yet been fetched.
   */
  readonly matchingTotal = signal<number | null>(null);
  /**
   * Preview card IDs matching the current criteria.
   *
   * @remarks
   * Populated asynchronously after each criteria change.
   */
  readonly previewIds = signal<readonly string[]>([]);
  /** Whether the preview is currently loading. */
  readonly previewLoading = signal(false);

  private readonly initialized = signal(false);

  constructor() {
    effect(() => {
      if (!this.initialized()) {
        return;
      }

      const nextCriteria = this.readCriteriaFromStore();
      this.criteriaChange.emit(nextCriteria);
      void this.refreshPreview(nextCriteria);
    });

    effect(() => {
      if (!this.initialized()) {
        return;
      }

      const activeId = this.userStore.activeLanguagePairId();
      const pair = this.userStore.languagePair();

      if (
        lastKnownCriteriaEditorActiveLanguagePairId !== null &&
        lastKnownCriteriaEditorActiveLanguagePairId !== activeId
      ) {
        this.store.applyLanguagePair(pair.known, pair.learning);
      }

      lastKnownCriteriaEditorActiveLanguagePairId = activeId;
    });
  }

  async ngOnInit(): Promise<void> {
    const pair = this.userStore.languagePair();
    const initial = this.criteria();
    const hasLanguageFilters = Boolean(initial.knownLanguage || initial.learningLanguage);

    if (!hasLanguageFilters) {
      this.applyActivePairCriteria(pair.known, pair.learning, initial);
    } else {
      this.applyCriteria(initial);
    }

    this.store.pairLocked.set(true);
    await this.store.init();
    this.initialized.set(true);
    void this.refreshPreview(this.readCriteriaFromStore());
  }

  /**
   * Handles limit input changes from the user.
   *
   * @param value - The new limit value as a string.
   * @remarks
   * Parses the value as a number and emits via `limitChange`. Refreshes the preview.
   */
  onLimitInput(value: string): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.limitChange.emit(parsed);
    void this.refreshPreview(this.readCriteriaFromStore());
  }

  /**
   * Handles sort order changes from the selector.
   *
   * @param value - The new sort order.
   * @remarks
   * Emits via `sortChange` and refreshes the preview.
   */
  onSortChange(value: ScenarioCardSort): void {
    this.sortChange.emit(value);
    void this.refreshPreview(this.readCriteriaFromStore());
  }

  /**
   * Handles seed input changes for random sorting.
   *
   * @param value - The new seed string.
   * @remarks
   * Emits via `seedChange` and refreshes the preview.
   */
  onSeedInput(value: string): void {
    this.seedChange.emit(value);
    void this.refreshPreview(this.readCriteriaFromStore());
  }

  private applyActivePairCriteria(
    known: import('../../../../core/models').ContentLanguage,
    learning: import('../../../../core/models').ContentLanguage,
    base?: Omit<CardSearchCriteria, 'page'>,
  ): void {
    const initial = base ?? this.criteria();
    this.applyCriteria({
      ...initial,
      knownLanguage: known,
      learningLanguage: learning,
    });
  }

  private applyCriteria(criteria: Omit<CardSearchCriteria, 'page'>): void {
    this.store.query.set(criteria.query ?? '');
    this.store.knownLanguage.set(criteria.knownLanguage ?? null);
    this.store.learningLanguage.set(criteria.learningLanguage ?? null);
    this.store.difficulty.set(criteria.difficulty ?? null);
    this.store.selectedKinds.set(criteria.kinds ?? []);
    this.store.selectedTags.set(criteria.tags ?? []);
  }

  private readCriteriaFromStore(): Omit<CardSearchCriteria, 'page'> {
    return {
      query: this.store.query().trim() || undefined,
      knownLanguage: this.store.knownLanguage() ?? undefined,
      learningLanguage: this.store.learningLanguage() ?? undefined,
      difficulty: this.store.difficulty() ?? undefined,
      kinds: this.store.selectedKinds().length > 0 ? this.store.selectedKinds() : undefined,
      tags: this.store.selectedTags().length > 0 ? this.store.selectedTags() : undefined,
    };
  }

  private async refreshPreview(criteria: Omit<CardSearchCriteria, 'page'>): Promise<void> {
    this.previewLoading.set(true);

    try {
      const page = await this.cardSearchService.search({
        ...criteria,
        page: { page: 0, pageSize: this.limit() },
      });
      this.matchingTotal.set(page.totalItems);

      const ids = await resolveScenarioCardIds(
        {
          mode: 'criteria',
          criteria,
          limit: this.limit(),
          sort: this.sort(),
          seed: this.seed() || undefined,
        },
        this.cardSearchService,
      );
      this.previewIds.set(ids);
    } catch {
      this.matchingTotal.set(null);
      this.previewIds.set([]);
    } finally {
      this.previewLoading.set(false);
    }
  }
}
