import { Injectable } from '@angular/core';
import { normalizeLanguagePair } from '../repositories/language-pair/language-pair.utils';
import { LearningResult } from '../models';
import { DEFAULT_LANGUAGE_PAIR } from '../models/language-pair.types';

/**
 * LocalStorage key for learning results.
 */
export const LEARNING_RESULTS_STORAGE_KEY = 'lingua-code.learning-results';

/**
 * Persists learning results to and from LocalStorage.
 *
 * @remarks
 * Uses JSON serialization with fallback defaults for missing fields.
 * Normalizes language pair and generates UUIDs for missing IDs.
 */
@Injectable({ providedIn: 'root' })
export class LearningResultsPersistence {
  /**
   * Loads learning results from LocalStorage.
   *
   * @returns An array of learning results, or an empty array if no data is stored or parsing fails.
   * @remarks
   * Applies fallback defaults: generated UUIDs for missing IDs, `'local-user'` for userId,
   * `false` for correct, current ISO timestamp for answeredAt.
   */
  load(): readonly LearningResult[] {
    const raw = localStorage.getItem(LEARNING_RESULTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as readonly Partial<LearningResult>[];
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((item) => ({
        id: item.id ?? crypto.randomUUID(),
        userId: item.userId ?? 'local-user',
        cardId: item.cardId ?? '',
        scenarioId: item.scenarioId ?? '',
        correct: item.correct ?? false,
        answeredAt: item.answeredAt ?? new Date().toISOString(),
        languagePair: normalizeLanguagePair(item.languagePair ?? DEFAULT_LANGUAGE_PAIR),
        direction: item.direction,
        lessonId: typeof item.lessonId === 'string' ? item.lessonId : undefined,
        courseId: typeof item.courseId === 'string' ? item.courseId : undefined,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Saves learning results to LocalStorage.
   *
   * @param results - The array of learning results to persist.
   */
  save(results: readonly LearningResult[]): void {
    localStorage.setItem(LEARNING_RESULTS_STORAGE_KEY, JSON.stringify(results));
  }
}
