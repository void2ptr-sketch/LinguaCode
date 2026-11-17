import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { LessonBuilderStore } from './lesson-builder.store';
import { LessonsApiService } from '../../../entities/lesson/api/lessons-api.service';
import { ProgramsApiService } from '../../../entities/program/api/programs-api.service';
import { CourseSearchService } from '../../../entities/course';
import { AuthStore } from '../../../entities/auth/services/auth.store';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import type { Lesson } from '../../../entities/course/model/lesson.types';
import type { LessonFormDraft } from '../types';

function makeValidDraft(overrides: Partial<LessonFormDraft> = {}): LessonFormDraft {
  return {
    programId: 'p1',
    title: 'Valid Lesson',
    description: 'Description',
    order: 1,
    prerequisiteLessonIds: [],
    published: false,
    ...overrides,
  };
}

describe('LessonBuilderStore', () => {
  let store: LessonBuilderStore;
  let lessonsApi: { getById: ReturnType<typeof vi.fn>; getByProgramId: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let programsApi: { getById: ReturnType<typeof vi.fn> };
  let courseSearch: { getById: ReturnType<typeof vi.fn> };
  let authStore: { user: ReturnType<typeof vi.fn> };
  let logger: { error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    lessonsApi = {
      getById: vi.fn(() => Promise.resolve({ id: '1', programId: 'p1', title: 'Lesson', description: '', scenarioIds: [], prerequisiteLessonIds: [], order: 0, updatedAt: '' } as Lesson)),
      getByProgramId: vi.fn(() => Promise.resolve([])),
      create: vi.fn(() => Promise.resolve({} as Lesson)),
      update: vi.fn(() => Promise.resolve({} as Lesson)),
    };
    programsApi = {
      getById: vi.fn(() => Promise.resolve({ id: 'p1', courseId: 'c1', title: 'Program', description: '', lessonIds: [], order: 0, updatedAt: '' })),
    };
    courseSearch = {
      getById: vi.fn(() => Promise.resolve({ id: 'c1', authorId: 'user-1' })),
    };
    authStore = {
      user: vi.fn(() => ({ id: 'user-1', roles: ['AUTHOR'] })),
    };
    logger = {
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        LessonBuilderStore,
        { provide: LessonsApiService, useValue: lessonsApi },
        { provide: ProgramsApiService, useValue: programsApi },
        { provide: CourseSearchService, useValue: courseSearch },
        { provide: AuthStore, useValue: authStore },
        { provide: AppLoggerService, useValue: logger },
      ],
    });

    store = TestBed.inject(LessonBuilderStore);
  });

  // ── isReadOnly ──

  it('should return false when authorId is null', () => {
    store.editingLessonAuthorId.set(null);
    expect(store.isReadOnly()).toBe(false);
  });

  it('should return false when authorId is empty string', () => {
    store.editingLessonAuthorId.set('');
    expect(store.isReadOnly()).toBe(false);
  });

  it('should return true when user is null but authorId is set', () => {
    store.editingLessonAuthorId.set('user-1');
    authStore.user.mockReturnValue(null);
    expect(store.isReadOnly()).toBe(true);
  });

  it('should return false when user is the author', () => {
    store.editingLessonAuthorId.set('user-1');
    authStore.user.mockReturnValue({ id: 'user-1', roles: ['AUTHOR'] });
    expect(store.isReadOnly()).toBe(false);
  });

  it('should return true when user is not the author', () => {
    store.editingLessonAuthorId.set('user-99');
    authStore.user.mockReturnValue({ id: 'user-1', roles: ['AUTHOR'] });
    expect(store.isReadOnly()).toBe(true);
  });

  // ── startCreate ──

  it('should reset state in create mode', () => {
    store.startCreate('program-1');
    expect(store.editingLesson()).toBeNull();
    expect(store.editingLessonAuthorId()).toBeNull();
    expect(store.error()).toBeNull();
    expect(store.candidateLessons()).toEqual([]);
  });

  // ── createLesson ──

  it('should create a lesson with draft programId', async () => {
    const draft = makeValidDraft({ programId: 'program-1' });
    const result = await store.createLesson(draft);
    expect(result).toBe(true);
    expect(lessonsApi.create).toHaveBeenCalled();
  });

  it('should fall back to createProgramId when draft has no programId', async () => {
    store.startCreate('fallback-program');
    const draft = makeValidDraft({ programId: '' });
    const result = await store.createLesson(draft);
    expect(result).toBe(true);
    expect(lessonsApi.create).toHaveBeenCalled();
  });

  it('should return false when no programId available', async () => {
    const draft = makeValidDraft({ programId: '' });
    const result = await store.createLesson(draft);
    expect(result).toBe(false);
    expect(store.error()).toBe('Не указан трек для создания урока');
  });

  it('should return false on validation error', async () => {
    const draft = makeValidDraft({ programId: 'program-1', title: '' });
    const result = await store.createLesson(draft);
    expect(result).toBe(false);
    expect(store.error()).toBe('Укажите название урока');
  });

  it('should return false on API error', async () => {
    lessonsApi.create.mockRejectedValue(new Error('API error'));
    const draft = makeValidDraft({ programId: 'program-1' });
    const result = await store.createLesson(draft);
    expect(result).toBe(false);
    expect(store.error()).toBe('Не удалось создать урок');
  });

  // ── updateLesson ──

  it('should update a lesson successfully', async () => {
    store.editingLessonAuthorId.set('user-1');
    const draft = makeValidDraft({ title: 'Updated Lesson' });
    const result = await store.updateLesson('lesson-1', draft);
    expect(result).toBe(true);
    expect(lessonsApi.update).toHaveBeenCalled();
  });

  it('should return false when read-only', async () => {
    store.editingLessonAuthorId.set('user-99');
    authStore.user.mockReturnValue({ id: 'user-1', roles: ['AUTHOR'] });
    const draft = makeValidDraft({ title: 'Updated Lesson' });
    const result = await store.updateLesson('lesson-1', draft);
    expect(result).toBe(false);
    expect(store.error()).toBe('Нельзя изменять чужой урок');
  });

  it('should return false on validation error during update', async () => {
    store.editingLessonAuthorId.set('user-1');
    const draft = makeValidDraft({ title: '' });
    const result = await store.updateLesson('lesson-1', draft);
    expect(result).toBe(false);
    expect(store.error()).toBe('Укажите название урока');
  });

  it('should return false on API error during update', async () => {
    store.editingLessonAuthorId.set('user-1');
    lessonsApi.update.mockRejectedValue(new Error('API error'));
    const draft = makeValidDraft({ title: 'Updated Lesson' });
    const result = await store.updateLesson('lesson-1', draft);
    expect(result).toBe(false);
    expect(store.error()).toBe('Не удалось сохранить урок');
  });

  // ── startEdit ──

  it('should load a lesson for editing', async () => {
    await store.startEdit('lesson-1');
    expect(store.editingLesson()).toBeTruthy();
    expect(store.editorLoading()).toBe(false);
  });

  it('should set error on load failure', async () => {
    lessonsApi.getById.mockRejectedValue(new Error('Not found'));
    await store.startEdit('lesson-1');
    expect(store.error()).toBe('Не удалось загрузить урок');
    expect(store.editorLoading()).toBe(false);
  });

  // ── loadCandidateLessons ──

  it('should load candidate lessons', async () => {
    lessonsApi.getByProgramId.mockResolvedValue([
      { id: 'l1', programId: 'p1', title: 'L1', description: '', scenarioIds: [], prerequisiteLessonIds: [], order: 0, updatedAt: '' },
    ]);
    await store.loadCandidateLessons('p1');
    expect(store.candidateLessons()).toHaveLength(1);
  });

  it('should exclude a lesson by id', async () => {
    lessonsApi.getByProgramId.mockResolvedValue([
      { id: 'l1', programId: 'p1', title: 'L1', description: '', scenarioIds: [], prerequisiteLessonIds: [], order: 0, updatedAt: '' },
      { id: 'l2', programId: 'p1', title: 'L2', description: '', scenarioIds: [], prerequisiteLessonIds: [], order: 1, updatedAt: '' },
    ]);
    await store.loadCandidateLessons('p1', 'l1');
    expect(store.candidateLessons()).toHaveLength(1);
    expect(store.candidateLessons()[0].id).toBe('l2');
  });

  it('should set empty on load failure', async () => {
    lessonsApi.getByProgramId.mockRejectedValue(new Error('API error'));
    await store.loadCandidateLessons('p1');
    expect(store.candidateLessons()).toEqual([]);
  });
});
