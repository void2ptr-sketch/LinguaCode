import type { UserPreferences } from '../../../shared/api/generated/models';

/**
 * Порт для операций с пользовательскими предпочтениями.
 *
 * @remarks
 * Абстракция над бэкенд-API `/api/v1/users/me/preferences`.
 * Позволяет подменять источник данных (бэкенд, mock, localStorage) без изменения бизнес-логики.
 */
export type UserPreferencesPort = {
  /** Загрузить предпочтения пользователя с бэкенда. */
  load(): Promise<UserPreferences | null>;

  /** Полностью заменить предпочтения пользователя. */
  save(prefs: UserPreferences): Promise<void>;

  /** Сбросить предпочтения к значениям по умолчанию. */
  reset(): Promise<void>;
};
