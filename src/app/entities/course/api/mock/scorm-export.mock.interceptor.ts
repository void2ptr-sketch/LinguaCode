import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { buildApiUrl } from '../../../../shared/api/api-url';
import { environment } from '../../../../../environments/environment';

import type { ScormExportBundle } from './scorm-export.types';

/**
 * Extracts the course ID from a SCORM export URL.
 *
 * @param url - The request URL.
 * @returns The course ID, or `null` if the URL does not target a SCORM export.
 */
const extractScormCourseId = (url: string): string | null => {
  const prefix = `${buildApiUrl('/courses/')}`;
  const suffix = '/scorm-export';

  if (!url.includes(prefix) || !url.endsWith(suffix)) {
    return null;
  }

  const rest = url.slice(url.indexOf(prefix) + prefix.length, -suffix.length);
  return rest || null;
};

/**
 * HTTP interceptor that mocks SCORM export responses for development.
 *
 * @remarks
 * Loads pre-generated SCORM export fixtures from `public/data/export/`
 * when `environment.useScormMock` is enabled. The fixture file name
 * matches the course ID: `<courseId>-scorm.json`.
 *
 * @param req - The outgoing HTTP request.
 * @param next - The next interceptor in the chain.
 * @returns The mocked response observable.
 */
export const scormExportMockInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useScormMock) {
    return next(req);
  }

  const courseId = extractScormCourseId(req.url);
  if (req.method === 'GET' && courseId) {
    return loadScormFixture(courseId).pipe(
      map((data) => new HttpResponse({ status: 200, body: { data } })),
      catchError(() => {
        // Fixture not found — pass through to real API
        return next(req);
      }),
    );
  }

  return next(req);
};

/**
 * Loads a SCORM export fixture from the public data directory.
 *
 * @param courseId - The course ID used to locate the fixture file.
 * @returns An observable emitting the parsed `ScormExportBundle`.
 */
function loadScormFixture(courseId: string): Observable<ScormExportBundle> {
  return new Observable<ScormExportBundle>((observer) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/data/export/${courseId}-scorm.json`);
    xhr.onload = () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText) as ScormExportBundle;
          observer.next(data);
          observer.complete();
        } catch {
          observer.error(new Error(`Failed to parse SCORM fixture for course: ${courseId}`));
        }
      } else {
        observer.error(new HttpErrorResponse({ status: xhr.status, statusText: 'Not Found' }));
      }
    };
    xhr.onerror = () => observer.error(xhr.statusText);
    xhr.send();
  });
}
