import type { Environment } from './environment.types';

export const environment: Environment = {
  production: true,
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
