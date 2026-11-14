import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { buildApiUrl } from '../../../shared/api/api-url';
import { CoursesApiService, CourseWritePayload } from './courses-api.service';
import type { CourseIndexEntry, CourseWithPrograms } from '../model';
import { LanguagePairsApiService } from '../../language-pair/api';
import { AuthStore } from '../../auth/services/auth.store';

describe('CoursesApiService', () => {
  let service: CoursesApiService;
  let httpMock: HttpTestingController;

  const mockCourseWithPrograms: CourseWithPrograms = {
    id: 'course-1',
    title: 'Test Course',
    slug: 'test-course',
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
    slug: 'test-course',
    authorId: '1',
    programCount: 3,
    published: true,
    updatedAt: '2024-01-01T00:00:00.000Z',
    languagePairSummary: 'ru → en', // derived from languagePairId: 1
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

  /** Flushes pending microtasks so async request preparation completes. */
  const flushMicrotasks = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

  beforeEach(async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CoursesApiService,
        {
          provide: LanguagePairsApiService,
          useValue: {
            listAll: () => Promise.resolve([{ id: 1, knownCode: 'ru', learningCode: 'en' }]),
          },
        },
        {
          provide: AuthStore,
          useValue: {
            user: () => ({ id: '42', displayName: '', email: '', roles: [] }),
          },
        },
      ],
    });

    service = TestBed.inject(CoursesApiService);
    httpMock = TestBed.inject(HttpTestingController);

    // Reset the language pair cache between tests
    (
      service as unknown as { pairCacheLoaded: boolean; pairCache: Record<number, unknown> }
    ).pairCacheLoaded = false;
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
        slug: 'test-course',
        courseDescription: 'Test description',
        authorId: 1,
        languagePairId: 1,
        published: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        programCount: 3,
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

    it('normalises backend course fields to the frontend shape', async () => {
      const promise = service.getById('12');

      const req = httpMock.expectOne(buildApiUrl('/courses/12'));
      req.flush({
        data: {
          id: 12,
          title: 'Test',
          courseDescription: 'Backend description',
          authorId: 7,
          languagePairId: 1,
          published: true,
          authoringStatus: 'failed',
          authoringIdea: 'Idea',
          practiceSettings: '{"mode":"open"}',
        },
      });

      const result = (await promise) as unknown as Record<string, unknown>;
      expect(result['description']).toBe('Backend description');
      expect(result['authorId']).toBe('7');
      expect(result['languagePair']).toEqual({ known: 'ru', learning: 'en' });
      expect(result['authoring']).toEqual({ idea: 'Idea', status: 'failed' });
      expect(result['practiceSettings']).toEqual({ mode: 'open' });
    });
  });

  describe('create', () => {
    it('should create a new course', async () => {
      const promise = service.create(mockPayload);
      await flushMicrotasks();

      const req = httpMock.expectOne(buildApiUrl('/courses'));
      expect(req.request.method).toBe('POST');
      const body = req.request.body as Record<string, unknown>;
      expect(body['title']).toBe(mockPayload.title);
      expect(body['courseDescription']).toBe(mockPayload.description);
      expect(body['published']).toBe(mockPayload.published);
      expect(body['programs']).toEqual(mockPayload.programs);
      expect(body['authorId']).toBe(42);
      expect(body['languagePairId']).toBe(1);
      req.flush({ data: mockCourseWithPrograms });

      const result = await promise;
      expect(result).toEqual(mockCourseWithPrograms);
    });
  });

  describe('update', () => {
    it('should update an existing course', async () => {
      const promise = service.update('course-1', mockPayload);
      await flushMicrotasks();

      const req = httpMock.expectOne(buildApiUrl('/courses/course-1'));
      expect(req.request.method).toBe('PUT');
      const body = req.request.body as Record<string, unknown>;
      expect(body['title']).toBe(mockPayload.title);
      expect(body['courseDescription']).toBe(mockPayload.description);
      expect(body['published']).toBe(mockPayload.published);
      expect(body['languagePairId']).toBe(1);
      // Programs are persisted through ProgramsApiService, not the course update.
      expect(body['programs']).toBeUndefined();
      req.flush({ data: mockCourseWithPrograms });

      const result = await promise;
      expect(result).toEqual(mockCourseWithPrograms);
    });

    it('does not double-encode string practice settings', async () => {
      const promise = service.update('course-1', {
        ...mockPayload,
        practiceSettings: '{"mode":"open"}' as unknown as CourseWritePayload['practiceSettings'],
      });
      await flushMicrotasks();

      const req = httpMock.expectOne(buildApiUrl('/courses/course-1'));
      const body = req.request.body as Record<string, unknown>;
      expect(body['practiceSettings']).toBe('{"mode":"open"}');
      req.flush({ data: mockCourseWithPrograms });

      await promise;
    });

    it('forwards empty authoring fields so they can be cleared', async () => {
      const promise = service.update('course-1', {
        ...mockPayload,
        authoringStatus: 'draft',
        authoringIdea: '',
      });
      await flushMicrotasks();

      const req = httpMock.expectOne(buildApiUrl('/courses/course-1'));
      const body = req.request.body as Record<string, unknown>;
      expect(body['authoringStatus']).toBe('draft');
      expect(body['authoringIdea']).toBe('');
      req.flush({ data: mockCourseWithPrograms });

      await promise;
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
