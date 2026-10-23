import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { LearningResult } from '../model';
import type { ApiResponse } from '../../../shared/api/api.types';
import type { CardAccuracyData, LearningCatalogPort } from '../repository/learning-catalog.port';
import { buildApiUrl } from '../../../shared/api/api-url';

/**
 * Backend DTO for a learning result (matches `LearningResultDto`).
 */
type BackendLearningResultDto = {
  id: string;
  userId: string;
  cardId: string;
  scenarioId: string | null;
  correct: boolean;
  answeredAt: string;
};

/**
 * Backend DTO for card accuracy (matches `CardAccuracyDto`).
 */
type BackendCardAccuracyDto = {
  cardId: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number | null;
};

/**
 * HTTP API service for learning results operations.
 *
 * @remarks
 * Wraps the backend learning API with Promise-based methods. Implements the
 * `LearningCatalogPort` data-access contract.
 */
@Injectable({ providedIn: 'root' })
export class LearningApiService implements LearningCatalogPort {
  private readonly http = inject(HttpClient);

  /**
   * Records a learning result for a user's answer.
   *
   * @param result - The learning result to record.
   * @returns Promise resolving to the saved learning result.
   *
   * @example
   * ```ts
   * await learningApi.record({
   *   userId: 'user-123',
   *   cardId: 'card-456',
   *   scenarioId: 'scenario-789',
   *   correct: true,
   *   answeredAt: new Date().toISOString(),
   * });
   * ```
   */
  record(result: Omit<LearningResult, 'id'>): Promise<LearningResult> {
    return firstValueFrom(
      this.http.post<ApiResponse<BackendLearningResultDto>>(buildApiUrl('/learning/results'), {
        userId: result.userId,
        cardId: result.cardId,
        scenarioId: result.scenarioId ?? null,
        correct: result.correct,
      }),
    ).then((response) => mapBackendResult(response.data));
  }

  /**
   * Retrieves paginated learning results for a user.
   *
   * @param userId - The user ID.
   * @param page - Page number (0-based, default 0).
   * @param pageSize - Page size (default 20).
   * @returns Promise resolving to the array of learning results.
   *
   * @example
   * ```ts
   * const results = await learningApi.findByUser('user-123', 0, 20);
   * ```
   */
  findByUser(userId: string, page = 0, pageSize = 20): Promise<readonly LearningResult[]> {
    return firstValueFrom(
      this.http.get<ApiResponse<BackendLearningResultDto[]>>(
        buildApiUrl(`/learning/results/${userId}`),
        {
          params: { page, size: pageSize },
        },
      ),
    ).then((response) => response.data.map(mapBackendResult));
  }

  /**
   * Retrieves accuracy statistics for a card.
   *
   * @param userId - The user ID.
   * @param cardId - The card ID.
   * @returns Promise resolving to the accuracy data.
   *
   * @example
   * ```ts
   * const accuracy = await learningApi.getCardAccuracy('user-123', 'card-456');
   * ```
   */
  getCardAccuracy(userId: string, cardId: string): Promise<CardAccuracyData> {
    return firstValueFrom(
      this.http.get<ApiResponse<BackendCardAccuracyDto>>(
        buildApiUrl(`/learning/accuracy/${userId}/${cardId}`),
      ),
    ).then((response) => response.data);
  }
}

/**
 * Maps a backend learning result DTO to the frontend LearningResult type.
 */
function mapBackendResult(dto: BackendLearningResultDto): LearningResult {
  return {
    id: dto.id,
    userId: dto.userId,
    cardId: dto.cardId,
    scenarioId: dto.scenarioId ?? undefined,
    correct: dto.correct,
    answeredAt: dto.answeredAt,
  };
}
