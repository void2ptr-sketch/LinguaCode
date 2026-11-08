/**
 * Mock interceptor for the languages API.
 *
 * @remarks
 * Intercepts HTTP requests to `/languages` and returns mock language data
 * instead of hitting a real backend.
 *
 * Active when `environment.useLanguagePairsApiMock` is `true`.
 *
 * Supported requests:
 * - GET /languages — return all mock languages
 * - PATCH /languages/{id} — update a language's activeFlag
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
import type { ApiListResponse, ApiResponse } from '../../../../shared/api/api.types';
import type { LanguageDto } from '../language-dto.types';

/** Mock languages used during development without a live backend. */
const INITIAL_LANGUAGES: LanguageDto[] = [
  {
    id: 1,
    code: 'en',
    displayName: 'English',
    nativeName: 'English',
    writingDir: 'ltr',
    supportsTones: false,
    supportsPinyin: false,
    fontFamily: 'Noto Sans',
    activeFlag: true,
  },
  {
    id: 2,
    code: 'ru',
    displayName: 'Russian',
    nativeName: 'Русский',
    writingDir: 'ltr',
    supportsTones: false,
    supportsPinyin: false,
    fontFamily: 'Noto Sans',
    activeFlag: true,
  },
  {
    id: 3,
    code: 'zh',
    displayName: 'Chinese',
    nativeName: '中文',
    writingDir: 'ltr',
    supportsTones: true,
    supportsPinyin: true,
    fontFamily: 'Noto Sans',
    activeFlag: true,
  },
  {
    id: 4,
    code: 'cpp',
    displayName: 'C++',
    nativeName: 'C++',
    writingDir: 'ltr',
    supportsTones: false,
    supportsPinyin: false,
    fontFamily: 'Noto Sans',
    activeFlag: true,
  },
  {
    id: 5,
    code: 'perl',
    displayName: 'Perl',
    nativeName: 'Perl',
    writingDir: 'ltr',
    supportsTones: false,
    supportsPinyin: false,
    fontFamily: 'Noto Sans',
    activeFlag: true,
  },
  {
    id: 6,
    code: 'hs',
    displayName: 'Haskell',
    nativeName: 'Haskell',
    writingDir: 'ltr',
    supportsTones: false,
    supportsPinyin: false,
    fontFamily: 'Noto Sans',
    activeFlag: true,
  },
  {
    id: 7,
    code: 'rs',
    displayName: 'Rust',
    nativeName: 'Rust',
    writingDir: 'ltr',
    supportsTones: false,
    supportsPinyin: false,
    fontFamily: 'Noto Sans',
    activeFlag: true,
  },
  {
    id: 8,
    code: 'js',
    displayName: 'JavaScript',
    nativeName: 'JavaScript',
    writingDir: 'ltr',
    supportsTones: false,
    supportsPinyin: false,
    fontFamily: 'Noto Sans',
    activeFlag: true,
  },
];

/** Mutable copy of mock languages for PATCH operations. */
let mockLanguagesState: LanguageDto[] = [...INITIAL_LANGUAGES];

/**
 * Resets languages to the original mock entries.
 *
 * @example
 * ```ts
 * // In browser DevTools console:
 * (window as any).__resetLanguages();
 * location.reload();
 * ```
 */
(window as unknown as { __resetLanguages: () => void }).__resetLanguages = () => {
  mockLanguagesState = [...INITIAL_LANGUAGES];
  console.log('Languages reset to', mockLanguagesState.length, 'entries');
};

/**
 * Extracts the language ID from an API URL.
 *
 * @param url - The request URL to check.
 * @returns The language ID, or `null` if the URL does not target a specific language.
 */
const extractLanguageId = (url: string): number | null => {
  const prefix = `${buildApiUrl('/languages/')}`;
  if (!url.includes(prefix)) {
    return null;
  }

  const idStr = url.slice(url.indexOf(prefix) + prefix.length).split(/[?#]/)[0];
  const id = Number(idStr);
  return Number.isFinite(id) ? id : null;
};

/**
 * HTTP interceptor that mocks language API responses for development.
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The mocked response observable.
 */
export const languagesApiMockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const languageId = extractLanguageId(req.url);

  // PATCH /languages/{id} — update a language (e.g. toggle activeFlag)
  if (req.method === 'PATCH' && languageId) {
    const index = mockLanguagesState.findIndex((l) => l.id === languageId);
    if (index === -1) {
      return of(
        new HttpResponse<ApiResponse<LanguageDto>>({
          status: 404,
          statusText: 'Not Found',
          body: { data: null as unknown as LanguageDto },
        }),
      );
    }

    const current = { ...mockLanguagesState[index] };
    const payload = req.body as Record<string, unknown>;

    // Update supported fields
    if (payload['activeFlag'] !== undefined) {
      current.activeFlag = Boolean(payload['activeFlag']);
    }
    if (payload['code'] !== undefined) {
      current.code = String(payload['code']);
    }
    if (payload['displayName'] !== undefined) {
      current.displayName = String(payload['displayName']);
    }
    if (payload['nativeName'] !== undefined) {
      current.nativeName = String(payload['nativeName']);
    }
    if (payload['writingDir'] !== undefined) {
      current.writingDir = String(payload['writingDir']);
    }

    const updated = { ...current };
    const newLanguages = [...mockLanguagesState];
    newLanguages[index] = updated;
    mockLanguagesState = newLanguages;

    return of(
      new HttpResponse<ApiResponse<LanguageDto>>({
        status: 200,
        body: { data: updated },
      }),
    );
  }

  // GET /languages — return all languages
  if (req.method === 'GET' && req.url.endsWith(buildApiUrl('/languages'))) {
    const languages = mockLanguagesState;
    return of(
      new HttpResponse<ApiListResponse<LanguageDto>>({
        status: 200,
        body: { data: languages, total: languages.length },
      }),
    );
  }

  // Pass other requests through to the backend
  return next(req);
};
