import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { CoursePdfExportService } from './course-pdf-export.service';
import { CoursesApiService } from '../../../entities/course';

describe('CoursePdfExportService', () => {
  let service: CoursePdfExportService;
  let coursesApiMock: { getBundle: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();

    coursesApiMock = {
      getBundle: vi.fn().mockResolvedValue({ scenarios: [], cards: [] }),
    };

    TestBed.configureTestingModule({
      providers: [
        CoursePdfExportService,
        { provide: CoursesApiService, useValue: coursesApiMock },
      ],
    });

    service = TestBed.inject(CoursePdfExportService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });
});
