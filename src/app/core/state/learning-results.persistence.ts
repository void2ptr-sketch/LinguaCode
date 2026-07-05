import { Injectable } from '@angular/core';
import { normalizeLanguagePair } from '../data/language-pair/language-pair.utils';
import { LearningResult } from '../models';
import { DEFAULT_LANGUAGE_PAIR } from '../models/language-pair.types';

export const LEARNING_RESULTS_STORAGE_KEY = 'lingua-code.learning-results';

@Injectable({ providedIn: 'root' })
export class LearningResultsPersistence {
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

  save(results: readonly LearningResult[]): void {
    localStorage.setItem(LEARNING_RESULTS_STORAGE_KEY, JSON.stringify(results));
  }
}
