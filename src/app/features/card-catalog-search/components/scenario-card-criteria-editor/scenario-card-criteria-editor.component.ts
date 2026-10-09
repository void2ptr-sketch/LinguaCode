import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { CardSearchService } from '../../../../core/data';
import {
  DEFAULT_CRITERIA_LIMIT,
  resolveScenarioCardIds,
} from '../../../../core/data/scenarios/scenario-card-source.utils';
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

  /** Required search criteria (without pagination). */
  readonly criteria = input.required<Omit<CardSearchCriteria, 'page'>>();
  /** Maximum number of cards to include (default: DEFAULT_CRITERIA_LIMIT). */
  readonly limit = input<number>(DEFAULT_CRITERIA_LIMIT);
  /** Sort order for matching cards. */
  readonly sort = input<ScenarioCardSort>('updatedAt');
  /** Seed value for random sorting. */
  readonly seed = input<string>('');

  /** Emits updated search criteria when filters change. */
  readonly criteriaChange = output<Omit<CardSearchCriteria, 'page'>>();
  /** Emits the updated card limit. */
  readonly limitChange = output<number>();
  /** Emits the updated sort order. */
  readonly sortChange = output<ScenarioCardSort>();
  /** Emits the updated seed value. */
  readonly seedChange = output<string>();

  /** Available sort options. */
  readonly sortOptions = SORT_OPTIONS;
  /** Computed total number of matching cards (null if not yet loaded). */
  readonly matchingTotal = signal<number | null>(null);
  /** Preview card IDs matching the current criteria. */
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

  onLimitInput(value: string): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    this.limitChange.emit(parsed);
    void this.refreshPreview(this.readCriteriaFromStore());
  }

  onSortChange(value: ScenarioCardSort): void {
    this.sortChange.emit(value);
    void this.refreshPreview(this.readCriteriaFromStore());
  }

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
