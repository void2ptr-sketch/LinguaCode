import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { buildApiUrl } from '../../../shared/api/api-url';
import { ScormExportService } from './scorm-export.service';

import type { ScormExportBundle } from './mock/scorm-export.types';

describe('ScormExportService', () => {
  let service: ScormExportService;
  let httpMock: HttpTestingController;

  const mockBundle: ScormExportBundle = {
    format: 'linguacode-scorm-export',
    version: 1,
    exportedAt: '2024-01-01T00:00:00.000Z',
    manifest: {
      identifier: 'course-1',
      title: 'Test Course',
      description: 'Test description',
      organizations: [],
    },
    courses: [],
    programs: [],
    lessons: [],
    scenarios: [],
    cards: [],
    xapiStatements: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ScormExportService],
    });

    service = TestBed.inject(ScormExportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('export', () => {
    it('should call correct endpoint', async () => {
      const courseId = 'course-123';
      const promise = service.export(courseId);

      const req = httpMock.expectOne(buildApiUrl(`/scorm/export/courses/${courseId}`));
      expect(req.request.method).toBe('GET');

      req.flush({ data: mockBundle });
      const result = await promise;

      expect(result).toEqual(mockBundle);
    });

    it('should return unwrapped data from ApiResponse', async () => {
      const courseId = 'radicals-214';
      const promise = service.export(courseId);

      const req = httpMock.expectOne(buildApiUrl(`/scorm/export/courses/${courseId}`));
      expect(req.request.method).toBe('GET');

      req.flush({ data: mockBundle });
      const result = await promise;

      expect(result).toBe(mockBundle);
      expect(result.format).toBe('linguacode-scorm-export');
      expect(result.version).toBe(1);
    });

    it('should handle HTTP errors', async () => {
      const courseId = 'missing-course';
      const promise = service.export(courseId);

      const req = httpMock.expectOne(buildApiUrl(`/scorm/export/courses/${courseId}`));
      expect(req.request.method).toBe('GET');

      req.flush(
        { message: 'Course not found', code: 'NOT_FOUND' },
        { status: 404, statusText: 'Not Found' },
      );

      await expect(promise).rejects.toThrow();
    });
  });
});
