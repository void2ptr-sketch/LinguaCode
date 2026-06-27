import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  HANZI_ASSETS_BASE_PATH,
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

@Injectable({ providedIn: 'root' })
export class HanziDataService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, HanziCacheEntry>();
  private readonly inflight = new Map<string, Promise<HanziCharacterModel | null>>();

  readonly lastLoadedCharacter = signal<string | null>(null);

  assetUrl(character: string): string {
    const key = character.trim();
    return `${HANZI_ASSETS_BASE_PATH}/${encodeURIComponent(key)}.json`;
  }

  getLoadState(character: string): HanziLoadState {
    return this.cache.get(character.trim())?.state ?? 'idle';
  }

  getCachedModel(character: string): HanziCharacterModel | null {
    return this.cache.get(character.trim())?.model ?? null;
  }

  hasCachedData(character: string): boolean {
    const entry = this.cache.get(character.trim());
    return entry?.state === 'ready' && entry.model !== null;
  }

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

  async loadCharacters(characters: readonly string[]): Promise<Map<string, HanziCharacterModel>> {
    const unique = [...new Set(characters.map((character) => character.trim()).filter(Boolean))];
    const models = await Promise.all(unique.map(async (character) => [character, await this.loadCharacter(character)] as const));
    const result = new Map<string, HanziCharacterModel>();

    for (const [character, model] of models) {
      if (model) {
        result.set(character, model);
      }
    }

    return result;
  }

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

    try {
      const json = await firstValueFrom(
        this.http.get<HanziCharacterJson>(this.assetUrl(character), {
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
      const message = error instanceof Error ? error.message : 'Failed to load hanzi data';
      const isMissing = error instanceof HttpErrorResponse && error.status === 404;
      this.setCacheEntry(character, {
        state: isMissing ? 'missing' : 'error',
        json: null,
        model: null,
        error: message,
      });
      return null;
    }
  }

  private setCacheEntry(character: string, entry: HanziCacheEntry): void {
    this.cache.set(character, entry);
  }
}
