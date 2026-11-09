/**
 * Окружение для разработки.
 *
 * Интеграция с реальным бэкендом (apiUrl).
 * Mock-интерсепторы отключены — запросы идут к реальному бэкенду.
 *
 * Для временного включения mock-интерсепторов установите нужные флаги в true.
 * В этом случае запросы будут идти к mock-обработчикам вместо бэкенда.
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
  useCardsApiMock: false,
  useScenariosApiMock: false,
  useCoursesApiMock: false,
  useProgramsApiMock: false,
  useScormMock: false,
  useLanguagePairsApiMock: false,
  useAuthApiMock: false,
  authEnabled: true,
};
