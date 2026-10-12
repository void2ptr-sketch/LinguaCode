import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ContentLanguage } from '../../../../core/models';

import { CoursesApiService } from '../courses-api.service';
import { CoursesCatalogMockHandler } from './courses-catalog.mock.handler';
import { coursesApiMockInterceptor } from './courses-api.mock.interceptor';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

const makeLanguagePair = (known: ContentLanguage, learning: ContentLanguage) => ({ known, learning });

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

  describe('search', () => {
    it('returns paginated results', async () => {
      const page = await api.search({ scope: 'all', learningLanguage: 'en', page: { page: 0, pageSize: 10 } });

      expect(page.items).toBeDefined();
      expect(Array.isArray(page.items)).toBe(true);
      expect(page.totalItems).toBeGreaterThan(0);
      expect(page.page).toBe(0);
      expect(page.pageSize).toBe(10);
    });

    it('returns paginated results with scope filter', async () => {
      const page = await api.search({ scope: 'published', learningLanguage: 'en' as ContentLanguage, page: { page: 0, pageSize: 10 } });

      expect(page.items).toBeDefined();
      expect(page.totalItems).toBeGreaterThan(0);
    });
  });

  describe('getById', () => {
    it('throws 404 for non-existent course', async () => {
      await expect(api.getById('non-existent-course-id')).rejects.toThrow();
    });

    it('returns course with correct ID', async () => {
      const course = await api.getById('demo-course');

      expect(course.id).toBe('demo-course');
      expect(course.title).toBeDefined();
    });
  });

  describe('create', () => {
    it('creates a new course with lessons', async () => {
      const payload = {
        title: 'New Test Course',
        description: 'Test description',
        published: false,
        languagePair: makeLanguagePair('en', 'zh'),
        lessons: [
          { id: 'lesson-1', title: 'Lesson 1', description: 'First lesson', scenarioIds: [], order: 0 },
        ],
      };

      const created = await api.create(payload);

      expect(created.id).toBeDefined();
      expect(created.title).toBe('New Test Course');
      expect(created.lessons.length).toBe(1);
      expect(created.lessons[0].title).toBe('Lesson 1');
    });

    it('creates course without lessons', async () => {
      const payload = {
        title: 'Empty Course',
        description: 'No lessons',
        published: true,
        languagePair: makeLanguagePair('en', 'zh'),
        lessons: [],
      };

      const created = await api.create(payload);

      expect(created.title).toBe('Empty Course');
      expect(created.lessons).toEqual([]);
    });
  });

  describe('update', () => {
    it('updates course title and description', async () => {
      const payload = {
        title: 'Updated Course Title',
        description: 'Updated description',
        published: true,
        languagePair: makeLanguagePair('en', 'zh'),
        lessons: [],
      };

      const updated = await api.update('demo-course', payload);

      expect(updated.title).toBe('Updated Course Title');
      expect(updated.description).toBe('Updated description');
      expect(updated.published).toBe(true);
    });

    it('throws 404 for non-existent course', async () => {
      const payload = {
        title: 'Should Fail',
        description: '',
        published: false,
        languagePair: makeLanguagePair('en', 'zh'),
        lessons: [],
      };

      await expect(api.update('non-existent-id', payload)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes a course', async () => {
      const newPayload = {
        title: 'Course To Delete',
        description: 'Will be deleted',
        published: false,
        languagePair: makeLanguagePair('en', 'zh'),
        lessons: [{ id: 'del-lesson', title: 'Lesson', description: '', scenarioIds: [], order: 0 }],
      };

      const created = await api.create(newPayload);
      await api.delete(created.id);

      await expect(api.getById(created.id)).rejects.toThrow();
    });

    it('throws 404 for non-existent course', async () => {
      await expect(api.delete('non-existent-id')).rejects.toThrow();
    });
  });
});
