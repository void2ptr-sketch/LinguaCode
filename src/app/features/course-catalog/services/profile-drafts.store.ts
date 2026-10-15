import { Injectable, computed, signal, type Signal } from '@angular/core';
import type { AppColorScheme, UserPreferences } from '../../../entities/user/model';
import type { LearningProficiencyLevel } from '../../../entities/learning/model';
import {
  initialProfileDraftsState,
  type ProfileDraftsState,
} from '../models/profile-drafts-store';

/**
 * Store черновиков профиля пользователя (форма настроек).
 *
 * Черновики инициализируются из `UserStore` и персистятся обратно
 * через `UserStore.updateDisplayName()` / `UserStore.updatePreferences()`.
 */
@Injectable({ providedIn: 'root' })
export class ProfileDraftsStore {
  #state = signal<ProfileDraftsState>({ ...initialProfileDraftsState });

  /** Черновик отображаемого имени. */
  get nameDraft(): Signal<string> {
    return computed(() => this.#state().nameDraft);
  }

  /** Черновик уровня подготовки. */
  get learningProficiencyDraft(): Signal<LearningProficiencyLevel> {
    return computed(() => this.#state().learningProficiencyDraft);
  }

  /** Черновик темы оформления. */
  get themeDraft(): Signal<AppColorScheme> {
    return computed(() => this.#state().themeDraft);
  }

  /** Черновик размера шрифта. */
  get fontSizeDraft(): Signal<UserPreferences['fontSize']> {
    return computed(() => this.#state().fontSizeDraft);
  }

  /** Черновик цветовой схемы. */
  get colorSchemeDraft(): Signal<AppColorScheme> {
    return computed(() => this.#state().colorSchemeDraft);
  }

  /** Черновик полноэкранного режима карточки. */
  get cardFocusFullscreenDraft(): Signal<boolean> {
    return computed(() => this.#state().cardFocusFullscreenDraft);
  }

  setNameDraft(name: string): void {
    this.#state.update((s) => ({ ...s, nameDraft: name }));
  }

  setLearningProficiencyDraft(level: LearningProficiencyLevel): void {
    this.#state.update((s) => ({ ...s, learningProficiencyDraft: level }));
  }

  setThemeDraft(theme: AppColorScheme): void {
    this.#state.update((s) => ({ ...s, themeDraft: theme }));
  }

  setFontSizeDraft(size: UserPreferences['fontSize']): void {
    this.#state.update((s) => ({ ...s, fontSizeDraft: size }));
  }

  setColorSchemeDraft(scheme: AppColorScheme): void {
    this.#state.update((s) => ({ ...s, colorSchemeDraft: scheme }));
  }

  setCardFocusFullscreenDraft(enabled: boolean): void {
    this.#state.update((s) => ({ ...s, cardFocusFullscreenDraft: enabled }));
  }

  /**
   * Инициализирует все черновики профиля из пользовательских настроек.
   */
  initializeFromPreferences(
    name: string,
    proficiency: LearningProficiencyLevel,
    theme: AppColorScheme,
    fontSize: UserPreferences['fontSize'],
    colorScheme: AppColorScheme,
    cardFocusFullscreen: boolean,
  ): void {
    this.#state.update((s) => ({
      ...s,
      nameDraft: name,
      learningProficiencyDraft: proficiency,
      themeDraft: theme,
      fontSizeDraft: fontSize,
      colorSchemeDraft: colorScheme,
      cardFocusFullscreenDraft: cardFocusFullscreen,
    }));
  }
}