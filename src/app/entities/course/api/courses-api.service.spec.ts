import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { buildApiUrl } from '../../../shared/api/api-url';
import { CoursesApiService, CourseWritePayload } from './courses-api.service';
import type { CourseIndexEntry, CourseWithPrograms } from '../model';
import { LanguagePairsApiService } from '../../language-pair/api';

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
    id: '1',
    title: 'Test Course',
    authorId: '1',
    programCount: 0,
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    languagePairSummary: '1', // derived from languagePairId: 1
    knownLanguage: 'ru',
    learningLanguage: 'en',
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

  beforeEach(async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CoursesApiService,
        {
          provide: LanguagePairsApiService,
          useValue: { listAll: () => Promise.resolve([{ id: 1, knownCode: 'ru', learningCode: 'en' }]) },
        },
      ],
    });

    service = TestBed.inject(CoursesApiService);
    httpMock = TestBed.inject(HttpTestingController);

    // Reset the language pair cache between tests
    (service as unknown as { pairCacheLoaded: boolean; pairCache: Record<number, unknown> }).pairCacheLoaded = false;
    (service as unknown as { pairCache: Record<number, unknown> }).pairCache = {};
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('search', () => {
    it('should search courses and return paginated results', async () => {
      const mockDto = {
        id: 1,
        title: 'Test Course',
        courseDescription: 'Test description',
        authorId: 1,
        languagePairId: 1,
        published: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const expectedPage = {
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

      // Wait for async operations to complete
      await Promise.resolve();
      await Promise.resolve();

      // Flush language-pairs request if present (from ensurePairCache)
      const lpMatches = httpMock.match((r) => r.url.indexOf('/language-pairs') !== -1);
      for (const match of lpMatches) {
        match.flush({ data: [{ id: 1, knownCode: 'ru', learningCode: 'en' }] });
      }

      // Flush courses search request
      const coursesMatches = httpMock.match((r) => r.url.indexOf('/courses/search') !== -1);
      expect(coursesMatches.length).toBeGreaterThan(0);
      coursesMatches[0].flush({ data: [mockDto] });

      const result = await promise;
      expect(result).toEqual(expectedPage);
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
      const body = req.request.body as Record<string, unknown>;
      expect(body['title']).toBe(mockPayload.title);
      expect(body['courseDescription']).toBe(mockPayload.description);
      expect(body['published']).toBe(mockPayload.published);
      expect(body['programs']).toEqual(mockPayload.programs);
      expect(body['authorId']).toBeDefined();
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
      const body = req.request.body as Record<string, unknown>;
      expect(body['title']).toBe(mockPayload.title);
      expect(body['courseDescription']).toBe(mockPayload.description);
      expect(body['published']).toBe(mockPayload.published);
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
