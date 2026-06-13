import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { CardSearchService } from '../../core/data';
import { DEFAULT_CRITERIA_LIMIT } from '../../core/data/scenario-card-source.utils';
import type { CardSearchCriteria } from '../../core/models';

import { CardCatalogFiltersComponent } from './card-catalog-filters.component';
import { CardCatalogSearchStore } from './card-catalog-search.store';

@Component({
  selector: 'app-scenario-card-criteria-editor',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, CardCatalogFiltersComponent],
  templateUrl: './scenario-card-criteria-editor.component.html',
  styleUrl: './scenario-card-criteria-editor.component.scss',
})
export class ScenarioCardCriteriaEditorComponent implements OnInit {
  private readonly cardSearchService = inject(CardSearchService);
  readonly store = inject(CardCatalogSearchStore);

  readonly criteria = input.required<Omit<CardSearchCriteria, 'page'>>();
  readonly limit = input<number>(DEFAULT_CRITERIA_LIMIT);

  readonly criteriaChange = output<Omit<CardSearchCriteria, 'page'>>();
  readonly limitChange = output<number>();

  readonly matchingTotal = signal<number | null>(null);
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
  }

  async ngOnInit(): Promise<void> {
    this.applyCriteria(this.criteria());
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

  private applyCriteria(criteria: Omit<CardSearchCriteria, 'page'>): void {
    this.store.query.set(criteria.query ?? '');
    this.store.language.set(criteria.language ?? null);
    this.store.difficulty.set(criteria.difficulty ?? null);
    this.store.selectedKinds.set(criteria.kinds ?? []);
    this.store.selectedTags.set(criteria.tags ?? []);
  }

  private readCriteriaFromStore(): Omit<CardSearchCriteria, 'page'> {
    return {
      query: this.store.query().trim() || undefined,
      language: this.store.language() ?? undefined,
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
    } catch {
      this.matchingTotal.set(null);
    } finally {
      this.previewLoading.set(false);
    }
  }
}
