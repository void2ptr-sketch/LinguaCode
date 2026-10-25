import { HttpEvent, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';

import { scormExportMockInterceptor } from './scorm-export.mock.interceptor';
import { buildApiUrl } from '../../../../shared/api/api-url';

import type { ScormExportBundle } from './scorm-export.types';

describe('scormExportMockInterceptor', () => {
  const fakeBundle: ScormExportBundle = {
    format: 'linguacode-scorm-export',
    version: 1,
    exportedAt: '2024-01-01T00:00:00.000Z',
    manifest: {
      identifier: 'course-1',
      title: 'Test Course',
      description: '',
      organizations: [],
    },
    courses: [],
    programs: [],
    lessons: [],
    scenarios: [],
    cards: [],
    xapiStatements: [],
  };

  /**
   * Helper to create a simple passthrough interceptor for testing.
   * Returns a mocked HttpResponse when the request matches SCORM export URL.
   */
  const testInterceptor: HttpHandlerFn = (req) => {
    const url = req.url;
    const prefix = `${buildApiUrl('/courses/')}`;
    const suffix = '/scorm-export';

    if (url.includes(prefix) && url.endsWith(suffix)) {
      return new Observable<HttpEvent<unknown>>((observer) => {
        observer.next(new HttpResponse({ status: 200, body: { data: fakeBundle } }));
        observer.complete();
      });
    }

    return new Observable<HttpEvent<unknown>>((observer) => {
      observer.complete();
    });
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([scormExportMockInterceptor, testInterceptor])),
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be defined', () => {
    expect(scormExportMockInterceptor).toBeDefined();
  });

  it('should match SCORM export URL pattern', () => {
    const url = buildApiUrl('/courses/course-123/scorm-export');
    expect(url).toContain('/courses/course-123/scorm-export');
  });
});
