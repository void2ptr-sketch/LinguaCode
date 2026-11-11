import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { buildApiUrl } from '../../../shared/api/api-url';
import { toHttpApiError } from '../../../shared/api/api-error.utils';
import type { ApiListResponse } from '../../../shared/api/api.types';
import type { LanguageDto } from '../api/language-dto.types';

/**
 * Service for loading and caching available languages from the backend.
 *
 * @remarks
 * Loads languages once at app startup (or on demand), caches in-memory.
 * Falls back to empty array if backend is unavailable.
 *
 * Consumers: `LanguageSettingsStore`, `UserStore`, `CardCatalogSearchStore`.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(AppLoggerService);

  /** Loaded languages from backend. */
  readonly languages = signal<LanguageDto[]>([]);

  /** Whether languages are currently being loaded. */
  readonly loading = signal(false);

  /** Whether languages have been successfully loaded. */
  readonly loaded = signal(false);

  /**
   * Returns active language codes from backend.
   */
  getCodes(): string[] {
    return this.languages()
      .filter((l) => l.activeFlag)
      .map((l) => l.code);
  }

  /**
   * Returns `{ code → displayName }` map from backend.
   */
  getLabels(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const lang of this.languages()) {
      map[lang.code] = lang.displayName;
    }
    return map;
  }

  /**
   * Loads all languages from the backend.
   *
   * @remarks
   * Idempotent — subsequent calls return the cached value.
   * If loading fails, the store remains empty and `loaded` stays `false`.
   *
   * @returns Promise that resolves when loading completes.
   */
  async load(): Promise<void> {
    if (this.loaded()) {
      return;
    }

    this.loading.set(true);
    try {
      const response = await firstValueFrom(
        this.http.get<ApiListResponse<LanguageDto>>(buildApiUrl('/languages')),
      );
      const all = response.data ?? [];
      // Store all languages; callers filter for active-only as needed.
      this.languages.set([...all]);
      this.loaded.set(true);
    } catch (error) {
      // Do NOT mark as loaded — otherwise a failed attempt is cached forever
      // and later calls (e.g. after login) never retry the request.
      this.languages.set([]);
      const apiError = toHttpApiError(error);
      this.logger.warn(`Failed to load languages (status: ${apiError.status})`, apiError);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Returns a language by its code.
   *
   * @param code - The ISO 639-1 language code.
   * @returns The language DTO or `undefined`.
   */
  findByCode(code: string): LanguageDto | undefined {
    return this.languages().find((l) => l.code === code);
  }

  /**
   * Checks whether the given code is a valid active language.
   *
   * @param code - The language code to validate.
   * @returns `true` if the code matches an active language.
   */
  isValid(code: string): boolean {
    return this.getCodes().includes(code);
  }
}
