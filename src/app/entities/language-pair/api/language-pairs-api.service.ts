import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { buildApiUrl } from '../../../shared/api/api-url';
import type { ApiListResponse } from '../../../shared/api/api.types';

import type { LanguagePairDto } from './language-pairs-api.types';

/**
 * HTTP API service for language pair operations.
 *
 * @remarks
 * Wraps the backend `/language-pairs` endpoint with Promise-based methods.
 * - `listAll()` — read-only catalog used by `AvailablePairsService` and
 *   `LanguagePairIdResolver`.
 * - `create()` / `update()` / `delete()` — registry CRUD, intended for the
 *   author zone (`/tools/language-pairs`), NOT for the learner profile:
 *   the profile manages only the user's own pairs via `users/preferences`.
 */
@Injectable({ providedIn: 'root' })
export class LanguagePairsApiService {
  private readonly http = inject(HttpClient);

  /**
   * Returns all valid language pairs.
   *
   * @returns Array of `LanguagePairDto` with `id`, `knownCode`, and `learningCode`.
   */
  listAll(): Promise<LanguagePairDto[]> {
    return firstValueFrom(
      this.http.get<ApiListResponse<LanguagePairDto>>(buildApiUrl('/language-pairs')),
    ).then((response) => response.data as LanguagePairDto[]);
  }

  /**
   * Creates a new language pair in the registry.
   *
   * @param payload - Direction to create (`knownCode` / `learningCode`).
   * @returns The created `LanguagePairDto` with its numeric registry ID.
   */
  create(payload: LanguagePairCreatePayload): Promise<LanguagePairDto> {
    return firstValueFrom(this.http.post<LanguagePairDto>(buildApiUrl('/language-pairs'), payload));
  }

  /**
   * Updates an existing registry pair (direction change).
   *
   * @param id - Numeric registry pair ID.
   * @param payload - Partial direction patch.
   * @returns The updated `LanguagePairDto`.
   */
  update(id: number, payload: LanguagePairUpdatePayload): Promise<LanguagePairDto> {
    return firstValueFrom(
      this.http.patch<LanguagePairDto>(buildApiUrl(`/language-pairs/${id}`), payload),
    );
  }

  /**
   * Deletes a language pair from the registry.
   *
   * @param id - Numeric registry pair ID.
   */
  delete(id: number): Promise<void> {
    return firstValueFrom(this.http.delete<null>(buildApiUrl(`/language-pairs/${id}`))).then(
      () => undefined,
    );
  }
}

/** Payload for creating a registry language pair. */
export type LanguagePairCreatePayload = {
  knownCode: string;
  learningCode: string;
};

/** Payload for updating a registry language pair (partial direction patch). */
export type LanguagePairUpdatePayload = Partial<
  Pick<LanguagePairCreatePayload, 'knownCode' | 'learningCode'>
>;
