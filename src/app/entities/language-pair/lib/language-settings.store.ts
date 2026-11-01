import { Injectable, computed, inject, signal } from '@angular/core';

import { LanguageService } from './language.service';
import type { LanguageDto } from '../api/language-dto.types';

/** Stored settings for a user's language configuration. */
type LanguageSettings = {
  /** Selected language codes that the user wants to use. */
  selectedCodes: string[];
  /** Active language pair ID (from backend language-pairs table). */
  activePairId: string | null;
  /** All available pairs the user has configured. */
  configuredPairs: {
    id: string;
    known: string;
    learning: string;
  }[];
};

/** Default settings when nothing is configured. */
const DEFAULT_SETTINGS: LanguageSettings = {
  selectedCodes: [],
  activePairId: null,
  configuredPairs: [],
};

/**
 * Store for user language preferences.
 *
 * @remarks
 * Manages:
 * - Which languages are available (selected from backend list)
 * - Which language pairs are configured
 * - Which pair is currently active
 *
 * Persists to sessionStorage under `lingua-code.language-settings`.
 */
@Injectable({ providedIn: 'root' })
export class LanguageSettingsStore {
  private readonly languageService = inject(LanguageService);

  readonly #state = signal<LanguageSettings>(loadSettings());

  /** Currently selected language codes. */
  readonly selectedCodes = computed(() => {
    const settings = this.#state();
    // If no languages selected, use all available from backend
    if (settings.selectedCodes.length === 0) {
      return this.languageService.getCodes();
    }
    // Filter to only codes that still exist in backend
    const allCodes = this.languageService.getCodes();
    return settings.selectedCodes.filter((code) => allCodes.includes(code));
  });

  /** Active pair ID. */
  readonly activePairId = computed(() => {
    const settings = this.#state();
    return settings.activePairId;
  });

  /** Configured language pairs. */
  readonly configuredPairs = computed(() => {
    const settings = this.#state();
    return settings.configuredPairs;
  });

  /** Number of available languages for the user. */
  readonly availableLanguagesCount = computed(() => this.selectedCodes().length);

  /**
   * Loads settings from sessionStorage.
   */
  constructor() {
    // Settings loaded lazily on first access
  }

  /**
   * Loads language settings from storage.
   */
  private load(): void {
    const settings = loadSettings();
    this.#state.set(settings);
  }

  /**
   * Persists current state to sessionStorage.
   */
  private persist(): void {
    sessionStorage.setItem('lingua-code.language-settings', JSON.stringify(this.#state()));
  }

  /**
   * Returns all available language options (from backend).
   */
  getAvailableLanguages(): LanguageDto[] {
    return this.languageService.languages();
  }

  /**
   * Adds a language to the user's selection.
   *
   * @param code - The ISO 639-1 code.
   */
  addLanguage(code: string): void {
    if (this.selectedCodes().includes(code)) {
      return;
    }
    const allCodes = this.languageService.getCodes();
    if (!allCodes.includes(code)) {
      return;
    }

    this.#state.update((s) => ({
      ...s,
      selectedCodes: [...s.selectedCodes, code],
    }));
    this.persist();
  }

  /**
   * Removes a language from the user's selection.
   *
   * @param code - The ISO 639-1 code.
   */
  removeLanguage(code: string): void {
    const newCodes = this.selectedCodes().filter((c) => c !== code);
    this.#state.update((s) => ({
      ...s,
      selectedCodes: newCodes,
    }));
    this.persist();
  }

  /**
   * Sets multiple languages at once (full replace).
   *
   * @param codes - Array of ISO 639-1 codes.
   */
  setSelectedLanguages(codes: string[]): void {
    const allCodes = this.languageService.getCodes();
    // Filter to only valid, active codes
    const validCodes = codes.filter((c) => allCodes.includes(c));
    this.#state.update((s) => ({
      ...s,
      selectedCodes: validCodes,
    }));
    this.persist();
  }

  /**
   * Sets the active language pair.
   *
   * @param pairId - The pair ID (must exist in configuredPairs).
   */
  setActivePair(pairId: string): void {
    const pairs = this.configuredPairs();
    if (!pairs.find((p) => p.id === pairId)) {
      return;
    }
    this.#state.update((s) => ({
      ...s,
      activePairId: pairId,
    }));
    this.persist();
  }

  /**
   * Creates a new language pair from selected languages.
   *
   * @param known - Known language code.
   * @param learning - Learning language code.
   * @returns The new pair's generated ID.
   */
  createPair(known: string, learning: string): string {
    const id = crypto.randomUUID();
    const newPairs = [...this.configuredPairs(), { id, known, learning }];
    this.#state.update((s) => ({
      ...s,
      configuredPairs: newPairs,
      activePairId: s.activePairId || id,
    }));
    this.persist();
    return id;
  }

  /**
   * Removes a language pair.
   *
   * @param pairId - The pair ID to remove.
   */
  removePair(pairId: string): void {
    const newPairs = this.configuredPairs().filter((p) => p.id !== pairId);
    const newActive =
      this.activePairId() === pairId ? (newPairs[0]?.id ?? null) : this.activePairId();
    this.#state.update((s) => ({
      ...s,
      configuredPairs: newPairs,
      activePairId: newActive,
    }));
    this.persist();
  }

  /**
   * Returns the currently active pair (or first configured).
   */
  getActivePair(): { known: string; learning: string } | null {
    const pairs = this.configuredPairs();
    if (pairs.length === 0) {
      return null;
    }
    const active = pairs.find((p) => p.id === this.activePairId());
    return active || pairs[0];
  }
}

/** Loads settings from sessionStorage, falling back to defaults. */
function loadSettings(): LanguageSettings {
  try {
    const raw = sessionStorage.getItem('lingua-code.language-settings');
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_SETTINGS;
}
