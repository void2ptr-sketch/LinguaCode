import { environment } from '../../../environments/environment';

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${environment.apiUrl}${normalizedPath}`;
};

export const buildFixtureUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${environment.fixturesUrl}${normalizedPath}`;
};

export const isApiRequest = (url: string): boolean => url.startsWith(environment.apiUrl);
