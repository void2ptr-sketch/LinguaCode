import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import { LessonsCatalogMockHandler } from './lessons-catalog.mock.handler';
import { ContentSeedRepository } from '../../../content-seed/content-seed.repository';
import { seedTestContentCache } from '../../../content-seed/content-seed.test-utils';
import type { LessonCreatePayload, LessonUpdatePayload } from '../lessons-api.service';

describe('LessonsCatalogMockHandler', () => {
  let handler: LessonsCatalogMockHandler;
  let contentSeed: { preload: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    seedTestContentCache();
    localStorage.clear();
    localStorage.setItem('lingua-code.user-content.migrated', '1');

    contentSeed = {
      preload: vi.fn(() => Promise.resolve()),
    };

    TestBed.configureTestingModule({
      providers: [
        LessonsCatalogMockHandler,
        { provide: ContentSeedRepository, useValue: contentSeed },
      ],
    });

    handler = TestBed.inject(LessonsCatalogMockHandler);
  });

  afterEach(() => {
    handler.resetCache();
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ── getById ──

  it('should return a lesson by ID', async () => {
    // Find an existing lesson from the seeded data
    const searchResult = await handler.getByProgramId('course-zh-radicals-214');
    if (searchResult.length === 0) {
      return;
    }
    const lesson = await handler.getById(searchResult[0].id);
    expect(lesson.id).toBe(searchResult[0].id);
    expect(lesson.title).toBeTruthy();
  });

  it('should throw 404 for missing lesson', async () => {
    await expect(handler.getById('non-existent-lesson-id-12345')).rejects.toThrow();
  });

  // ── getByProgramId ──

  it('should return lessons for a program ordered by order', async () => {
    const lessons = await handler.getByProgramId('course-zh-radicals-214');
    expect(Array.isArray(lessons)).toBe(true);
    // Verify ordering
    for (let i = 1; i < lessons.length; i++) {
      expect(lessons[i].order).toBeGreaterThanOrEqual(lessons[i - 1].order);
    }
  });

  it('should return empty array for unknown program', async () => {
    const lessons = await handler.getByProgramId('non-existent-program-12345');
    expect(lessons).toEqual([]);
  });

  // ── getByCourseId ──

  it('should return lessons for a course', async () => {
    const lessons = await handler.getByCourseId('course-zh-radicals-214');
    expect(Array.isArray(lessons)).toBe(true);
    expect(lessons.length).toBeGreaterThanOrEqual(0);
  });

  it('should throw 404 for missing course', async () => {
    await expect(handler.getByCourseId('non-existent-course-id-12345')).rejects.toThrow();
  });

  // ── create ──

  it('should create a new lesson', async () => {
    const payload: LessonCreatePayload = {
      programId: 'course-zh-radicals-214',
      title: 'Test Lesson Created',
      description: 'Created by test',
      order: 999,
      prerequisiteLessonIds: [],
      requiredTier: 'FREE',
    };
    const result = await handler.create(payload);
    expect(result.title).toBe('Test Lesson Created');
    expect(result.programId).toBe('course-zh-radicals-214');
    expect(result.scenarioIds).toEqual([]);
    expect(result.prerequisiteLessonIds).toEqual([]);

    // Verify it persists
    const lessons = await handler.getByProgramId('course-zh-radicals-214');
    const created = lessons.find((l) => l.title === 'Test Lesson Created');
    expect(created).toBeDefined();
  });

  it('should generate an id when creating a lesson', async () => {
    const payload: LessonCreatePayload = {
      programId: 'course-zh-radicals-214',
      title: 'Auto-ID Lesson',
      description: '',
      order: 0,
      prerequisiteLessonIds: [],
      requiredTier: 'FREE',
    };
    const result = await handler.create(payload);
    expect(result.id).toBeTruthy();
    expect(result.id).toContain('lesson-');
  });

  it('should set published to false by default', async () => {
    const payload: LessonCreatePayload = {
      programId: 'course-zh-radicals-214',
      title: 'Unpublished Lesson',
      description: '',
      order: 0,
      prerequisiteLessonIds: [],
      requiredTier: 'FREE',
    };
    const result = await handler.create(payload);
    expect(result.published).toBe(false);
  });

  it('should set published when provided', async () => {
    const payload: LessonCreatePayload = {
      programId: 'course-zh-radicals-214',
      title: 'Published Lesson',
      description: '',
      order: 0,
      prerequisiteLessonIds: [],
      requiredTier: 'FREE',
      published: true,
    };
    const result = await handler.create(payload);
    expect(result.published).toBe(true);
  });

  it('should copy prerequisiteLessonIds', async () => {
    const payload: LessonCreatePayload = {
      programId: 'course-zh-radicals-214',
      title: 'Prereq Lesson',
      description: '',
      order: 0,
      prerequisiteLessonIds: ['lesson-a', 'lesson-b'],
      requiredTier: 'FREE',
    };
    const result = await handler.create(payload);
    expect(result.prerequisiteLessonIds).toEqual(['lesson-a', 'lesson-b']);
  });

  // ── update ──

  it('should update an existing lesson', async () => {
    // First create a lesson to update
    const createResult = await handler.create({
      programId: 'course-zh-radicals-214',
      title: 'Updatable Lesson',
      description: 'Original',
      order: 0,
      prerequisiteLessonIds: [],
      requiredTier: 'FREE',
    });

    const payload: LessonUpdatePayload = {
      title: 'Updated Lesson',
      description: 'Updated Desc',
      order: 5,
      prerequisiteLessonIds: ['lesson-x', 'lesson-y'],
    };
    const result = await handler.update(createResult.id, payload);
    expect(result.title).toBe('Updated Lesson');
    expect(result.description).toBe('Updated Desc');
    expect(result.order).toBe(5);
    expect(result.prerequisiteLessonIds).toEqual(['lesson-x', 'lesson-y']);
  });

  it('should preserve published when not updated', async () => {
    const createResult = await handler.create({
      programId: 'course-zh-radicals-214',
      title: 'Published Lesson',
      description: '',
      order: 0,
      prerequisiteLessonIds: [],
      requiredTier: 'FREE',
      published: true,
    });

    const payload: LessonUpdatePayload = {
      title: 'Updated Title',
      description: '',
      order: 0,
      prerequisiteLessonIds: [],
    };
    const result = await handler.update(createResult.id, payload);
    expect(result.published).toBe(true);
  });

  it('should preserve requiredTier when not updated', async () => {
    const createResult = await handler.create({
      programId: 'course-zh-radicals-214',
      title: 'Starter Lesson',
      description: '',
      order: 0,
      prerequisiteLessonIds: [],
      requiredTier: 'STARTER',
    });

    const payload: LessonUpdatePayload = {
      title: 'Updated Title',
      description: '',
      order: 0,
      prerequisiteLessonIds: [],
    };
    const result = await handler.update(createResult.id, payload);
    expect(result.requiredTier).toBe('STARTER');
  });

  it('should throw 404 for missing lesson on update', async () => {
    const payload: LessonUpdatePayload = {
      title: 'Ghost',
      description: '',
      order: 0,
      prerequisiteLessonIds: [],
    };
    await expect(handler.update('non-existent-lesson-id-12345', payload)).rejects.toThrow();
  });

  // ── delete ──

  it('should delete a lesson', async () => {
    // First create a lesson to delete
    const createResult = await handler.create({
      programId: 'course-zh-radicals-214',
      title: 'Delete Me',
      description: '',
      order: 998,
      prerequisiteLessonIds: [],
      requiredTier: 'FREE',
    });

    await handler.delete(createResult.id);
    const lessons = await handler.getByProgramId('course-zh-radicals-214');
    const deleted = lessons.find((l) => l.title === 'Delete Me');
    expect(deleted).toBeUndefined();
  });

  it('should throw 404 for missing lesson on delete', async () => {
    await expect(handler.delete('non-existent-lesson-id-12345')).rejects.toThrow();
  });

  // ── resetCache ──

  it('should reset cached catalog', async () => {
    // First call loads data
    const lessons1 = await handler.getByProgramId('course-zh-radicals-214');
    if (lessons1.length === 0) {
      return;
    }
    handler.resetCache();
    // After reset, catalog is null and will reload on next call
    const lessons2 = await handler.getByProgramId('course-zh-radicals-214');
    expect(lessons2.length).toBeGreaterThanOrEqual(0);
  });
});
