/**
 * Окружение для разработки.
 *
 * Интеграция с реальным бэкендом (apiUrl).
 * Mock-интерсепторы ЗАБЛОКИРОВАНЫ — runtime-гард в provideApiHttp()
 * выбросит ошибку при попытке включить любой mock-флаг.
 *
 * Для локальной разработки без бэкенда:
 * 1. Скопируйте этот файл в environment.local.ts
 * 2. Установите нужные флаги в true
 * 3. Импортируйте environment.local.ts вместо environment.ts в app.config.ts
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
  useLessonsApiMock: false,
  useScormMock: false,
  useLanguagePairsApiMock: false,
  useAuthApiMock: false,
  authEnabled: true,
};
