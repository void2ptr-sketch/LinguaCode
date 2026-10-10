import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import type { ContentLanguage, ScenarioCardSort } from '../../../../core/models';
import {
  CONTENT_LANGUAGE_LABELS,
  contentLanguages,
} from '../../../../core/domain/language-pair/language-pair.utils';
import {
  ScenarioCardCriteriaEditorComponent,
  ScenarioCardPickerComponent,
} from '../../../card-catalog-search';
import { ScenarioBuilderStore } from '../../services/scenario-builder.store';
import type { ScenarioCardSourceMode } from '../../types';
import type { ScenarioFormDraft } from '../../utils/scenario-form-draft.utils';

/**
 * Scenario editor form component. Provides a full form for editing scenarios including
 * title, description, card source mode (fixed/criteria/snapshot), and card ordering.
 * @remarks Supports two sub-modes for card selection: `ScenarioCardPickerComponent` (fixed)
 * and `ScenarioCardCriteriaEditorComponent` (criteria-based).
 */
@Component({
  selector: 'app-scenario-editor-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatSelectModule,
    MatSlideToggleModule,
    ScenarioCardPickerComponent,
    ScenarioCardCriteriaEditorComponent,
  ],
  templateUrl: './scenario-editor-form.component.html',
  styleUrl: './scenario-editor-form.component.scss',
})
export class ScenarioEditorFormComponent {
  /** Required scenario form draft being edited. */
  readonly draft = input.required<ScenarioFormDraft>();
  /** Whether the form is in read-only mode. */
  readonly readOnly = input(false);

  /** Emits the updated scenario form draft when the user makes changes. */
  readonly draftChange = output<ScenarioFormDraft>();

  private readonly store = inject(ScenarioBuilderStore);

  /** Available content languages. */
  readonly languages = contentLanguages();
  /** Labels for content languages. */
  readonly languageLabels = CONTENT_LANGUAGE_LABELS;
  /**
   * Card titles indexed by card ID, loaded asynchronously.
   *
   * @remarks
   * Populated by `refreshCardTitles` when `fixedCardIds` changes.
   */
  readonly cardTitles = signal<Record<string, string>>({});

  constructor() {
    effect(() => {
      const form = this.draft();
      const cardIds =
        form.sourceMode === 'fixed' || form.sourceMode === 'snapshot' ? form.fixedCardIds : [];

      void this.refreshCardTitles(cardIds);
    });
  }

  updateDraft(patch: Partial<ScenarioFormDraft>): void {
    this.draftChange.emit({ ...this.draft(), ...patch });
  }

  async onFixedCardIdsChange(cardIds: readonly string[]): Promise<void> {
    this.updateDraft({ fixedCardIds: cardIds });
  }

  onSourceModeChange(mode: ScenarioCardSourceMode): void {
    this.updateDraft({ sourceMode: mode });
  }

  moveCard(cardId: string, direction: -1 | 1): void {
    const current = [...this.draft().fixedCardIds];
    const index = current.indexOf(cardId);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= current.length) {
      return;
    }

    [current[index], current[targetIndex]] = [current[targetIndex], current[index]];
    this.updateDraft({ fixedCardIds: current });
  }

  async createSnapshotFromCriteria(): Promise<void> {
    const form = this.draft();
    const source = await this.store.buildSnapshotFromCriteria(
      form.criteria,
      form.criteriaLimit,
      form.criteriaSort,
      form.criteriaSeed || undefined,
    );

    if (!source || source.mode !== 'snapshot') {
      return;
    }

    this.updateDraft({
      sourceMode: 'snapshot',
      fixedCardIds: [...source.cardIds],
      snapshotFrozenAt: source.frozenAt,
    });
  }

  cardTitle(cardId: string): string {
    return this.cardTitles()[cardId] ?? cardId;
  }

  onCriteriaSortChange(sort: ScenarioCardSort): void {
    this.updateDraft({ criteriaSort: sort });
  }

  onKnownLanguageChange(known: ContentLanguage): void {
    this.updateDraft({
      languagePair: { ...this.draft().languagePair, known },
    });
  }

  onLearningLanguageChange(learning: ContentLanguage): void {
    this.updateDraft({
      languagePair: { ...this.draft().languagePair, learning },
    });
  }

  languagePairInvalid(): boolean {
    const pair = this.draft().languagePair;
    return pair.known === pair.learning;
  }

  private async refreshCardTitles(cardIds: readonly string[]): Promise<void> {
    const titles: Record<string, string> = {};

    for (const cardId of cardIds) {
      titles[cardId] = await this.store.cardTitle(cardId);
    }

    this.cardTitles.set(titles);
  }
}
