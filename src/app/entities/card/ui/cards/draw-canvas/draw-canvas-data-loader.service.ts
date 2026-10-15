import { Injectable, signal, DestroyRef, inject } from '@angular/core';
import { HanziDataService } from '../../../../chinese/lib/services';
import type {
  HanziCharacterModel,
  HanziLoadState,
} from '../../../../chinese/model';

/**
 * Service managing async loading of Hanzi character data and radical characters.
 *
 * @remarks
 * Handles loading, caching, and state management for Hanzi characters used
 * in ghost overlays, tracing animations, and radical hints. Exposes signals
 * that the component subscribes to for reactive updates.
 *
 * This service replaces the syncHanziCharacter and syncRadicalCharacters
 * methods that were previously embedded in DrawCanvasComponent.
 */
@Injectable({ providedIn: 'root' })
export class DrawCanvasDataLoaderService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly hanziData = inject(HanziDataService);

  // --- Hanzi character state ---
  readonly hanziModel = signal<HanziCharacterModel | null>(null);
  readonly hanziLoadState = signal<HanziLoadState>('idle');

  // --- Radical characters state ---
  readonly radicalModels = signal<ReadonlyMap<string, HanziCharacterModel>>(new Map());
  readonly radicalLoadState = signal<HanziLoadState>('idle');

  // --- Active request tracking ---
  private activeCharacterRequest = '';
  private activeRadicalsRequest = '';

  constructor() {
    // Clean up on destroy
    this.destroyRef.onDestroy(() => {
      this.activeCharacterRequest = '';
      this.activeRadicalsRequest = '';
    });
  }

  /**
   * Loads a Hanzi character model asynchronously.
   *
   * @param character - The Chinese character to load. Empty string clears the model.
   * @remarks
   * Checks cache first, then loads from HanziDataService.
   * Only updates signals if the requested character matches the current request.
   * This prevents race conditions when the character changes rapidly.
   */
  async loadCharacter(character: string): Promise<void> {
    const trimmed = character.trim();

    // Clear if empty
    if (!trimmed) {
      this.hanziModel.set(null);
      this.hanziLoadState.set('idle');
      return;
    }

    // Check cache first
    const cached = this.hanziData.getCachedModel(trimmed);
    if (cached) {
      this.hanziModel.set(cached);
      this.hanziLoadState.set('ready');
      return;
    }

    // Check if missing or errored
    const state = this.hanziData.getLoadState(trimmed);
    if (state === 'missing') {
      this.hanziModel.set(null);
      this.hanziLoadState.set('missing');
      return;
    }

    // Loading
    this.hanziLoadState.set('loading');
    const model = await this.hanziData.loadCharacter(trimmed);

    // Only update if this is still the active request
    if (this.activeCharacterRequest !== trimmed) {
      return;
    }

    this.activeCharacterRequest = trimmed;
    this.hanziModel.set(model);
    this.hanziLoadState.set(model ? 'ready' : this.hanziData.getLoadState(trimmed));
  }

  /**
   * Loads radical character models asynchronously.
   *
   * @param characters - Array of radical characters to load.
   * @remarks
   * Loads all characters in a batch via HanziDataService.loadCharacters().
   * Only updates signals if the requested characters match the current request.
   * This prevents race conditions when radical hints change rapidly.
   */
  async loadRadicals(characters: readonly string[]): Promise<void> {
    if (characters.length === 0) {
      this.radicalModels.set(new Map());
      this.radicalLoadState.set('idle');
      return;
    }

    // Check if all are already cached or missing/errored
    const allCached = characters.every(
      (character) =>
        this.hanziData.hasCachedData(character) ||
        this.hanziData.getLoadState(character) === 'missing' ||
        this.hanziData.getLoadState(character) === 'error',
    );

    if (!allCached) {
      this.radicalLoadState.set('loading');
    }

    const models = await this.hanziData.loadCharacters(characters);
    const currentKey = characters.join('\u0000');

    // Only update if this is still the active request
    if (currentKey !== this.activeRadicalsRequest && this.activeRadicalsRequest !== '') {
      return;
    }

    this.activeRadicalsRequest = currentKey;
    this.radicalModels.set(models);
    this.radicalLoadState.set(models.size > 0 ? 'ready' : 'missing');
  }

  /**
   * Clears radical character models and resets state.
   * Called when switching away from radicals mode.
   */
  clearRadicals(): void {
    this.radicalModels.set(new Map());
    this.radicalLoadState.set('idle');
    this.activeRadicalsRequest = '';
  }

  /**
   * Checks if a radical character has a stroke model available.
   *
   * @param character - The radical character to check.
   * @returns true if the character has a loaded model with strokes.
   */
  hasRadicalStrokeModel(character: string): boolean {
    const model = this.radicalModels().get(character.trim());
    return Boolean(model && model.strokes.length > 0);
  }
}
