import { Injectable, computed, signal } from '@angular/core';
import { LearningResult } from '../models';

@Injectable({ providedIn: 'root' })
export class LearningResultsStore {
  private readonly resultsState = signal<readonly LearningResult[]>([]);

  readonly results = this.resultsState.asReadonly();
  readonly totalCount = computed(() => this.results().length);
  readonly correctCount = computed(() => this.results().filter((item) => item.correct).length);

  addResult(result: LearningResult): void {
    this.resultsState.update((results) => [...results, result]);
  }

  resultsForScenario(scenarioId: string): readonly LearningResult[] {
    return this.results().filter((item) => item.scenarioId === scenarioId);
  }

  clear(): void {
    this.resultsState.set([]);
  }
}
