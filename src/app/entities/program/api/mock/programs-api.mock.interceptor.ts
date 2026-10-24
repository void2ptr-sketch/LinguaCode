import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer } from 'rxjs';
import { map } from 'rxjs';

import { buildApiUrl, isApiRequest } from '../../../../shared/api/api-url';
import { ProgramsCatalogMockHandler } from './programs-catalog.mock.handler';

import type { ProgramWritePayload } from '../programs-api.service';

/**
 * Checks whether the given URL is a programs search request.
 *
 * @param url - The request URL to check.
 * @returns `true` if the URL is an API request targeting `/programs/search`.
 */
const isProgramsSearchRequest = (url: string): boolean =>
  isApiRequest(url) && url.includes('/programs/search');

/**
 * Extracts the program ID from an API URL.
 *
 * @param url - The request URL.
 * @returns The program ID, or `null` if the URL does not target a specific program.
 */
const extractProgramId = (url: string): string | null => {
  const prefix = `${buildApiUrl('/programs/')}`;
  if (!url.includes(prefix)) {
    return null;
  }

  const rest = url.slice(url.indexOf(prefix) + prefix.length).split(/[?#]/)[0];
  if (!rest || rest === 'search' || rest.startsWith('by-course/')) {
    return null;
  }

  return rest;
};

/**
 * Extracts the course ID from a "programs/by-course/:courseId" URL.
 *
 * @param url - The request URL.
 * @returns The course ID, or `null` if the URL does not target programs by course.
 */
const extractCourseIdFromByCourse = (url: string): string | null => {
  const marker = `${buildApiUrl('/programs/by-course/')}`;
  if (!url.includes(marker)) {
    return null;
  }

  return url.slice(url.indexOf(marker) + marker.length).split(/[?#]/)[0] || null;
};

/**
 * HTTP interceptor that mocks programs API responses for development.
 *
 * @remarks
 * Handles GET (search, getById, getByCourse), POST (create), PUT (update),
 * and DELETE requests for the programs endpoint. Delegates to
 * `ProgramsCatalogMockHandler` for data operations.
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The mocked response observable.
 */
export const programsApiMockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const handler = inject(ProgramsCatalogMockHandler);

  if (req.method === 'GET' && isProgramsSearchRequest(req.url)) {
    const criteria = parseProgramSearchCriteria(req.params);

    return defer(() => handler.search(criteria)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  const courseId = extractCourseIdFromByCourse(req.url);
  if (req.method === 'GET' && courseId) {
    return defer(() => handler.getByCourse(courseId)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  const programId = extractProgramId(req.url);
  if (req.method === 'GET' && programId) {
    return defer(() => handler.getById(programId)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  if (req.method === 'POST' && req.url.endsWith(buildApiUrl('/programs'))) {
    // Convert backend field names back to frontend format for the mock handler
    const raw = req.body as Record<string, unknown>;
    const payload: ProgramWritePayload = {
      id: raw['id'] as string | undefined,
      courseId: String(raw['courseId'] ?? ''),
      title: String(raw['title'] ?? ''),
      description: String(raw['programDescription'] ?? ''),
      lessonIds: (raw['lessonIds'] as readonly string[] ?? []),
      order: Number(raw['order'] ?? 0),
    };

    return defer(() => handler.create(payload)).pipe(
      map((data) => new HttpResponse({ status: 201, body: { data } })),
    );
  }

  if (req.method === 'PUT' && programId) {
    // Convert backend field names back to frontend format for the mock handler
    const raw = req.body as Record<string, unknown>;
    const payload: ProgramWritePayload = {
      id: raw['id'] as string | undefined,
      courseId: String(raw['courseId'] ?? ''),
      title: String(raw['title'] ?? ''),
      description: String(raw['programDescription'] ?? ''),
      lessonIds: (raw['lessonIds'] as readonly string[] ?? []),
      order: Number(raw['order'] ?? 0),
    };

    return defer(() => handler.update(programId, payload)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  if (req.method === 'DELETE' && programId) {
    return defer(() => handler.delete(programId)).pipe(
      map(() => new HttpResponse({ status: 200, body: { data: null } })),
    );
  }

  return next(req);
};

/**
 * Parses program search criteria from HTTP request params.
 *
 * @param params - The HTTP params.
 * @returns Parsed `ProgramSearchCriteria`.
 */
function parseProgramSearchCriteria(
  params: import('@angular/common/http').HttpParams,
): import('../../model').ProgramSearchCriteria {
  const query = params.get('query') || undefined;
  const courseId = params.get('courseId') || undefined;

  const pageParam = params.get('page');
  const pageSizeParam = params.get('pageSize');

  return {
    query,
    courseId,
    page: {
      page: pageParam !== null ? parseInt(pageParam, 10) : 0,
      pageSize: pageSizeParam !== null ? parseInt(pageSizeParam, 10) : 20,
    },
  };
}
