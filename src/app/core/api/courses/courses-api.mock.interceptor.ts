import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { parseCourseSearchCriteria } from './courses-api.params.utils';
import { isApiRequest } from '../api-url';
import { CoursesCatalogMockHandler } from './courses-catalog.mock.handler';

import type { CourseWritePayload } from '../../repositories/courses/api/courses-api.service';

/**
 * Checks whether the given URL is a courses search request.
 *
 * @param url - The request URL to check.
 * @returns `true` if the URL is an API request targeting `/courses/search`.
 */
const isCoursesSearchRequest = (url: string): boolean =>
  isApiRequest(url) && url.includes('/courses/search');

/**
 * Extracts the course ID from an API URL.
 *
 * @param url - The request URL.
 * @returns The course ID, or `null` if the URL does not target a specific course.
 */
const extractCourseId = (url: string): string | null => {
  const prefix = `${environment.apiUrl}/courses/`;
  if (!url.includes(prefix)) {
    return null;
  }

  const rest = url.slice(url.indexOf(prefix) + prefix.length).split(/[?#]/)[0];
  if (!rest || rest === 'search') {
    return null;
  }

  if (rest.startsWith('by-scenario/')) {
    return null;
  }

  return rest;
};

/**
 * Extracts the scenario ID from a "courses by scenario" URL.
 *
 * @param url - The request URL.
 * @returns The scenario ID, or `null` if the URL does not target a scenario.
 */
const extractScenarioIdFromCourseUsage = (url: string): string | null => {
  const marker = `${environment.apiUrl}/courses/by-scenario/`;
  if (!url.includes(marker)) {
    return null;
  }

  return url.slice(url.indexOf(marker) + marker.length).split(/[?#]/)[0] || null;
};

/**
 * HTTP interceptor that mocks courses API responses for development.
 *
 * @remarks
 * Handles GET (search, getById, by-scenario), POST (create), PUT (update),
 * and DELETE requests for the courses endpoint. Delegates to
 * `CoursesCatalogMockHandler` for data operations.
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The mocked response observable.
 */
export const coursesApiMockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const handler = inject(CoursesCatalogMockHandler);

  if (req.method === 'GET' && isCoursesSearchRequest(req.url)) {
    const criteria = parseCourseSearchCriteria(req.params);

    return defer(() => handler.search(criteria)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  const usageScenarioId = extractScenarioIdFromCourseUsage(req.url);
  if (req.method === 'GET' && usageScenarioId) {
    return defer(() => handler.findUsingScenario(usageScenarioId)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  const courseId = extractCourseId(req.url);
  if (req.method === 'GET' && courseId) {
    return defer(() => handler.getById(courseId)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  if (req.method === 'POST' && req.url.endsWith(`${environment.apiUrl}/courses`)) {
    const payload = req.body as CourseWritePayload;

    return defer(() => handler.create(payload)).pipe(
      map((data) => new HttpResponse({ status: 201, body: { data } })),
    );
  }

  if (req.method === 'PUT' && courseId) {
    const payload = req.body as CourseWritePayload;

    return defer(() => handler.update(courseId, payload)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  if (req.method === 'DELETE' && courseId) {
    return defer(() => handler.delete(courseId)).pipe(
      map(() => new HttpResponse({ status: 200, body: { data: null } })),
    );
  }

  return next(req);
};
