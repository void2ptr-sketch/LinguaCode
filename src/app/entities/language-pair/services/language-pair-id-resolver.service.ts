import { Injectable, inject } from '@angular/core';

import { LanguagePairsApiService } from '../api/language-pairs-api.service';
import type { LanguagePairDto } from '../api/language-pairs-api.types';
import { normalizeLanguagePair } from '../utils/language-pair.utils';
import type { LanguagePair } from '../model/language-pair.types';

/**
 * Resolves numeric backend IDs for user language pairs.
 *
 * @remarks
 * User preferences store pairs as `{ known, learning }` codes with local string
 * IDs, while the backend `/courses/search` endpoint filters by numeric
 * `languagePairIds` (see `CoursesSearchParams.languagePairIds`). This service
 * loads `/language-pairs` once, caches the result, and maps codes → numeric IDs.
 *
 * Fallback behaviour: if `/language-pairs` is unavailable, `resolveIds()`
 * returns an empty array — callers should treat that as "no pair filter".
 */
@Injectable({ providedIn: 'root' })
export class LanguagePairIdResolver {
  private readonly api = inject(LanguagePairsApiService);

  /** Cached `/language-pairs` list. Empty array means "load failed". */
  private cache: LanguagePairDto[] | null = null;
  private cachePromise: Promise<LanguagePairDto[]> | null = null;

  /**
   * Resolves numeric backend IDs for the given pairs.
   *
   * @param pairs — Pairs to resolve (`{ known, learning }` codes).
   * @returns Deduplicated numeric IDs for pairs known to the backend; empty
   * array when the backend pair list is unavailable or nothing matched.
   */
  async resolveIds(pairs: readonly LanguagePair[]): Promise<number[]> {
    if (pairs.length === 0) {
      return [];
    }

    const all = await this.listAll();
    if (all.length === 0) {
      return [];
    }

    const ids = new Set<number>();
    for (const rawPair of pairs) {
      const pair = normalizeLanguagePair(rawPair);
      const match = all.find(
        (candidate) =>
          candidate.knownCode === pair.known && candidate.learningCode === pair.learning,
      );
      if (match) {
        ids.add(match.id);
      }
    }

    return [...ids];
  }

  /** Clears the cached pair list (e.g. for tests). */
  resetCache(): void {
    this.cache = null;
    this.cachePromise = null;
  }

  private async listAll(): Promise<LanguagePairDto[]> {
    if (this.cache) {
      return this.cache;
    }

    if (!this.cachePromise) {
      this.cachePromise = this.api
        .listAll()
        .then((list) => {
          this.cache = list;
          return list;
        })
        .catch(() => {
          // Backend unavailable — remember the failure as an empty list so we
          // do not retry on every search call.
          this.cache = [];
          return this.cache;
        });
    }

    return this.cachePromise;
  }
}
