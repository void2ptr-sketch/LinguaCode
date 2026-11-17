/**
 * Mock interceptor for Reference Settings API endpoints.
 *
 * @remarks
 * Intercepts HTTP requests to reference settings endpoints and returns
 * hardcoded default values — matching the fallback defaults in
 * `AppSettingsService`.
 *
 * Active when `environment.useReferenceSettingsApiMock` is `true`.
 *
 * Supported requests:
 * - GET /reference/settings/validation → ValidationRulesResponse
 * - GET /reference/settings/pagination → PaginationSettingsResponse
 * - GET /reference/settings/sync       → SyncSettingsResponse
 * - GET /reference/settings/chinese    → ChineseSettingsResponse
 *
 * @example
 * ```typescript
 * // In environment.ts:
 * export const environment = {
 *   useReferenceSettingsApiMock: true,
 *   // ...
 * };
 * ```
 */
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { isApiRequest } from '../api-url';
import type { ValidationRulesResponse } from '../generated/models';
import type { PaginationSettingsResponse } from '../generated/models';
import type { SyncSettingsResponse } from '../generated/models';
import type { ChineseSettingsResponse } from '../generated/models';

/** Default validation rules (matches AppSettingsService fallbacks). */
const DEFAULT_VALIDATION: ValidationRulesResponse = {
  maxTitleLength: 200,
  maxDescriptionLength: 2000,
  maxTagsPerEntity: 10,
  requireTags: false,
};

/** Default pagination settings (matches AppSettingsService fallbacks). */
const DEFAULT_PAGINATION: PaginationSettingsResponse = {
  defaultPageSize: 50,
  maxPageSize: 200,
};

/** Default sync settings (matches AppSettingsService fallbacks). */
const DEFAULT_SYNC: SyncSettingsResponse = {
  maxBatchSize: 500,
  syncTimeoutSeconds: 300,
};

/** Default Chinese content settings (matches AppSettingsService fallbacks). */
const DEFAULT_CHINESE: ChineseSettingsResponse = {
  showPinyin: true,
  showTones: true,
  showHanzi: true,
  pinyinPosition: 'above',
};

/**
 * HTTP interceptor that mocks reference settings API responses for development.
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The mocked response observable.
 */
export const referenceSettingsApiMockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  // GET /reference/settings/validation
  if (req.method === 'GET' && req.url.endsWith('/api/v1/reference/settings/validation')) {
    return of(
      new HttpResponse({ status: 200, body: { data: DEFAULT_VALIDATION } }),
    );
  }

  // GET /reference/settings/pagination
  if (req.method === 'GET' && req.url.endsWith('/api/v1/reference/settings/pagination')) {
    return of(
      new HttpResponse({ status: 200, body: { data: DEFAULT_PAGINATION } }),
    );
  }

  // GET /reference/settings/sync
  if (req.method === 'GET' && req.url.endsWith('/api/v1/reference/settings/sync')) {
    return of(
      new HttpResponse({ status: 200, body: { data: DEFAULT_SYNC } }),
    );
  }

  // GET /reference/settings/chinese
  if (req.method === 'GET' && req.url.endsWith('/api/v1/reference/settings/chinese')) {
    return of(
      new HttpResponse({ status: 200, body: { data: DEFAULT_CHINESE } }),
    );
  }

  // Pass through
  return next(req);
};
