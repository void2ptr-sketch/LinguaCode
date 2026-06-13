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

import { DEFAULT_CRITERIA_LIMIT, emptyCardSearchCriteria, scenarioCardsLabel } from '../../../../core/data/scenario-card-source.utils';
import type { ScenarioCardSource } from '../../../../core/models';
import {
  CardCatalogSearchStore,
  ScenarioCardCriteriaEditorComponent,
  ScenarioCardPickerComponent,
} from '../../../../shared/card-catalog-search';
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
    ScenarioCardPickerComponent,
    ScenarioCardCriteriaEditorComponent,
  ],
  providers: [CardCatalogSearchStore],
  templateUrl: './scenario-builder-page.component.html',
  styleUrl: './scenario-builder-page.component.scss',
})
export class ScenarioBuilderPageComponent implements OnInit {
  readonly store = inject(ScenarioBuilderStore);

  readonly titleDraft = signal('');
  readonly descriptionDraft = signal('');
  readonly sourceModeDraft = signal<ScenarioCardSourceMode>('fixed');
  readonly fixedCardIdsDraft = signal<readonly string[]>([]);
  readonly criteriaDraft = signal(emptyCardSearchCriteria());
  readonly criteriaLimitDraft = signal(DEFAULT_CRITERIA_LIMIT);

  async ngOnInit(): Promise<void> {
    await this.store.load();
  }

  startCreate(): void {
    this.store.startCreate();
    this.resetDraft();
  }

  startEdit(scenarioId: string): void {
    const scenario = this.store.scenarios().find((item) => item.id === scenarioId);
    if (!scenario) {
      return;
    }

    this.store.startEdit(scenarioId);
    this.titleDraft.set(scenario.title);
    this.descriptionDraft.set(scenario.description);
    this.applyCardSource(scenario.cardSource);
  }

  cancelEdit(): void {
    this.store.cancelEdit();
    this.resetDraft();
  }

  saveScenario(): void {
    const draft: ScenarioDraft = {
      title: this.titleDraft(),
      description: this.descriptionDraft(),
      cardSource: this.buildCardSource(),
    };

    if (this.store.editorMode() === 'create') {
      if (this.store.createScenario(draft)) {
        this.resetDraft();
      }
      return;
    }

    const scenarioId = this.store.editingScenarioId();
    if (scenarioId && this.store.updateScenario(scenarioId, draft)) {
      this.resetDraft();
    }
  }

  deleteScenario(scenarioId: string): void {
    this.store.deleteScenario(scenarioId);
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

  readonly scenarioCardsLabel = scenarioCardsLabel;

  private buildCardSource(): ScenarioCardSource {
    if (this.sourceModeDraft() === 'fixed') {
      return { mode: 'fixed', cardIds: this.fixedCardIdsDraft() };
    }

    return {
      mode: 'criteria',
      criteria: this.criteriaDraft(),
      limit: this.criteriaLimitDraft(),
    };
  }

  private applyCardSource(source: ScenarioCardSource): void {
    if (source.mode === 'fixed') {
      this.sourceModeDraft.set('fixed');
      this.fixedCardIdsDraft.set([...source.cardIds]);
      return;
    }

    this.sourceModeDraft.set('criteria');
    this.criteriaDraft.set({ ...source.criteria });
    this.criteriaLimitDraft.set(source.limit ?? DEFAULT_CRITERIA_LIMIT);
  }

  private resetDraft(): void {
    this.titleDraft.set('');
    this.descriptionDraft.set('');
    this.sourceModeDraft.set('fixed');
    this.fixedCardIdsDraft.set([]);
    this.criteriaDraft.set(emptyCardSearchCriteria());
    this.criteriaLimitDraft.set(DEFAULT_CRITERIA_LIMIT);
  }
}
