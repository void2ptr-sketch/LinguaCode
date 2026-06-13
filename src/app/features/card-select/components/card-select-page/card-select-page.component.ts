import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LearningResultsStore, UserStore } from '../../../../core/state';
import { getApiErrorMessage } from '../../../../core/api';
import { CardSelectCardComponent } from '../card-select-card/card-select-card.component';
import { CardSelectService } from '../../services/card-select.service';
import { CardSelectStore } from '../../services/card-select.store';

@Component({
  selector: 'app-card-select-page',
  imports: [MatCardModule, MatButtonModule, MatProgressSpinnerModule, CardSelectCardComponent],
  templateUrl: './card-select-page.component.html',
  styleUrl: './card-select-page.component.scss',
})
export class CardSelectPageComponent implements OnInit {
  private readonly cardSelectService = inject(CardSelectService);
  private readonly resultsStore = inject(LearningResultsStore);
  private readonly userStore = inject(UserStore);
  readonly store = inject(CardSelectStore);

  readonly fontSize = this.userStore.preferences;

  async ngOnInit(): Promise<void> {
    await this.loadCards();
  }

  async loadCards(): Promise<void> {
    this.store.reset();
    this.store.setLoading(true);

    try {
      const fixture = await this.cardSelectService.loadFixture();
      this.store.setScenario(fixture.scenarioId, fixture.cards);
    } catch (error: unknown) {
      this.store.setError(getApiErrorMessage(error, 'Не удалось загрузить карточки'));
    }
  }

  selectOption(index: number): void {
    this.store.selectOption(index);
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
