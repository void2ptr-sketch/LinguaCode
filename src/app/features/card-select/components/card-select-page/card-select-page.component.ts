import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Scenario } from '../../../../core/models';
import { CardHostComponent } from '../../../../shared/components/card-host';
import { LearningResultsStore, UserStore } from '../../../../core/state';
import { CardSelectService } from '../../services/card-select.service';
import { CardSelectStore } from '../../services/card-select.store';

@Component({
  selector: 'app-card-select-page',
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    CardHostComponent,
  ],
  templateUrl: './card-select-page.component.html',
  styleUrl: './card-select-page.component.scss',
})
export class CardSelectPageComponent implements OnInit {
  private readonly cardSelectService = inject(CardSelectService);
  private readonly resultsStore = inject(LearningResultsStore);
  private readonly userStore = inject(UserStore);
  readonly store = inject(CardSelectStore);

  readonly scenarios = signal<readonly Scenario[]>([]);
  readonly selectedScenarioId = signal<string>('demo-scenario');
  readonly scenarioTitle = signal<string>('');
  readonly missingCardsWarning = signal<string | null>(null);

  readonly fontSize = this.userStore.preferences;

  async ngOnInit(): Promise<void> {
    this.scenarios.set(this.cardSelectService.listScenarios());
    await this.loadCards();
  }

  async loadCards(): Promise<void> {
    this.store.reset();
    this.store.setLoading(true);
    this.missingCardsWarning.set(null);

    try {
      const session = await this.cardSelectService.loadScenario(this.selectedScenarioId());
      this.scenarioTitle.set(session.scenarioTitle);
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
    });
  }

  nextCard(): void {
    this.store.nextCard();
  }
}
