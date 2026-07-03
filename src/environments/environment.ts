/**
 * Окружение для разработки.
 *
 * Включает mock-интерсепторы для работы без бэкенда.
 * Данные загружаются из файлов в папке public/data/.
 *
 * Mock-интерсепторы:
 * - useCardsApiMock: true — использует ContentSeedRepository для карточек
 * - useScenariosApiMock: true — использует ContentSeedRepository для сценариев
 * - useCoursesApiMock: true — использует ContentSeedRepository для курсов
 *
 * Для отключения mock-интерсепторов установите значения в false.
 * В этом случае запросы будут идти к реальному бэкенду (apiUrl).
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
  fixturesUrl: '/data',
  appName: 'LinguaCode',
  useCardsApiMock: true,
  useScenariosApiMock: true,
  useCoursesApiMock: true,
};
