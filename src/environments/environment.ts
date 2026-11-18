/**
 * Окружение для разработки.
 *
 * Интеграция с реальным бэкендом (apiUrl).
 * Mock-интерсепторы включены по умолчанию для работы без бэкенда.
 * Для использования реального бэкенда — установите все `use*ApiMock: false`.
 *
 * @see environment.production.ts — продакшен-окружение (mock отключены)
 */
import type { Environment } from './environment.types';

/**
 * Конфигурация окружения для разработки.
 *
 * Используется для:
 * - Включения/отключения mock-интерсепторов
 * - Настройки URL API и fixtures
 * - Определения имени приложения
 */
export const environment: Environment = {
  production: false,
  apiUrl: '/api',
  apiVersion: 'v1',
  fixturesUrl: '/data',
  appName: 'LinguaCode',
  // Cards must come from the real backend (DB) so that the catalog search
  // filters (course/program/lesson/scenario) work against real hierarchy IDs.
  useCardsApiMock: true,
  useScenariosApiMock: true,
  useCoursesApiMock: true,
  useProgramsApiMock: true,
  useLessonsApiMock: true,
  useScormMock: true,
  useLanguagePairsApiMock: true,
  useAuthApiMock: true,
  useReferenceSettingsApiMock: true,
  authEnabled: false,
};
