/**
 * Mock interceptor for the language pairs API.
 *
 * @remarks
 * Intercepts HTTP requests to `/language-pairs` and returns hardcoded
 * language pair data instead of hitting a real backend.
 *
 * Active when `environment.useLanguagePairsApiMock` is `true`.
 *
 * Supported requests:
 * - GET /language-pairs — return all known language pairs
 *
 * @example
 * ```typescript
 * // In environment.ts:
 * export const environment = {
 *   useLanguagePairsApiMock: true,
 *   // ...
 * };
 * ```
 */
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { buildApiUrl, isApiRequest } from '../../../../shared/api/api-url';
import type { ApiListResponse } from '../../../../shared/api/api.types';
import type { LanguagePairDto } from '../language-pairs-api.types';

/** Hardcoded language pairs used during development without a live backend. */
const MOCK_LANGUAGE_PAIRS: LanguagePairDto[] = [
  { id: 1, knownCode: 'en', learningCode: 'ru' },
  { id: 2, knownCode: 'en', learningCode: 'zh' },
  { id: 3, knownCode: 'ru', learningCode: 'en' },
  { id: 4, knownCode: 'ru', learningCode: 'zh' },
  { id: 5, knownCode: 'zh', learningCode: 'en' },
  { id: 6, knownCode: 'zh', learningCode: 'ru' },
  { id: 7, knownCode: 'en', learningCode: 'ja' },
  { id: 8, knownCode: 'en', learningCode: 'de' },
  { id: 9, knownCode: 'de', learningCode: 'en' },
  { id: 10, knownCode: 'ja', learningCode: 'en' },
  { id: 11, knownCode: 'fr', learningCode: 'en' },
  { id: 12, knownCode: 'en', learningCode: 'fr' },
  { id: 13, knownCode: 'en', learningCode: 'ko' },
  { id: 14, knownCode: 'ko', learningCode: 'en' },
  { id: 15, knownCode: 'es', learningCode: 'en' },
  { id: 16, knownCode: 'en', learningCode: 'es' },
  { id: 17, knownCode: 'ru', learningCode: 'ja' },
  { id: 18, knownCode: 'ja', learningCode: 'ru' },
  { id: 19, knownCode: 'cpp', learningCode: 'en' },
  { id: 20, knownCode: 'cpp', learningCode: 'zh' },
  { id: 21, knownCode: 'cpp', learningCode: 'ru' },
  { id: 22, knownCode: 'java', learningCode: 'en' },
  { id: 23, knownCode: 'java', learningCode: 'zh' },
  { id: 24, knownCode: 'java', learningCode: 'ru' },
  { id: 25, knownCode: 'perl', learningCode: 'en' },
];

/**
 * HTTP interceptor that mocks language pairs API responses for development.
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The mocked response observable.
 */
export const languagePairsApiMockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url) || req.method !== 'GET') {
    return next(req);
  }

  if (!req.url.endsWith(buildApiUrl('/language-pairs'))) {
    return next(req);
  }

  return of(
    new HttpResponse<ApiListResponse<LanguagePairDto>>({
      status: 200,
      body: { data: MOCK_LANGUAGE_PAIRS, total: MOCK_LANGUAGE_PAIRS.length },
    }),
  );
};
