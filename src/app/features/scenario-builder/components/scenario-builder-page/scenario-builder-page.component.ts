import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type { PageEvent } from '@angular/material/paginator';

import {
  DEFAULT_CRITERIA_LIMIT,
  emptyCardSearchCriteria,
  scenarioCardsLabel,
} from '../../../../core/data/scenario-card-source.utils';
import type { ScenarioCardSource, ScenarioCardSort, ScenarioListScope } from '../../../../core/models';
import {
  CardCatalogSearchStore,
  ScenarioCardCriteriaEditorComponent,
  ScenarioCardPickerComponent,
} from '../../../../shared/card-catalog-search';
import { UiPaginationComponent } from '../../../../shared/pagination';
import { UserStore } from '../../../../core/state';
import { ScenarioBuilderStore } from '../../services/scenario-builder.store';
import { ScenarioCardSourceMode, ScenarioDraft } from '../../types';

@Component({
  selector: 'app-scenario-builder-page',
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    UiPaginationComponent,
    ScenarioCardPickerComponent,
    ScenarioCardCriteriaEditorComponent,
  ],
  providers: [CardCatalogSearchStore],
  templateUrl: './scenario-builder-page.component.html',
  styleUrl: './scenario-builder-page.component.scss',
})
export class ScenarioBuilderPageComponent implements OnInit {
  readonly store = inject(ScenarioBuilderStore);
  readonly userStore = inject(UserStore);

