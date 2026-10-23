export type Environment = {
  production: boolean;
  apiUrl: string;
  /** Версия API, добавляется к базовому URL: `/api/v1/...`. */
  apiVersion: string;
  fixturesUrl: string;
  appName: string;
  useCardsApiMock: boolean;
  useScenariosApiMock: boolean;
  useCoursesApiMock: boolean;
  useProgramsApiMock: boolean;
  /** Включает реальный auth-поток (токен/refresh). */
  authEnabled: boolean;
};
