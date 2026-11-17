import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import {
  seedTestContentCache,
  getTestDefaultCourseCatalog,
  getTestDefaultScenarios,
  getTestZhCourseCatalog,
  getTestZhScenarios,
  getTestPerlCourseCatalog,
  getTestDemoCourseWithLessons,
} from './content-seed.test-utils';

describe('content-seed.test-utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should export seedTestContentCache function', () => {
    expect(seedTestContentCache).toBeDefined();
    expect(typeof seedTestContentCache).toBe('function');
  });

  it('should seed test content without errors', () => {
    expect(() => seedTestContentCache()).not.toThrow();
  });

  it('should set localStorage flag after seeding', () => {
    seedTestContentCache();
    expect(localStorage.getItem('lingua-code.user-content.migrated-v1')).toBe('1');
  });

  it('should be idempotent', () => {
    expect(() => {
      seedTestContentCache();
      seedTestContentCache();
    }).not.toThrow();
  });

  it('should return default course catalog', () => {
    const catalog = getTestDefaultCourseCatalog();
    expect(catalog).toBeDefined();
    expect(Array.isArray(catalog.courses)).toBe(true);
    expect(Array.isArray(catalog.programs)).toBe(true);
    expect(Array.isArray(catalog.lessons)).toBe(true);
  });

  it('should return default scenarios', () => {
    const scenarios = getTestDefaultScenarios();
    expect(Array.isArray(scenarios)).toBe(true);
    expect(scenarios.length).toBeGreaterThan(0);
  });

  it('should filter Chinese scenarios', () => {
    const scenarios = getTestZhScenarios();
    expect(Array.isArray(scenarios)).toBe(true);
    for (const s of scenarios) {
      expect(s.languagePair?.learning).toBe('zh');
    }
  });

  it('should filter Chinese course catalog', () => {
    const catalog = getTestZhCourseCatalog();
    expect(catalog).toBeDefined();
    for (const course of catalog.courses) {
      expect(course.languagePair.learning).toBe('zh');
    }
  });

  it('should return demo course with lessons', () => {
    const course = getTestDemoCourseWithLessons();
    expect(course).toBeDefined();
    expect(course.id).toBe('course-demo-card-kinds');
    expect(Array.isArray(course.programs)).toBe(true);
  });

  it('should filter Perl course catalog', () => {
    const catalog = getTestPerlCourseCatalog();
    expect(catalog).toBeDefined();
    for (const course of catalog.courses) {
      expect(course.languagePair.learning).toBe('perl');
    }
  });
});
