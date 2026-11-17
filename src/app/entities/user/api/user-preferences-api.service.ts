import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { UserPreferencesService } from '../../../shared/api/generated/user-preferences';
import type { UserPreferences } from '../../../shared/api/generated/models';
import type { UserPreferencesPort } from '../repository/user-preferences.port';

/**
 * HTTP API-сервис для операций с пользовательскими предпочтениями.
 *
 * @remarks
 * Реализует `UserPreferencesPort` через сгенерированный `UserPreferencesService`.
 * Эндпоинт: `/api/v1/users/me/preferences`.
 */
@Injectable({ providedIn: 'root' })
export class UserPreferencesApiService implements UserPreferencesPort {
  private readonly prefsApi = inject(UserPreferencesService);

  /**
   * Загружает предпочтения пользователя.
   *
   * @returns Promise с `UserPreferences` или `null`, если данные отсутствуют.
   */
  async load(): Promise<UserPreferences | null> {
    const response = await firstValueFrom(this.prefsApi.userPreferencesGet());
    return response.data ?? null;
  }

  /**
   * Полностью заменяет предпочтения пользователя.
   *
   * @param prefs — новые предпочтения.
   */
  async save(prefs: UserPreferences): Promise<void> {
    // Pass object directly — HttpClient auto-serializes to JSON.
    await firstValueFrom(this.prefsApi.userPreferencesPut(prefs));
  }

  /**
   * Сбрасывает предпочтения к значениям по умолчанию.
   */
  async reset(): Promise<void> {
    await firstValueFrom(this.prefsApi.userPreferencesDelete());
  }
}
