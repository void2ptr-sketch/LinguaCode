import type { LearningResult } from '../model';

/**
 * Data-access contract for learning results tracking.
 *
 * @remarks
 * Implemented by `LearningApiService` (HTTP). Consumers should depend on
 * this port, not on a concrete implementation, so the data source can be
 * swapped without changing callers.
 */
export type LearningCatalogPort = {
  /**
   * Records a learning result for a user's answer.
   *
   * @param result - The learning result to record.
   * @returns Promise resolving to the saved learning result.
   */
  record(result: Omit<LearningResult, 'id'>): Promise<LearningResult>;

  /**
   * Retrieves paginated learning results for a user.
   *
   * @param userId - The user ID.
   * @param page - Page number (0-based).
   * @param pageSize - Page size.
   * @returns Promise resolving to the paginated results.
   */
  findByUser(userId: string, page?: number, pageSize?: number): Promise<readonly LearningResult[]>;

  /**
   * Retrieves accuracy statistics for a card.
   *
   * @param userId - The user ID.
   * @param cardId - The card ID.
   * @returns Promise resolving to the accuracy data.
   */
  getCardAccuracy(userId: string, cardId: string): Promise<CardAccuracyData>;
};

/**
 * Accuracy statistics for a card.
 */
export type CardAccuracyData = {
  cardId: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number | null;
};
