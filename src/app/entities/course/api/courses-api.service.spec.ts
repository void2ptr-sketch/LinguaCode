import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { buildApiUrl } from '../../../shared/api/api-url';
import { CoursesApiService, CourseWritePayload } from './courses-api.service';
import type { CourseIndexEntry, CourseWithPrograms } from '../model';

describe('CoursesApiService', () => {
  let service: CoursesApiService;
  let httpMock: HttpTestingController;

  const mockCourseWithPrograms: CourseWithPrograms = {
    id: 'course-1',
    title: 'Test Course',
    description: 'Test description',
    authorId: 'author-1',
    languagePair: { known: 'ru', learning: 'en' },
    programIds: ['program-1'],
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    programs: [
      {
        id: 'program-1',
        courseId: 'course-1',
        title: 'Lesson 1',
        description: '',
        lessonIds: ['lesson-1'],
        order: 0,
        updatedAt: '2024-01-01T00:00:00.000Z',
        lessons: [
          {
            id: 'lesson-1',
            programId: 'program-1',
            title: 'Lesson 1',
            description: '',
            scenarioIds: ['scenario-1'],
            prerequisiteLessonIds: [],
            order: 0,
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    ],
  };

  const mockCourseIndexEntry: CourseIndexEntry = {
    id: 'course-1',
    title: 'Test Course',
    authorId: 'author-1',
    programCount: 1,
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    languagePairSummary: 'Русский → English',
  };

  const mockPayload: CourseWritePayload = {
    title: 'Test Course',
    description: 'Test description',
    published: true,
    languagePair: { known: 'ru', learning: 'en' },
    programs: [
      {
        id: 'program-1',
        courseId: 'course-1',
        title: 'Lesson 1',
        description: '',
        lessonIds: ['lesson-1'],
        order: 0,
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CoursesApiService],
    });

    service = TestBed.inject(CoursesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('search', () => {
    it('should search courses and return paginated results', async () => {
      const mockPage = {
        items: [mockCourseIndexEntry],
        totalItems: 1,
        page: 0,
        pageSize: 20,
        totalPages: 1,
      };

      const promise = service.search({
        knownLanguage: 'ru',
        learningLanguage: 'en',
        page: { page: 0, pageSize: 20 },
      });

      const req = httpMock.expectOne((r) => r.url === buildApiUrl('/courses/search'));
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockPage });

      const result = await promise;
      expect(result).toEqual(mockPage);
    });
  });

  describe('getById', () => {
    it('should retrieve a course by ID', async () => {
      const promise = service.getById('course-1');

      const req = httpMock.expectOne(buildApiUrl('/courses/course-1'));
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockCourseWithPrograms });

      const result = await promise;
      expect(result).toEqual(mockCourseWithPrograms);
    });
  });

  describe('create', () => {
    it('should create a new course', async () => {
      const promise = service.create(mockPayload);

      const req = httpMock.expectOne(buildApiUrl('/courses'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockPayload);
      req.flush({ data: mockCourseWithPrograms });

      const result = await promise;
      expect(result).toEqual(mockCourseWithPrograms);
    });
  });

  describe('update', () => {
    it('should update an existing course', async () => {
      const promise = service.update('course-1', mockPayload);

      const req = httpMock.expectOne(buildApiUrl('/courses/course-1'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockPayload);
      req.flush({ data: mockCourseWithPrograms });

      const result = await promise;
      expect(result).toEqual(mockCourseWithPrograms);
    });
  });

  describe('delete', () => {
    it('should delete a course', async () => {
      const promise = service.delete('course-1');

      const req = httpMock.expectOne(buildApiUrl('/courses/course-1'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ data: null });

      const result = await promise;
      expect(result).toBeUndefined();
    });
  });

  describe('findUsingScenario', () => {
    it('should find courses using a specific scenario', async () => {
      const promise = service.findUsingScenario('scenario-1');

      const req = httpMock.expectOne(buildApiUrl('/courses/by-scenario/scenario-1'));
      expect(req.request.method).toBe('GET');
      req.flush({ data: [mockCourseIndexEntry] });

      const result = await promise;
      expect(result).toEqual([mockCourseIndexEntry]);
    });
  });
});
