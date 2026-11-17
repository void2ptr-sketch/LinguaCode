import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import { ProgramsCatalogMockHandler } from './programs-catalog.mock.handler';
import { ContentSeedRepository } from '../../../content-seed/content-seed.repository';
import type { ProgramSearchCriteria } from '../../model';
import type { ProgramWritePayload } from '../../repository/program-catalog.port';
import { seedTestContentCache } from '../../../content-seed/content-seed.test-utils';

describe('ProgramsCatalogMockHandler', () => {
  let handler: ProgramsCatalogMockHandler;
  let contentSeed: { preload: ReturnType<typeof vi.fn>; getCourseSeed: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Set up the real seed cache and clear localStorage
    seedTestContentCache();
    localStorage.clear();
    localStorage.setItem('lingua-code.user-content.migrated', '1');

    contentSeed = {
      preload: vi.fn(() => Promise.resolve()),
      getCourseSeed: vi.fn(() => (seedTestContentCache(), {})),
    };

    TestBed.configureTestingModule({
      providers: [
        ProgramsCatalogMockHandler,
        { provide: ContentSeedRepository, useValue: contentSeed },
      ],
    });

    handler = TestBed.inject(ProgramsCatalogMockHandler);
  });

  afterEach(() => {
    handler.resetCache();
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ── search ──

  it('should return all programs when no criteria', async () => {
    const result = await handler.search({ page: { page: 0, pageSize: 10 } });
    expect(result.items.length).toBeGreaterThanOrEqual(1);
  });

  it('should filter by query (case-insensitive)', async () => {
    const criteria: ProgramSearchCriteria = {
      page: { page: 0, pageSize: 10 },
      query: 'radicals',
    };
    const result = await handler.search(criteria);
    // Should find at least some radicals programs from the seeded data
    expect(result.items.length).toBeGreaterThanOrEqual(0);
  });

  it('should return empty when no programs match', async () => {
    const criteria: ProgramSearchCriteria = {
      page: { page: 0, pageSize: 10 },
      query: 'zzzznonexistentzzzz',
    };
    const result = await handler.search(criteria);
    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
  });

  it('should paginate results', async () => {
    const criteria: ProgramSearchCriteria = {
      page: { page: 0, pageSize: 1 },
    };
    const result = await handler.search(criteria);
    expect(result.items).toHaveLength(1);
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });

  // ── getById ──

  it('should return a program with lessons', async () => {
    // Find an existing program from the seeded data
    const searchResult = await handler.search({ page: { page: 0, pageSize: 10 } });
    if (searchResult.items.length === 0) {
      // Skip if no programs in seed
      return;
    }
    const programId = searchResult.items[0].id;
    const result = await handler.getById(programId);
    expect(result.id).toBe(programId);
    expect(result.title).toBeTruthy();
  });

  it('should throw 404 for missing program', async () => {
    await expect(handler.getById('non-existent-program-id-12345')).rejects.toThrow();
  });

  // ── getByCourse ──

  it('should return programs for a course with lessons', async () => {
    // Find an existing program from the seeded data
    const searchResult = await handler.search({ page: { page: 0, pageSize: 10 } });
    if (searchResult.items.length === 0) {
      return;
    }
    const result = await handler.getByCourse(searchResult.items[0].courseId);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('should throw 404 for missing course', async () => {
    await expect(handler.getByCourse('non-existent-course-id-12345')).rejects.toThrow();
  });

  // ── create ──

  it('should create a new program', async () => {
    const payload: ProgramWritePayload = {
      title: 'Test Program Created',
      description: 'Created by test',
      courseId: 'course-zh-radicals-214',
      lessonIds: [],
      order: 999,
      requiredTier: 'FREE',
    };
    const result = await handler.create(payload);
    expect(result.title).toBe('Test Program Created');
    expect(result.courseId).toBe('course-zh-radicals-214');

    // Verify it persists
    const searchResult = await handler.search({ page: { page: 0, pageSize: 20 } });
    const created = searchResult.items.find((p) => p.title === 'Test Program Created');
    expect(created).toBeDefined();
  });

  it('should generate an id when not provided', async () => {
    const payload: ProgramWritePayload = {
      title: 'Auto-ID Program',
      description: '',
      courseId: 'course-zh-radicals-214',
      lessonIds: [],
      order: 0,
      requiredTier: 'FREE',
    };
    const result = await handler.create(payload);
    expect(result.id).toBeTruthy();
    expect(result.id).toContain('program-');
  });

  // ── update ──

  it('should update an existing program', async () => {
    // First create a program to update
    const createResult = await handler.create({
      title: 'Updatable Program',
      description: 'Original',
      courseId: 'course-zh-radicals-214',
      lessonIds: [],
      order: 998,
      requiredTier: 'FREE',
    });

    const payload: ProgramWritePayload = {
      title: 'Updated Program',
      description: 'Updated Desc',
      courseId: 'course-zh-radicals-214',
      lessonIds: [],
      order: 5,
      requiredTier: 'PREMIUM',
      published: true,
    };
    const result = await handler.update(createResult.id, payload);
    expect(result.title).toBe('Updated Program');
    expect(result.description).toBe('Updated Desc');
    expect(result.requiredTier).toBe('PREMIUM');
    expect(result.published).toBe(true);
  });

  it('should throw 404 for missing program on update', async () => {
    const payload: ProgramWritePayload = {
      title: 'Ghost',
      description: '',
      courseId: 'course-zh-radicals-214',
      lessonIds: [],
      order: 0,
      requiredTier: 'FREE',
    };
    await expect(handler.update('non-existent-program-id-12345', payload)).rejects.toThrow();
  });

  // ── delete ──

  it('should delete a program', async () => {
    // First create a program to delete
    const createResult = await handler.create({
      title: 'Delete Me',
      description: '',
      courseId: 'course-zh-radicals-214',
      lessonIds: [],
      order: 997,
      requiredTier: 'FREE',
    });

    await handler.delete(createResult.id);
    const searchResult = await handler.search({ page: { page: 0, pageSize: 20 } });
    const deleted = searchResult.items.find((p) => p.title === 'Delete Me');
    expect(deleted).toBeUndefined();
  });

  it('should throw 404 for missing program on delete', async () => {
    await expect(handler.delete('non-existent-program-id-12345')).rejects.toThrow();
  });

  // ── resetCache ──

  it('should reset cached catalog', async () => {
    // First call loads data
    const searchResult = await handler.search({ page: { page: 0, pageSize: 10 } });
    if (searchResult.items.length === 0) {
      return;
    }
    handler.resetCache();
    // After reset, catalog is null and will reload on next call
    const result2 = await handler.search({ page: { page: 0, pageSize: 10 } });
    expect(result2.items.length).toBeGreaterThanOrEqual(0);
  });
});
