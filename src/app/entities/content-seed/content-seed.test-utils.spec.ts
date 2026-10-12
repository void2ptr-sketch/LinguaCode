import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import { seedTestContentCache } from './content-seed.test-utils';

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
});
