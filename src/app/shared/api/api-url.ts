import { environment } from '../../../environments/environment';

/**
 * Builds a full API URL by prepending the configured API base URL to the given path.
 *
 * Ensures the path always starts with a leading slash.
 *
 * @param path - The relative API path (e.g. `'cards/search'`).
 * @returns The complete API URL string.
 */
export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${environment.apiUrl}${normalizedPath}`;
};

/**
 * Builds a full fixture URL by prepending the configured fixtures base URL to the given path.
 *
 * Ensures the path always starts with a leading slash.
 *
 * @param path - The relative fixture path.
 * @returns The complete fixture URL string.
 */
export const buildFixtureUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${environment.fixturesUrl}${normalizedPath}`;
};

/**
 * Checks whether a URL is an API request.
 *
 * @param url - The URL to check.
 * @returns `true` if the URL starts with the configured API base URL.
 */
export const isApiRequest = (url: string): boolean => url.startsWith(environment.apiUrl);
