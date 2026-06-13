export type Environment = {
  production: boolean;
  apiUrl: string;
  appName: string;
};

export const environment: Environment = {
  production: false,
  apiUrl: '/api',
  appName: 'LinguaCode',
};
