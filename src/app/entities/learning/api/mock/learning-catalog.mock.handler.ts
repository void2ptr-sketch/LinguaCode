import { Injectable, inject } from '@angular/core';

import type { LearningResult } from '../../model';
import { LearningResultsPersistence } from '../../model/learning-results.persistence';

import type { CardAccuracyData } from '../../repository/learning-catalog.port';

/**
 * Mock handler for learning results operations.
 *
 * @remarks
 * Provides in-memory CRUD for learning results using
 * `LearningResultsPersistence` (localStorage) as the data source.
 * Used by `learningApiMockInterceptor` to simulate API responses during development.
 */
@Injectable({ providedIn: 'root' })
export class LearningCatalogMockHandler {
  private readonly persistence = inject(LearningResultsPersistence);

  private results: readonly LearningResult[] | null = null;

  /**
   * Records a learning result (userId is extracted from JWT on the backend).
   *
   * @param result - The learning result to record (without id and userId).
   * @returns The saved learning result with generated id.
   */
  record(result: Omit<LearningResult, 'id' | 'userId'>): LearningResult {
    const newResult: LearningResult = {
      ...result,
      id: crypto.randomUUID(),
      userId: 'local-user', // mock fallback — in real API userId comes from JWT
    };

    const current = this.ensureResults();
    const updated = [...current, newResult];
    this.persistence.save(updated);
    this.results = updated;

    return newResult;
  }

  /**
   * Retrieves learning results for a user with pagination.
   *
   * @param userId - The user ID.
   * @param page - Page number (0-based).
   * @param pageSize - Page size.
   * @returns Paginated learning results for the user.
   */
  findByUser(userId: string, page = 0, pageSize = 20): readonly LearningResult[] {
    const all = this.ensureResults().filter((r) => r.userId === userId);
    const start = page * pageSize;
    return all.slice(start, start + pageSize);
  }

  /**
   * Retrieves accuracy statistics for a card.
   *
   * @param userId - The user ID.
   * @param cardId - The card ID.
   * @returns Accuracy data for the card.
   */
  getCardAccuracy(userId: string, cardId: string): CardAccuracyData {
    const userResults = this.ensureResults().filter(
      (r) => r.userId === userId && r.cardId === cardId,
    );

    const totalAttempts = userResults.length;
    const correctAttempts = userResults.filter((r) => r.correct).length;
    const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : null;

    return {
      cardId,
      totalAttempts,
      correctAttempts,
      accuracy,
    };
  }

  /**
   * Clears the cached results, forcing a reload on the next operation.
   */
  resetCache(): void {
    this.results = null;
  }

  private ensureResults(): readonly LearningResult[] {
    if (this.results) {
      return this.results;
    }
    this.results = this.persistence.load();
    return this.results;
  }
}
