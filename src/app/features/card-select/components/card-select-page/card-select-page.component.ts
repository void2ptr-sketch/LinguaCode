import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import type { CardDirection } from '../../../../core/models/language-pair.types';

import { ActiveLanguagePairSwitcherComponent } from '../../../../shared/components/active-language-pair-switcher/active-language-pair-switcher.component';
import { CardHostComponent } from '../../../../shared/components/card-host';
import { ScenarioPickerComponent } from '../../../../shared/scenario-picker';
import { LearningResultsStore, UserStore } from '../../../../core/state';
import { CardSelectService } from '../../services/card-select.service';
import { CardSelectStore } from '../../services/card-select.store';

let lastKnownActiveLanguagePairId: string | null = null;

@Component({
  selector: 'app-card-select-page',
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    ActiveLanguagePairSwitcherComponent,
    CardHostComponent,
    ScenarioPickerComponent,
  ],
  templateUrl: './card-select-page.component.html',
  styleUrl: './card-select-page.component.scss',
})
export class CardSelectPageComponent {
  private readonly cardSelectService = inject(CardSelectService);
  private readonly resultsStore = inject(LearningResultsStore);
  private readonly userStore = inject(UserStore);
  readonly store = inject(CardSelectStore);

  readonly selectedScenarioId = signal<string>('');
  readonly scenarioTitle = signal<string>('');
  readonly scenarioSourceLabel = signal<string>('');
  readonly missingCardsWarning = signal<string | null>(null);

  readonly fontSize = this.userStore.preferences;

  private readonly resetOnActivePairChange = effect(() => {
    const activeId = this.userStore.activeLanguagePairId();

    if (lastKnownActiveLanguagePairId !== null && lastKnownActiveLanguagePairId !== activeId) {
      this.resetSessionState();
    }

    lastKnownActiveLanguagePairId = activeId;
  });

  private resetSessionState(): void {
    this.store.reset();
    this.selectedScenarioId.set('');
    this.scenarioTitle.set('');
    this.scenarioSourceLabel.set('');
    this.missingCardsWarning.set(null);
  }

  async loadCards(): Promise<void> {
    const scenarioId = this.selectedScenarioId();
    if (!scenarioId) {
      return;
    }

    this.store.reset();
    this.store.setLoading(true);
    this.missingCardsWarning.set(null);

    try {
      const session = await this.cardSelectService.loadScenario(scenarioId);
      this.scenarioTitle.set(session.scenarioTitle);
      this.scenarioSourceLabel.set(session.scenarioSourceLabel);
      this.store.setScenario(session.scenarioId, session.cards);

      if (session.missingCardIds.length > 0) {
        this.missingCardsWarning.set(
          `В сценарии отсутствуют карточки: ${session.missingCardIds.join(', ')}`,
        );
      }
    } catch {
      this.store.setError('Не удалось загрузить карточки сценария');
    }
  }

  async onScenarioChange(scenarioId: string): Promise<void> {
    this.selectedScenarioId.set(scenarioId);
    await this.loadCards();
  }

  onScenarioLabelChange(label: string): void {
    this.scenarioSourceLabel.set(label.split(' · ').slice(1).join(' · ') || label);
  }

  selectOption(index: number): void {
    this.store.selectOption(index);
  }

  setAnswerText(value: string): void {
    this.store.setAnswerText(value);
  }

  setMemoryComplete(value: boolean): void {
    this.store.setMemoryComplete(value);
  }

  setDrawSubmitted(value: boolean): void {
    this.store.setDrawSubmitted(value);
  }

  handleTimeExpired(): void {
    this.store.handleTimeExpired();
  }

  onDirectionChange(direction: CardDirection): void {
    this.store.sessionDirection.set(direction);
  }

  checkAnswer(): void {
    const card = this.store.currentCard();
    const isCorrect = this.store.checkAnswer();

    if (!card || isCorrect === null) {
      return;
    }

    this.resultsStore.addResult({
      id: crypto.randomUUID(),
      userId: this.userStore.user().id,
      cardId: card.id,
      scenarioId: this.store.scenarioId(),
      correct: isCorrect,
      answeredAt: new Date().toISOString(),
      languagePair: this.userStore.languagePair(),
      direction: this.store.sessionDirection(),
    });
  }

  nextCard(): void {
    this.store.nextCard();
  }
}
