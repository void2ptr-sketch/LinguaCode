import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserApiService } from '../../../entities/user/api/user-api.service';
import { UserPreferencesApiService } from '../../../entities/user/api/user-preferences-api.service';
import { buildPreferencesPayload } from '../../../entities/user/lib/user-preferences.mapper';
import { UserStore } from '../../../entities/user/model/user.store';
import type { AppColorScheme, UserPreferences } from '../../../entities/user/model';
import { LEARNING_PROFICIENCY_LEVELS } from '../../../entities/learning/model';
import type { LearningProficiencyLevel } from '../../../entities/learning/model';

/**
 * Page-scoped draft state for the profile form (`/user` page).
 *
 * @remarks
 * Provided by `UserPageComponent` so that all tab components share the same
 * draft signals: tab "Пользователь" edits the name/proficiency, tab
 * "Внешний вид" edits theme/font/scheme — but `saveProfile()` commits both
 * in a single call. Drafts are committed to `UserStore` (localStorage) and
 * persisted to the backend via two API calls:
 * - `PUT /users/me` — only `displayName` (backend `UserUpdateRequest` has no
 *   `preferences`)
 * - `PUT /users/me/preferences` — full preferences via the dedicated endpoint
 */
@Injectable()
export class UserProfileDraftService {
  private readonly userStore = inject(UserStore);
  private readonly userApi = inject(UserApiService);
  private readonly userPreferencesApi = inject(UserPreferencesApiService);
  private readonly snackBar = inject(MatSnackBar);

  /** Available learning proficiency level options. */
  readonly learningProficiencyOptions = LEARNING_PROFICIENCY_LEVELS;

  /** Draft value for the user's display name. */
  readonly nameDraft = signal(this.userStore.displayName());
  /** Draft value for the learning proficiency level. */
  readonly learningProficiencyDraft = signal<LearningProficiencyLevel>(
    this.userStore.preferences().learningProficiencyLevel,
  );
  /** Draft value for the application theme. */
  readonly themeDraft = signal(this.userStore.preferences().theme);
  /** Draft value for the font size preference. */
  readonly fontSizeDraft = signal<UserPreferences['fontSize']>(this.userStore.preferences().fontSize);
  /** Draft value for the color scheme (light/dark/system). */
  readonly colorSchemeDraft = signal<AppColorScheme>(this.userStore.preferences().colorScheme);
  /** Draft value for the card focus fullscreen preference. */
  readonly cardFocusFullscreenDraft = signal(this.userStore.preferences().cardFocusFullscreen);

  /**
   * Commits all draft form values to the `UserStore` and persists to backend.
   *
   * @remarks
   * Updates both the display name and all preferences (theme, font size,
   * color scheme, card focus fullscreen, learning proficiency level) in a
   * single call. Also saves per-pair settings (romanization, IPA, tone
   * colors, tracing) for all pairs via the mapper payload.
   */
  async saveProfile(): Promise<void> {
    // 1. User-level preferences (local + localStorage)
    this.userStore.updateDisplayName(this.nameDraft());
    this.userStore.updatePreferences({
      theme: this.themeDraft(),
      fontSize: this.fontSizeDraft(),
      colorScheme: this.colorSchemeDraft(),
      cardFocusFullscreen: this.cardFocusFullscreenDraft(),
      learningProficiencyLevel: this.learningProficiencyDraft(),
    });

    // 2a. Send displayName to the backend (PUT /users/me)
    try {
      await this.userApi.updateMe({
        displayName: this.nameDraft(),
      });
    } catch {
      this.snackBar.open('Не удалось сохранить имя', 'Закрыть', { duration: 5000 });
    }

    // 2b. Send ALL preferences to the backend (PUT /users/me/preferences)
    try {
      const payload = buildPreferencesPayload({
        theme: this.themeDraft(),
        fontSize: this.fontSizeDraft(),
        colorScheme: this.colorSchemeDraft(),
        cardFocusFullscreen: this.cardFocusFullscreenDraft(),
        learningProficiencyLevel: this.learningProficiencyDraft(),
        languagePairs: this.userStore.languagePairs(),
        activeLanguagePairId: this.userStore.activeLanguagePairId(),
        activeByMirrorGroup: this.userStore.activeByMirrorGroup(),
      });

      await this.userPreferencesApi.save(payload);
      this.snackBar.open('Профиль сохранён', 'Закрыть', { duration: 3000 });
    } catch {
      this.snackBar.open('Не удалось сохранить профиль', 'Закрыть', { duration: 5000 });
    }
  }
}
