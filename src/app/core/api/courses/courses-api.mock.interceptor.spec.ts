import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { CoursesApiService } from '../../repositories/courses/api/courses-api.service';
import { coursesApiMockInterceptor } from './courses-api.mock.interceptor';

describe('courses API (mock interceptor)', () => {
  let api: CoursesApiService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        CoursesApiService,
        provideHttpClient(withFetch(), withInterceptors([coursesApiMockInterceptor])),
      ],
    });

    api = TestBed.inject(CoursesApiService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('searches courses via GET /api/courses/search', async () => {
    const page = await api.search({
      scope: 'all',
      learningLanguage: 'en',
      page: { page: 0, pageSize: 10 },
    });

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.totalItems).toBeGreaterThan(0);
  });

  it('loads course by id via GET /api/courses/:id', async () => {
    const course = await api.getById('demo-course');

    expect(course).toBeDefined();
    expect(course.id).toBe('demo-course');
  });

  it('returns 404 for unknown course id', async () => {
    await expect(api.getById('missing-course')).rejects.toThrow();
  });

  it('finds courses using a scenario via GET /api/courses/by-scenario/:id', async () => {
    const courses = await api.findUsingScenario('lesson-1-scenario-1');

    expect(Array.isArray(courses)).toBe(true);
  });

  it('searches courses with all criteria params', async () => {
    const page = await api.search({
      query: 'test',
      scope: 'published',
      knownLanguage: 'zh',
      learningLanguage: 'en',
      page: { page: 0, pageSize: 5 },
    });

    expect(page.items).toBeDefined();
    expect(page.totalItems).toBeDefined();
  });
});
