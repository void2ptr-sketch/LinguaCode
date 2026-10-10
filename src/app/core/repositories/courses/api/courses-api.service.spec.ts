import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CoursesApiService, CourseWritePayload } from './courses-api.service';
import type { CourseIndexEntry, CourseWithLessons } from '../../../../core/models';

describe('CoursesApiService', () => {
  let service: CoursesApiService;
  let httpMock: HttpTestingController;

  const mockCourseWithLessons: CourseWithLessons = {
    id: 'course-1',
    title: 'Test Course',
    description: 'Test description',
    authorId: 'author-1',
    languagePair: { known: 'ru', learning: 'en' },
    lessonIds: ['lesson-1'],
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    lessons: [
      {
        id: 'lesson-1',
        title: 'Lesson 1',
        description: '',
        courseId: 'course-1',
        scenarioIds: ['scenario-1'],
        prerequisiteLessonIds: [],
        order: 0,
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  };

  const mockCourseIndexEntry: CourseIndexEntry = {
    id: 'course-1',
    title: 'Test Course',
    authorId: 'author-1',
    lessonCount: 1,
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    languagePairSummary: 'Русский → English',
  };

  const mockPayload: CourseWritePayload = {
    title: 'Test Course',
    description: 'Test description',
    published: true,
    languagePair: { known: 'ru', learning: 'en' },
    lessons: [
      {
        id: 'lesson-1',
        title: 'Lesson 1',
        description: '',
        scenarioIds: ['scenario-1'],
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

      const req = httpMock.expectOne((r) => r.url === '/api/courses/search');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockPage });

      const result = await promise;
      expect(result).toEqual(mockPage);
    });
  });

  describe('getById', () => {
    it('should retrieve a course by ID', async () => {
      const promise = service.getById('course-1');

      const req = httpMock.expectOne('/api/courses/course-1');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockCourseWithLessons });

      const result = await promise;
      expect(result).toEqual(mockCourseWithLessons);
    });
  });

  describe('create', () => {
    it('should create a new course', async () => {
      const promise = service.create(mockPayload);

      const req = httpMock.expectOne('/api/courses');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockPayload);
      req.flush({ data: mockCourseWithLessons });

      const result = await promise;
      expect(result).toEqual(mockCourseWithLessons);
    });
  });

  describe('update', () => {
    it('should update an existing course', async () => {
      const promise = service.update('course-1', mockPayload);

      const req = httpMock.expectOne('/api/courses/course-1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockPayload);
      req.flush({ data: mockCourseWithLessons });

      const result = await promise;
      expect(result).toEqual(mockCourseWithLessons);
    });
  });

  describe('delete', () => {
    it('should delete a course', async () => {
      const promise = service.delete('course-1');

      const req = httpMock.expectOne('/api/courses/course-1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ data: null });

      const result = await promise;
      expect(result).toBeUndefined();
    });
  });

  describe('findUsingScenario', () => {
    it('should find courses using a specific scenario', async () => {
      const promise = service.findUsingScenario('scenario-1');

      const req = httpMock.expectOne('/api/courses/by-scenario/scenario-1');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [mockCourseIndexEntry] });

      const result = await promise;
      expect(result).toEqual([mockCourseIndexEntry]);
    });
  });
});
