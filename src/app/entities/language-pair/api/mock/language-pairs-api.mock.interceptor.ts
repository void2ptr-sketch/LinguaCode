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
 * - POST /language-pairs — create a new language pair
 * - DELETE /language-pairs/:id — delete a language pair
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
const INITIAL_LANGUAGE_PAIRS: LanguagePairDto[] = [
  { id: 1, knownCode: 'en', learningCode: 'ru' },
  { id: 2, knownCode: 'en', learningCode: 'zh' },
  { id: 3, knownCode: 'ru', learningCode: 'en' },
  { id: 4, knownCode: 'ru', learningCode: 'zh' },
  { id: 5, knownCode: 'zh', learningCode: 'en' },
  { id: 6, knownCode: 'zh', learningCode: 'ru' },
  { id: 7, knownCode: 'en', learningCode: 'cpp' },
  { id: 8, knownCode: 'zh', learningCode: 'cpp' },
  { id: 9, knownCode: 'ru', learningCode: 'cpp' },
  { id: 10, knownCode: 'en', learningCode: 'perl' },
  { id: 11, knownCode: 'ru', learningCode: 'perl' },
  { id: 12, knownCode: 'en', learningCode: 'hs' },
  { id: 13, knownCode: 'ru', learningCode: 'hs' },
  { id: 14, knownCode: 'en', learningCode: 'rs' },
  { id: 15, knownCode: 'ru', learningCode: 'rs' },
  { id: 16, knownCode: 'en', learningCode: 'js' },
  { id: 17, knownCode: 'ru', learningCode: 'js' },
];

/** Mutable language pairs — starts as a copy of INITIAL_LANGUAGE_PAIRS. */
let MOCK_LANGUAGE_PAIRS: LanguagePairDto[] = [...INITIAL_LANGUAGE_PAIRS];

/**
 * Resets language pairs to the original 31 mock entries.
 *
 * @example
 * ```ts
 * // In browser DevTools console:
 * (window as any).__resetLanguagePairs();
 * location.reload();
 * ```
 */
(window as any).__resetLanguagePairs = () => {
  MOCK_LANGUAGE_PAIRS = [...INITIAL_LANGUAGE_PAIRS];
  console.log('Language pairs reset to', MOCK_LANGUAGE_PAIRS.length, 'entries');
};

/**
 * HTTP interceptor that mocks language pairs API responses for development.
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The mocked response observable.
 */
export const languagePairsApiMockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const baseUrl = buildApiUrl('/language-pairs');

  // ── GET /language-pairs ────────────────────────────────────────
  if (req.method === 'GET' && req.url.endsWith(baseUrl)) {
    return of(
      new HttpResponse<ApiListResponse<LanguagePairDto>>({
        status: 200,
        body: { data: MOCK_LANGUAGE_PAIRS, total: MOCK_LANGUAGE_PAIRS.length },
      }),
    );
  }

  // ── POST /language-pairs (create) ──────────────────────────────
  if (req.method === 'POST' && req.url === baseUrl) {
    const body = req.body as { knownCode: string; learningCode: string } | undefined;
    if (!body?.knownCode || !body.learningCode) {
      return of(
        new HttpResponse({
          status: 400,
          body: { message: 'knownCode and learningCode are required' },
        }),
      );
    }

    const newId = Math.max(...MOCK_LANGUAGE_PAIRS.map((p) => p.id), 0) + 1;
    const newPair: LanguagePairDto = {
      id: newId,
      knownCode: body.knownCode,
      learningCode: body.learningCode,
    };
    MOCK_LANGUAGE_PAIRS = [...MOCK_LANGUAGE_PAIRS, newPair];

    return of(
      new HttpResponse<LanguagePairDto>({
        status: 201,
        body: newPair,
      }),
    );
  }

  // ── DELETE /language-pairs/:id ─────────────────────────────────
  if (req.method === 'DELETE' && req.url.startsWith(baseUrl + '/')) {
    const idStr = req.url.split('/').pop();
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return of(new HttpResponse({ status: 400 }));
    }

    const before = MOCK_LANGUAGE_PAIRS.length;
    MOCK_LANGUAGE_PAIRS = MOCK_LANGUAGE_PAIRS.filter((p) => p.id !== id);
    if (MOCK_LANGUAGE_PAIRS.length === before) {
      return of(new HttpResponse({ status: 404, body: { message: 'Not found' } }));
    }

    return of(new HttpResponse<void>({ status: 204 }));
  }

  // ── PATCH /language-pairs/:id (update) ─────────────────────────
  if (req.method === 'PATCH' && req.url.startsWith(baseUrl + '/')) {
    const idStr = req.url.split('/').pop();
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return of(new HttpResponse({ status: 400 }));
    }

    const idx = MOCK_LANGUAGE_PAIRS.findIndex((p) => p.id === id);
    if (idx === -1) {
      return of(new HttpResponse({ status: 404, body: { message: 'Not found' } }));
    }

    const body = req.body as { knownCode?: string; learningCode?: string } | undefined;
    if (body?.knownCode) {
      MOCK_LANGUAGE_PAIRS[idx] = { ...MOCK_LANGUAGE_PAIRS[idx], knownCode: body.knownCode };
    }
    if (body?.learningCode) {
      MOCK_LANGUAGE_PAIRS[idx] = { ...MOCK_LANGUAGE_PAIRS[idx], learningCode: body.learningCode };
    }

    return of(
      new HttpResponse<LanguagePairDto>({
        status: 200,
        body: MOCK_LANGUAGE_PAIRS[idx],
      }),
    );
  }

  return next(req);
};
