import { Injectable, computed, inject, signal } from '@angular/core';
import { LearningResult } from '../models';
import { LearningResultsPersistence } from './learning-results.persistence';
import { UserStore } from './user.store';

const RECENT_RESULTS_LIMIT = 10;

@Injectable({ providedIn: 'root' })
export class LearningResultsStore {
  private readonly persistence = inject(LearningResultsPersistence);
  private readonly userStore = inject(UserStore);
  private readonly resultsState = signal<readonly LearningResult[]>(this.persistence.load());

  readonly results = this.resultsState.asReadonly();

  readonly userResults = computed(() => {
    const userId = this.userStore.user().id;
    return this.results().filter((item) => item.userId === userId);
  });

  readonly totalCount = computed(() => this.userResults().length);
  readonly correctCount = computed(() => this.userResults().filter((item) => item.correct).length);

  readonly accuracyPercent = computed(() => {
    const total = this.totalCount();
    if (total === 0) {
      return 0;
    }

    return Math.round((this.correctCount() / total) * 100);
  });

  readonly recentResults = computed(() => {
    return [...this.userResults()]
      .sort((left, right) => right.answeredAt.localeCompare(left.answeredAt))
      .slice(0, RECENT_RESULTS_LIMIT);
  });

  readonly scenarioProgress = computed(() => {
    const grouped = new Map<string, { total: number; correct: number }>();

    for (const result of this.userResults()) {
      const current = grouped.get(result.scenarioId) ?? { total: 0, correct: 0 };
      grouped.set(result.scenarioId, {
        total: current.total + 1,
        correct: current.correct + (result.correct ? 1 : 0),
      });
    }

    return [...grouped.entries()]
      .map(([scenarioId, stats]) => ({
        scenarioId,
        total: stats.total,
        correct: stats.correct,
      }))
      .sort((left, right) => left.scenarioId.localeCompare(right.scenarioId));
  });

  addResult(result: LearningResult): void {
    this.resultsState.update((results) => {
      const nextResults = [...results, result];
      this.persistence.save(nextResults);
      return nextResults;
    });
  }

  resultsForScenario(scenarioId: string): readonly LearningResult[] {
    return this.userResults().filter((item) => item.scenarioId === scenarioId);
  }

  clear(): void {
    const userId = this.userStore.user().id;
    this.resultsState.update((results) => {
      const nextResults = results.filter((item) => item.userId !== userId);
      this.persistence.save(nextResults);
      return nextResults;
    });
  }
}
