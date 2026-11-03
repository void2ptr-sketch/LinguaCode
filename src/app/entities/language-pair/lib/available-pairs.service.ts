import { computed, inject, Injectable, signal } from '@angular/core';
import { LanguageService } from './language.service';
import { LanguageSettingsStore } from './language-settings.store';
import { LanguagePairsApiService } from '../api/language-pairs-api.service';
import type { LanguagePairDto } from '../api/language-pairs-api.types';

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
   * Loads pairs from the backend and filters them by available languages.
   *
   * @returns Promise that resolves when loading completes.
   */
  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const allPairs = await this.pairsApi.listAll();
      this.pairs.set(allPairs);
    } catch {
      this.pairs.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
