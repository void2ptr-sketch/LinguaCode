import type { Environment } from './environment.types';

export const environment: Environment = {
  production: true,
  apiUrl: '/api',
  apiVersion: 'v1',
  fixturesUrl: '/data',
  appName: 'LinguaCode',
  useCardsApiMock: false,
  useScenariosApiMock: true,
  useCoursesApiMock: true,
  authEnabled: false,
};
