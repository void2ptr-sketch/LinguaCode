import { TestBed } from '@angular/core/testing';

import { CoursesApiService } from '../../repositories/courses/api/courses-api.service';
import { CoursesCatalogMockHandler } from './courses-catalog.mock.handler';
import { coursesApiMockInterceptor } from './courses-api.mock.interceptor';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

describe('CoursesCatalogMockHandler', () => {
  let api: CoursesApiService;
  let handler: CoursesCatalogMockHandler;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        CoursesApiService,
        CoursesCatalogMockHandler,
        provideHttpClient(withFetch(), withInterceptors([coursesApiMockInterceptor])),
      ],
    });

    api = TestBed.inject(CoursesApiService);
    handler = TestBed.inject(CoursesCatalogMockHandler);
  });

  afterEach(() => {
    localStorage.clear();
    handler.resetCache();
  });

  it('finds courses using a scenario', async () => {
    const courses = await api.findUsingScenario('lesson-1-scenario-1');

    expect(Array.isArray(courses)).toBe(true);
  });

  it('returns empty array for non-existent scenario', async () => {
    const courses = await api.findUsingScenario('non-existent-scenario');

    expect(Array.isArray(courses)).toBe(true);
    expect(courses.length).toBe(0);
  });

  it('clears cached data on resetCache', async () => {
    // Ensure data is loaded
    await api.search({ scope: 'all', learningLanguage: 'en', page: { page: 0, pageSize: 10 } });

    handler.resetCache();

    // Next access should reload data
    const page = await api.search({ scope: 'all', learningLanguage: 'en', page: { page: 0, pageSize: 10 } });
    expect(page.items).toBeDefined();
  });

  it('returns course with lessons sorted by order', async () => {
    const course = await api.getById('demo-course');

    expect(course).toBeDefined();
    expect(course.lessons.length).toBeGreaterThan(0);

    // Verify lessons are sorted by order
    for (let i = 1; i < course.lessons.length; i++) {
      expect(course.lessons[i].order).toBeGreaterThanOrEqual(course.lessons[i - 1].order);
    }
  });
});
