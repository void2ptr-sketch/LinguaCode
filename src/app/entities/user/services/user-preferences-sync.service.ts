import { Injectable, computed, inject, signal } from '@angular/core';

import type { UserPreferences } from '../../../shared/api/generated/models';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import { UserPreferencesApiService } from '../api/user-preferences-api.service';

/**
 * Сервис синхронизации пользовательских предпочтений с бэкендом.
 *
 * @remarks
 * При инициализации загружает `UserPreferences` из `GET /api/v1/users/me/preferences`
 * и выставляет `selectedCourseId` как derived signal.
 * Выбор курса сохраняется через PUT на тот же эндпоинт.
 */
@Injectable({ providedIn: 'root' })
export class UserPreferencesSyncService {
  private readonly prefsApi = inject(UserPreferencesApiService);
  private readonly logger = inject(AppLoggerService);

  private readonly backendPrefs = signal<UserPreferences | null>(null);

  /** ID выбранного курса (или `null`, если курс не выбран). */
  readonly selectedCourseId = computed(() => {
    const raw = this.backendPrefs()?.selectedCourseId;
    return raw != null ? String(raw) : null;
  });

  constructor() {
    this.loadPreferences();
  }

  /**
   * Загружает предпочтения пользователя с бэкенда.
   *
   * @remarks
   * Ошибки логируются — сервис корректно декомпозируется в локальный режим,
   * когда API недоступен.
   */
  async loadPreferences(): Promise<void> {
    try {
      const prefs = await this.prefsApi.load();
      this.backendPrefs.set(prefs);
    } catch {
      this.logger.error('[UserPreferencesSync] Failed to load preferences');
    }
  }

  /**
   * Сохраняет выбранный курс на бэкенд.
   *
   * @param courseId — ID курса (строка, конвертируется в number).
   */
  async saveSelectedCourse(courseId: string): Promise<void> {
    const numericId = Number(courseId);
    if (isNaN(numericId)) {
      return;
    }

    try {
      const current = this.backendPrefs() ?? {};
      const updated: UserPreferences = { ...current, selectedCourseId: numericId };
      await this.prefsApi.save(updated);
      this.backendPrefs.set(updated);
    } catch {
      this.logger.error('[UserPreferencesSync] Failed to save selectedCourseId');
    }
  }
}
