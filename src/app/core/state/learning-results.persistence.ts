import { Injectable } from '@angular/core';
import { LearningResult } from '../models';

export const LEARNING_RESULTS_STORAGE_KEY = 'lingua-code.learning-results';

@Injectable({ providedIn: 'root' })
export class LearningResultsPersistence {
  load(): readonly LearningResult[] {
    const raw = localStorage.getItem(LEARNING_RESULTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as readonly LearningResult[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  save(results: readonly LearningResult[]): void {
    localStorage.setItem(LEARNING_RESULTS_STORAGE_KEY, JSON.stringify(results));
  }
}
