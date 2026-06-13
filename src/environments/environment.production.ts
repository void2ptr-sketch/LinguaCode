import type { Environment } from './environment.types';

export const environment: Environment = {
  production: true,
  apiUrl: '/api',
  fixturesUrl: '/data',
  appName: 'LinguaCode',
  useCardsApiMock: false,
  useScenariosApiMock: false,
};
