import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { buildApiUrl } from '../../../shared/api/api-url';
import type { ApiListResponse, ApiResponse } from '../../../shared/api/api.types';
import type { LanguageDto } from './language-dto.types';

/** Payload for creating a new language. */
export type LanguageCreatePayload = {
  code: string;
  displayName: string;
  nativeName: string;
  writingDir: string;
  supportsTones: boolean;
  supportsPinyin: boolean;
  fontFamily: string;
  activeFlag: boolean;
};

/** Payload for updating an existing language. */
export type LanguageUpdatePayload = Partial<LanguageCreatePayload>;

/**
 * HTTP API service for language CRUD operations.
 *
 * @remarks
 * Wraps the backend `/languages` endpoints with Promise-based methods.
 * Only authenticated users with appropriate roles should use this service.
 */
@Injectable({ providedIn: 'root' })
export class LanguageApiService {
  private readonly http = inject(HttpClient);

  /**
   * Returns all languages (active and inactive).
   *
   * @returns Array of `LanguageDto`.
   */
  listAll(): Promise<LanguageDto[]> {
    return firstValueFrom(
      this.http.get<ApiListResponse<LanguageDto>>(buildApiUrl('/languages')),
    ).then((response) => [...(response.data ?? [])]);
  }

  /**
   * Returns all active languages.
   *
   * @returns Array of active `LanguageDto`.
   */
  listActive(): Promise<LanguageDto[]> {
    return firstValueFrom(
      this.http.get<ApiListResponse<LanguageDto>>(buildApiUrl('/languages')),
    ).then((response) => [...(response.data ?? []).filter((l) => l.activeFlag)]);
  }

  /**
   * Gets a language by its ID.
   *
   * @param id - The language ID.
   * @returns The `LanguageDto`.
   */
  getById(id: number): Promise<LanguageDto> {
    return firstValueFrom(
      this.http.get<ApiResponse<LanguageDto>>(buildApiUrl(`/languages/${id}`)),
    ).then((response) => response.data);
  }

  /**
   * Creates a new language.
   *
   * @param payload - The language creation payload.
   * @returns The created `LanguageDto`.
   */
  create(payload: LanguageCreatePayload): Promise<LanguageDto> {
    return firstValueFrom(
      this.http.post<ApiResponse<LanguageDto>>(buildApiUrl('/languages'), payload),
    ).then((response) => response.data);
  }

  /**
   * Partially updates an existing language.
   *
   * @param id - The language ID.
   * @param payload - The fields to update.
   * @returns The updated `LanguageDto`.
   */
  update(id: number, payload: LanguageUpdatePayload): Promise<LanguageDto> {
    return firstValueFrom(
      this.http.patch<ApiResponse<LanguageDto>>(buildApiUrl(`/languages/${id}`), payload),
    ).then((response) => response.data);
  }

  /**
   * Deletes a language by ID.
   *
   * @param id - The language ID.
   */
  delete(id: number): Promise<void> {
    return firstValueFrom(
      this.http.delete<ApiResponse<null>>(buildApiUrl(`/languages/${id}`)),
    ).then(() => undefined);
  }
}
