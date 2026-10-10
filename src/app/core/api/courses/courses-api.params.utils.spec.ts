import { HttpParams } from '@angular/common/http';

import {
  buildCourseSearchParams,
  parseCourseSearchCriteria,
} from './courses-api.params.utils';

describe('courses-api.params.utils', () => {
  describe('buildCourseSearchParams', () => {
    it('should build params with pagination only', () => {
      const criteria = {
        page: { page: 2, pageSize: 15 },
      };

      const params = buildCourseSearchParams(criteria);

      expect(params.get('page')).toBe('2');
      expect(params.get('pageSize')).toBe('15');
      expect(params.has('query')).toBe(false);
      expect(params.has('authorId')).toBe(false);
      expect(params.has('scope')).toBe(false);
      expect(params.has('knownLanguage')).toBe(false);
      expect(params.has('learningLanguage')).toBe(false);
    });

    it('should include all optional fields when provided', () => {
      const criteria = {
        query: 'test course',
        authorId: 'author-123',
        scope: 'published' as const,
        knownLanguage: 'ru' as const,
        learningLanguage: 'en' as const,
        page: { page: 0, pageSize: 20 },
      };

      const params = buildCourseSearchParams(criteria);

      expect(params.get('query')).toBe('test course');
      expect(params.get('authorId')).toBe('author-123');
      expect(params.get('scope')).toBe('published');
      expect(params.get('knownLanguage')).toBe('ru');
      expect(params.get('learningLanguage')).toBe('en');
    });

    it('should omit optional fields when they are falsy', () => {
      const criteria = {
        page: { page: 0, pageSize: 10 },
        query: '',
        authorId: '',
        scope: undefined,
        knownLanguage: undefined,
        learningLanguage: undefined,
      };

      const params = buildCourseSearchParams(criteria);

      expect(params.has('query')).toBe(false);
      expect(params.has('authorId')).toBe(false);
      expect(params.has('scope')).toBe(false);
      expect(params.has('knownLanguage')).toBe(false);
      expect(params.has('learningLanguage')).toBe(false);
    });
  });

  describe('parseCourseSearchCriteria', () => {
    it('should parse all criteria from params', () => {
      const params = new HttpParams()
        .set('query', 'search term')
        .set('authorId', 'author-456')
        .set('scope', 'published')
        .set('knownLanguage', 'zh')
        .set('learningLanguage', 'en')
        .set('page', '3')
        .set('pageSize', '50');

      const criteria = parseCourseSearchCriteria(params);

      expect(criteria.query).toBe('search term');
      expect(criteria.authorId).toBe('author-456');
      expect(criteria.scope).toBe('published');
      expect(criteria.knownLanguage).toBe('zh');
      expect(criteria.learningLanguage).toBe('en');
      expect(criteria.page.page).toBe(3);
      expect(criteria.page.pageSize).toBe(50);
    });

    it('should parse empty params with defaults', () => {
      const criteria = parseCourseSearchCriteria(new HttpParams());

      expect(criteria.query).toBeUndefined();
      expect(criteria.authorId).toBeUndefined();
      expect(criteria.scope).toBeUndefined();
      expect(criteria.knownLanguage).toBeUndefined();
      expect(criteria.learningLanguage).toBeUndefined();
      expect(criteria.page.page).toBe(0);
      expect(criteria.page.pageSize).toBeGreaterThan(0);
    });

    it('should reject invalid content languages', () => {
      const params = new HttpParams()
        .set('knownLanguage', 'invalid-lang')
        .set('learningLanguage', 'also-invalid');

      const criteria = parseCourseSearchCriteria(params);

      expect(criteria.knownLanguage).toBeUndefined();
      expect(criteria.learningLanguage).toBeUndefined();
    });

    it('should accept valid content languages', () => {
      const params = new HttpParams()
        .set('knownLanguage', 'zh')
        .set('learningLanguage', 'en');

      const criteria = parseCourseSearchCriteria(params);

      expect(criteria.knownLanguage).toBe('zh');
      expect(criteria.learningLanguage).toBe('en');
    });

    it('should round-trip criteria through build and parse', () => {
      const criteria: Parameters<typeof buildCourseSearchParams>[0] = {
        query: 'round-trip test',
        authorId: 'author-789',
        scope: 'published' as const,
        knownLanguage: 'zh' as const,
        learningLanguage: 'en' as const,
        page: { page: 5, pageSize: 25 },
      };

      const params = buildCourseSearchParams(criteria);
      const parsed = parseCourseSearchCriteria(params);

      expect(parsed.query).toBe('round-trip test');
      expect(parsed.authorId).toBe('author-789');
      expect(parsed.scope).toBe('published');
      expect(parsed.knownLanguage).toBe('zh');
      expect(parsed.learningLanguage).toBe('en');
      expect(parsed.page.page).toBe(5);
      expect(parsed.page.pageSize).toBe(25);
    });
  });
});
