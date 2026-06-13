import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { CardSearchService } from '../../core/data';
import {
  DEFAULT_CRITERIA_LIMIT,
  resolveScenarioCardIds,
} from '../../core/data/scenario-card-source.utils';
import type { CardSearchCriteria, ScenarioCardSort } from '../../core/models';
import { UserStore } from '../../core/state';

import { CardCatalogFiltersComponent } from './card-catalog-filters.component';
import { CardCatalogSearchStore } from './card-catalog-search.store';

const SORT_OPTIONS: readonly { value: ScenarioCardSort; label: string }[] = [
  { value: 'updatedAt', label: 'По дате обновления' },
  { value: 'difficulty', label: 'По сложности' },
  { value: 'random', label: 'Случайно' },
];

let lastKnownCriteriaEditorActiveLanguagePairId: string | null = null;

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

  readonly criteria = input.required<Omit<CardSearchCriteria, 'page'>>();
  readonly limit = input<number>(DEFAULT_CRITERIA_LIMIT);
  readonly sort = input<ScenarioCardSort>('updatedAt');
  readonly seed = input<string>('');

  readonly criteriaChange = output<Omit<CardSearchCriteria, 'page'>>();
  readonly limitChange = output<number>();
  readonly sortChange = output<ScenarioCardSort>();
  readonly seedChange = output<string>();

  readonly sortOptions = SORT_OPTIONS;
  readonly matchingTotal = signal<number | null>(null);
  readonly previewIds = signal<readonly string[]>([]);
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
    known: import('../../core/models').ContentLanguage,
    learning: import('../../core/models').ContentLanguage,
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