  readonly titleDraft = signal('');
  readonly descriptionDraft = signal('');
  readonly publishedDraft = signal(false);
  readonly sourceModeDraft = signal<ScenarioCardSourceMode>('fixed');
  readonly fixedCardIdsDraft = signal<readonly string[]>([]);
  readonly criteriaDraft = signal(emptyCardSearchCriteria());
  readonly criteriaLimitDraft = signal(DEFAULT_CRITERIA_LIMIT);
  readonly criteriaSortDraft = signal<ScenarioCardSort>('updatedAt');
  readonly criteriaSeedDraft = signal('');
  readonly cardTitles = signal<Record<string, string>>({});
  readonly snapshotFrozenAt = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.store.load();
  }

  startCreate(): void {
    this.store.startCreate();
    this.resetDraft();
  }

  async startEdit(scenarioId: string): Promise<void> {
    await this.store.startEdit(scenarioId);
    const scenario = this.store.editingScenario();
    if (!scenario) {
      return;
    }

    this.titleDraft.set(scenario.title);
    this.descriptionDraft.set(scenario.description);
    this.publishedDraft.set(scenario.published);
    this.applyCardSource(scenario.cardSource);
  }

  cancelEdit(): void {
    this.store.cancelEdit();
    this.resetDraft();
  }

  async saveScenario(): Promise<void> {
    const draft: ScenarioDraft = {
      title: this.titleDraft(),
      description: this.descriptionDraft(),
      published: this.publishedDraft(),
      cardSource: this.buildCardSource(),
    };

    if (this.store.editorMode() === 'create') {
      if (await this.store.createScenario(draft)) {
        this.resetDraft();
      }
      return;
    }

    const scenarioId = this.store.editingScenarioId();
    if (scenarioId && (await this.store.updateScenario(scenarioId, draft))) {
      this.resetDraft();
    }
  }

  async deleteScenario(scenarioId: string): Promise<void> {
    await this.store.deleteScenario(scenarioId);
  }

  moveCard(cardId: string, direction: -1 | 1): void {
    const current = [...this.fixedCardIdsDraft()];
    const index = current.indexOf(cardId);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= current.length) {
      return;
    }

    [current[index], current[targetIndex]] = [current[targetIndex], current[index]];
    this.fixedCardIdsDraft.set(current);
  }

  onSourceModeChange(mode: ScenarioCardSourceMode): void {
    this.sourceModeDraft.set(mode);
  }

  onListQueryChange(value: string): void {
    this.store.setListQuery(value);
    void this.store.loadList();
  }

  onListScopeChange(scope: ScenarioListScope): void {
    this.store.setListScope(scope);
    void this.store.loadList();
  }

  onListPageChange(event: PageEvent): void {
    this.store.setPage(event.pageIndex, event.pageSize);
    void this.store.loadList();
  }

  async onFixedCardIdsChange(cardIds: readonly string[]): Promise<void> {
    this.fixedCardIdsDraft.set(cardIds);
    await this.refreshCardTitles(cardIds);
  }

  async createSnapshotFromCriteria(): Promise<void> {
    const source = await this.store.buildSnapshotFromCriteria(
      this.criteriaDraft(),
      this.criteriaLimitDraft(),
      this.criteriaSortDraft(),
      this.criteriaSeedDraft() || undefined,
    );

    if (!source) {
      return;
    }

    this.sourceModeDraft.set('snapshot');
    this.fixedCardIdsDraft.set(source.mode === 'snapshot' ? [...source.cardIds] : []);
    this.snapshotFrozenAt.set(source.mode === 'snapshot' ? source.frozenAt : null);
    await this.refreshCardTitles(this.fixedCardIdsDraft());
  }

  cardTitle(cardId: string): string {
    return this.cardTitles()[cardId] ?? cardId;
  }

  isOwnScenario(authorId: string): boolean {
    return authorId === this.userStore.user().id;
  }

  readonly scenarioCardsLabel = scenarioCardsLabel;

  private buildCardSource(): ScenarioCardSource {
    if (this.sourceModeDraft() === 'fixed') {
      return { mode: 'fixed', cardIds: this.fixedCardIdsDraft() };
    }

    if (this.sourceModeDraft() === 'snapshot') {
      return {
        mode: 'snapshot',
        cardIds: this.fixedCardIdsDraft(),
        criteria: this.criteriaDraft(),
        limit: this.criteriaLimitDraft(),
        frozenAt: this.snapshotFrozenAt() ?? new Date().toISOString(),
      };
    }

    return {
      mode: 'criteria',
      criteria: this.criteriaDraft(),
      limit: this.criteriaLimitDraft(),
      sort: this.criteriaSortDraft(),
      seed: this.criteriaSeedDraft() || undefined,
    };
  }

  private applyCardSource(source: ScenarioCardSource): void {
    if (source.mode === 'fixed') {
      this.sourceModeDraft.set('fixed');
      this.fixedCardIdsDraft.set([...source.cardIds]);
      void this.refreshCardTitles(source.cardIds);
      return;
    }

    if (source.mode === 'snapshot') {
      this.sourceModeDraft.set('snapshot');
      this.fixedCardIdsDraft.set([...source.cardIds]);
      this.criteriaDraft.set({ ...source.criteria });
      this.criteriaLimitDraft.set(source.limit ?? DEFAULT_CRITERIA_LIMIT);
      this.snapshotFrozenAt.set(source.frozenAt);
      void this.refreshCardTitles(source.cardIds);
      return;
    }

    this.sourceModeDraft.set('criteria');
    this.criteriaDraft.set({ ...source.criteria });
    this.criteriaLimitDraft.set(source.limit ?? DEFAULT_CRITERIA_LIMIT);
    this.criteriaSortDraft.set(source.sort ?? 'updatedAt');
    this.criteriaSeedDraft.set(source.seed ?? '');
  }

  private resetDraft(): void {
    this.titleDraft.set('');
    this.descriptionDraft.set('');
    this.publishedDraft.set(false);
    this.sourceModeDraft.set('fixed');
    this.fixedCardIdsDraft.set([]);
    this.criteriaDraft.set(emptyCardSearchCriteria());
    this.criteriaLimitDraft.set(DEFAULT_CRITERIA_LIMIT);
    this.criteriaSortDraft.set('updatedAt');
    this.criteriaSeedDraft.set('');
    this.snapshotFrozenAt.set(null);
    this.cardTitles.set({});
  }

  private async refreshCardTitles(cardIds: readonly string[]): Promise<void> {
    const titles: Record<string, string> = {};

    for (const cardId of cardIds) {
      titles[cardId] = await this.store.cardTitle(cardId);
    }

    this.cardTitles.set(titles);
  }
}
