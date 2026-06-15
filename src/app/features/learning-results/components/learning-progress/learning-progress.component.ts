import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LearningResultsStore } from '../../../../core/state';
import { scenarioDisplayLabel } from '../../../../core/data/scenario-display-label.utils';

@Component({
  selector: 'app-learning-progress',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatProgressBarModule],
  templateUrl: './learning-progress.component.html',
  styleUrl: './learning-progress.component.scss',
})
export class LearningProgressComponent {
  private readonly resultsStore = inject(LearningResultsStore);

  readonly totalResults = this.resultsStore.totalCount;
  readonly correctResults = this.resultsStore.correctCount;
  readonly accuracyPercent = this.resultsStore.accuracyPercent;
  readonly recentResults = this.resultsStore.recentResults;
  readonly scenarioProgress = this.resultsStore.scenarioProgress;

  clearResults(): void {
    this.resultsStore.clear();
  }

  scenarioLabel(scenarioId: string): string {
    return scenarioDisplayLabel(scenarioId);
  }

  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleString('ru-RU');
  }
}
