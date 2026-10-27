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
 * Wraps the backend `/language-pairs` endpoint with a Promise-based method.
 * Used to resolve `languagePairId` → `{ known, learning }` mappings
 * for course/program/scenario indices.
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
}
