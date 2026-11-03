import { computed, inject, Injectable, signal } from '@angular/core';
import { LanguageService } from './language.service';
import { LanguageSettingsStore } from './language-settings.store';
import { LanguagePairsApiService } from '../api/language-pairs-api.service';
import type { LanguagePairDto } from '../api/language-pairs-api.types';

/** Cache TTL for language pairs — 5 minutes. */
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Service that loads language pairs from the backend and filters them
 * to show only pairs where both languages are selected ("Use in Learning")
 * and active (`activeFlag`).
 */
@Injectable({ providedIn: 'root' })
export class AvailablePairsService {
  private readonly languageService = inject(LanguageService);
  private readonly settingsStore = inject(LanguageSettingsStore);
  private readonly pairsApi = inject(LanguagePairsApiService);

  /** Raw pairs loaded from the backend. */
  readonly pairs = signal<LanguagePairDto[]>([]);

  /** Whether pairs are currently being loaded. */
  readonly loading = signal(false);

  /** Whether pairs have been successfully loaded. */
  readonly loaded = signal(false);

  /** Timestamp of the last successful load. */
  private lastLoadTime = 0;

  /**
   * Pairs filtered to only include those where both languages are:
   * - "Use in Learning" (selected in the Languages tab)
   * - Active (`activeFlag === true`)
   */
  readonly visiblePairs = computed(() => {
    const selectedCodes = this.settingsStore.selectedCodes();
    const allLanguages = this.languageService.languages();
    const activeAndSelected = new Set(
      allLanguages
        .filter((l) => l.activeFlag && selectedCodes.includes(l.code))
        .map((l) => l.code),
    );

    return this.pairs().filter((pair) => {
      const knownMatch = activeAndSelected.has(pair.knownCode);
      const learningMatch = activeAndSelected.has(pair.learningCode);
      return knownMatch && learningMatch;
    });
  });

  /**
   * Loads pairs from the backend.
   *
   * @remarks
   * Uses a 5-minute cache. Subsequent calls within the TTL return the cached value.
   * Force reload with `force: true`.
   *
   * @param force - When true, bypasses cache and fetches fresh data.
   * @returns Promise that resolves when loading completes.
   */
  async load(force = false): Promise<void> {
    // Return cached data if still valid
    if (!force && this.loaded() && !this.isLoadingStale()) {
      return;
    }

    this.loading.set(true);
    try {
      const allPairs = await this.pairsApi.listAll();
      this.pairs.set(allPairs);
      this.lastLoadTime = Date.now();
      this.loaded.set(true);
    } catch {
      this.pairs.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Invalidates the cache and forces a reload on the next `load()` call.
   */
  invalidate(): void {
    this.pairs.set([]);
    this.loaded.set(false);
    this.lastLoadTime = 0;
  }

  private isLoadingStale(): boolean {
    return Date.now() - this.lastLoadTime > CACHE_TTL_MS;
  }
}
