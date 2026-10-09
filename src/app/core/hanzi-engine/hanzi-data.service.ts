import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  HANZI_ASSETS_BASE_PATH,
  HANZI_RADICAL_ASSETS_BASE_PATH,
  type HanziCharacterJson,
  type HanziLoadState,
} from './hanzi-character.types';
import { buildHanziCharacterModel, type HanziCharacterModel } from './hanzi-character.model';

type HanziCacheEntry = {
  state: HanziLoadState;
  json: HanziCharacterJson | null;
  model: HanziCharacterModel | null;
  error: string | null;
};

/**
 * Service for loading and caching Hanzi (Chinese character) data.
 *
 * @remarks
 * Fetches character JSON from static assets, builds a model via `buildHanziCharacterModel`,
 * and caches results. Supports single-character and batch loading with deduplication
 * of in-flight requests.
 */
@Injectable({ providedIn: 'root' })
export class HanziDataService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, HanziCacheEntry>();
  private readonly inflight = new Map<string, Promise<HanziCharacterModel | null>>();

  /** The last character that was successfully loaded. */
  readonly lastLoadedCharacter = signal<string | null>(null);

  /**
   * Returns the primary asset URL for a character.
   *
   * @param character - The Chinese character.
   * @returns The primary asset URL (main path, falls back to radical path).
   */
  assetUrl(character: string): string {
    return this.assetUrls(character)[0]!;
  }

  /**
   * Returns all possible asset URLs for a character (main + radical paths).
   *
   * @param character - The Chinese character.
   * @returns Array of asset URLs.
   */
  assetUrls(character: string): readonly string[] {
    const key = character.trim();
    return [
      `${HANZI_ASSETS_BASE_PATH}/${encodeURIComponent(key)}.json`,
      `${HANZI_RADICAL_ASSETS_BASE_PATH}/${encodeURIComponent(key)}.json`,
    ];
  }

  /**
   * Returns the load state for a character.
   *
   * @param character - The Chinese character.
   * @returns The current load state ('idle', 'loading', 'ready', 'missing', or 'error').
   */
  getLoadState(character: string): HanziLoadState {
    return this.cache.get(character.trim())?.state ?? 'idle';
  }

  /**
   * Returns the cached model for a character, if available.
   *
   * @param character - The Chinese character.
   * @returns The character model, or `null` if not cached.
   */
  getCachedModel(character: string): HanziCharacterModel | null {
    return this.cache.get(character.trim())?.model ?? null;
  }

  /**
   * Checks whether a character has cached, ready data.
   *
   * @param character - The Chinese character.
   * @returns `true` if the character model is cached and ready.
   */
  hasCachedData(character: string): boolean {
    const entry = this.cache.get(character.trim());
    return entry?.state === 'ready' && entry.model !== null;
  }

  /**
   * Loads a character model, using cache and deduplicating in-flight requests.
   *
   * @param character - The Chinese character to load.
   * @returns The character model, or `null` if not found or on error.
   */
  async loadCharacter(character: string): Promise<HanziCharacterModel | null> {
    const key = character.trim();
    if (!key) {
      return null;
    }

    const cached = this.cache.get(key);
    if (cached?.state === 'ready' && cached.model) {
      return cached.model;
    }

    if (cached?.state === 'missing') {
      return null;
    }

    const pending = this.inflight.get(key);
    if (pending) {
      return pending;
    }

    const request = this.fetchCharacter(key);
    this.inflight.set(key, request);

    try {
      return await request;
    } finally {
      this.inflight.delete(key);
    }
  }

  /**
   * Loads multiple characters in parallel, caching each result.
   *
   * @param characters - Array of Chinese characters.
   * @returns A Map of character → model for successfully loaded characters.
   */
  async loadCharacters(characters: readonly string[]): Promise<Map<string, HanziCharacterModel>> {
    const unique = [...new Set(characters.map((character) => character.trim()).filter(Boolean))];
    const models = await Promise.all(
      unique.map(async (character) => [character, await this.loadCharacter(character)] as const),
    );
    const result = new Map<string, HanziCharacterModel>();

    for (const [character, model] of models) {
      if (model) {
        result.set(character, model);
      }
    }

    return result;
  }

  /**
   * Clears all cached data and in-flight requests.
   *
   * @remarks
   * Resets `lastLoadedCharacter` to `null`.
   */
  clearCache(): void {
    this.cache.clear();
    this.inflight.clear();
    this.lastLoadedCharacter.set(null);
  }

  private async fetchCharacter(character: string): Promise<HanziCharacterModel | null> {
    this.setCacheEntry(character, {
      state: 'loading',
      json: null,
      model: null,
      error: null,
    });

    let lastError: unknown = null;

    for (const url of this.assetUrls(character)) {
      try {
        const json = await firstValueFrom(
          this.http.get<HanziCharacterJson>(url, {
            headers: { Accept: 'application/json' },
          }),
        );

        const model = buildHanziCharacterModel(character, json);
        this.setCacheEntry(character, {
          state: 'ready',
          json,
          model,
          error: null,
        });
        this.lastLoadedCharacter.set(character);
        return model;
      } catch (error) {
        lastError = error;
        const isMissing = error instanceof HttpErrorResponse && error.status === 404;
        if (!isMissing) {
          break;
        }
      }
    }

    const message = lastError instanceof Error ? lastError.message : 'Failed to load hanzi data';
    const isMissing = lastError instanceof HttpErrorResponse && lastError.status === 404;
    this.setCacheEntry(character, {
      state: isMissing ? 'missing' : 'error',
      json: null,
      model: null,
      error: message,
    });
    return null;
  }

  private setCacheEntry(character: string, entry: HanziCacheEntry): void {
    this.cache.set(character, entry);
  }
}
