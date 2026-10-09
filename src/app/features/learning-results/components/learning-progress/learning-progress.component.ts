import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LearningResultsStore } from '../../../../core/state';
import { scenarioDisplayLabel } from '../../../../core/data/scenarios/scenario-display-label.utils';

/**
 * Learning progress component. Displays overall learning statistics including accuracy,
 * recent results, and per-scenario progress.
 * @remarks Data is sourced directly from `LearningResultsStore`.
 */
@Component({
  selector: 'app-learning-progress',
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatProgressBarModule],
  templateUrl: './learning-progress.component.html',
  styleUrl: './learning-progress.component.scss',
})
export class LearningProgressComponent {
  private readonly resultsStore = inject(LearningResultsStore);

  /** Total number of learning results. */
  readonly totalResults = this.resultsStore.totalCount;
  /** Number of correct answers. */
  readonly correctResults = this.resultsStore.correctCount;
  /** Overall accuracy percentage. */
  readonly accuracyPercent = this.resultsStore.accuracyPercent;
  /** Recent learning results for the current language pair. */
  readonly recentResults = this.resultsStore.recentResults;
  /** Per-scenario progress data. */
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
