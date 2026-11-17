import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer } from 'rxjs';
import { map } from 'rxjs';

import { buildApiUrl, isApiRequest } from '../../../../shared/api/api-url';
import { LessonsCatalogMockHandler } from './lessons-catalog.mock.handler';

import type { LessonCreatePayload, LessonUpdatePayload } from '../lessons-api.service';

/**
 * Checks whether the given URL is a lessons search request.
 *
 * @param url - The request URL to check.
 * @returns `true` if the URL is an API request targeting `/lessons/search`.
 */
const isLessonsSearchRequest = (url: string): boolean =>
  isApiRequest(url) && url.includes('/lessons/search');

/**
 * Extracts the lesson ID from an API URL.
 *
 * @param url - The request URL.
 * @returns The lesson ID, or `null` if the URL does not target a specific lesson.
 */
const extractLessonId = (url: string): string | null => {
  const prefix = `${buildApiUrl('/lessons/')}`;
  if (!url.includes(prefix)) {
    return null;
  }

  const rest = url.slice(url.indexOf(prefix) + prefix.length).split(/[?#]/)[0];
  if (
    !rest ||
    rest === 'search' ||
    rest.startsWith('by-program/') ||
    rest.startsWith('by-course/')
  ) {
    return null;
  }

  return rest;
};

/**
 * Extracts the program ID from a "lessons/by-program/:programId" URL.
 *
 * @param url - The request URL.
 * @returns The program ID, or `null` if the URL does not target lessons by program.
 */
const extractProgramIdFromByProgram = (url: string): string | null => {
  const marker = `${buildApiUrl('/lessons/by-program/')}`;
  if (!url.includes(marker)) {
    return null;
  }

  return url.slice(url.indexOf(marker) + marker.length).split(/[?#]/)[0] || null;
};

/**
 * Extracts the course ID from a "lessons/by-course/:courseId" URL.
 *
 * @param url - The request URL.
 * @returns The course ID, or `null` if the URL does not target lessons by course.
 */
const extractCourseIdFromByCourse = (url: string): string | null => {
  const marker = `${buildApiUrl('/lessons/by-course/')}`;
  if (!url.includes(marker)) {
    return null;
  }

  return url.slice(url.indexOf(marker) + marker.length).split(/[?#]/)[0] || null;
};

/**
 * HTTP interceptor that mocks lessons API responses for development.
 *
 * @remarks
 * Handles GET (byId, getByProgramId, getByCourseId), POST (create), PUT (update),
 * and DELETE requests for the lessons endpoint. Delegates to
 * `LessonsCatalogMockHandler` for data operations.
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The mocked response observable.
 */
export const lessonsApiMockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }

  const handler = inject(LessonsCatalogMockHandler);

  if (req.method === 'GET' && isLessonsSearchRequest(req.url)) {
    return next(req);
  }

  const courseId = extractCourseIdFromByCourse(req.url);
  if (req.method === 'GET' && courseId) {
    return defer(() => handler.getByCourseId(courseId)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  const programId = extractProgramIdFromByProgram(req.url);
  if (req.method === 'GET' && programId) {
    return defer(() => handler.getByProgramId(programId)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  const lessonId = extractLessonId(req.url);
  if (req.method === 'GET' && lessonId) {
    return defer(() => handler.getById(lessonId)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  if (req.method === 'POST' && req.url.endsWith(buildApiUrl('/lessons'))) {
    // Convert backend field names back to frontend format for the mock handler
    const raw = req.body as Record<string, unknown>;
    const payload: LessonCreatePayload = {
      programId: String(raw['programId'] ?? ''),
      title: String(raw['title'] ?? ''),
      description: String(raw['lessonDescription'] ?? ''),
      order: Number(raw['lessonOrder'] ?? 0),
      prerequisiteLessonIds: parsePrerequisiteLessonIds(
        raw['prerequisiteLessonIds'] as string | undefined,
      ),
      published: raw['published'] as boolean | undefined,
      requiredTier: (raw['requiredTier'] as LessonCreatePayload['requiredTier']) ?? 'FREE',
    };

    return defer(() => handler.create(payload)).pipe(
      map((data) => new HttpResponse({ status: 201, body: { data } })),
    );
  }

  if (req.method === 'PUT' && lessonId) {
    // Convert backend field names back to frontend format for the mock handler
    const raw = req.body as Record<string, unknown>;
    const payload: LessonUpdatePayload = {
      title: String(raw['title'] ?? ''),
      description: String(raw['lessonDescription'] ?? ''),
      order: Number(raw['lessonOrder'] ?? 0),
      prerequisiteLessonIds: parsePrerequisiteLessonIds(
        raw['prerequisiteLessonIds'] as string | undefined,
      ),
    };

    return defer(() => handler.update(lessonId, payload)).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
    );
  }

  if (req.method === 'DELETE' && lessonId) {
    return defer(() => handler.delete(lessonId)).pipe(
      map(() => new HttpResponse({ status: 200, body: { data: null } })),
    );
  }

  return next(req);
};

/**
 * Parses the raw JSON string of prerequisite lesson IDs from a DTO.
 *
 * @param raw - Raw JSON string (e.g. `'["1","2"]'`), or `undefined`.
 * @returns Array of lesson IDs; empty when missing or malformed.
 */
function parsePrerequisiteLessonIds(raw: string | undefined): readonly string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((id) => String(id));
  } catch {
    return [];
  }
}
