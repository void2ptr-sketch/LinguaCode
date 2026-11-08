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
  /** Включает mock для SCORM-экспорта курсов. */
  useScormMock: boolean;
  /** Включает mock для language-pairs API. */
  useLanguagePairsApiMock: boolean;
  /** Включает mock для auth API (login/refresh/logout). */
  useAuthApiMock: boolean;
  /** Включает реальный auth-поток (токен/refresh). */
  authEnabled: boolean;
};
