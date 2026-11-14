import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestBed } from '@angular/core/testing';

import { CourseSearchService } from '../../../entities/course';
import { LanguagePairsApiService } from '../../../entities/language-pair/api/language-pairs-api.service';
import { ProgramsApiService } from '../../../entities/program/api/programs-api.service';
import type { Program } from '../../../entities/program/model/program.types';
import type { CourseWithPrograms } from '../../../entities/course/model/course.types';
import type { LanguagePairDto } from '../../../entities/language-pair/api/language-pairs-api.types';
import { AuthStore } from '../../../entities/auth/services/auth.store';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';

import { ProgramBuilderStore } from './program-builder.store';
import type { ProgramFormDraft } from '../types';

const mockLanguagePairs: LanguagePairDto[] = [
  { id: 1, knownCode: 'ru', learningCode: 'en' },
  { id: 2, knownCode: 'en', learningCode: 'ru' },
];

const mockCourse: CourseWithPrograms = {
  id: 'course-1',
  title: 'Test Course',
  description: 'A test course',
  authorId: 'user-1',
  languagePair: { known: 'ru', learning: 'en' },
  programIds: [],
  published: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
  programs: [],
} as CourseWithPrograms;

const baseDraft: ProgramFormDraft = {
  courseId: 'course-1',
  title: 'Test Program',
  description: 'Test description',
  requiredTier: 'FREE',
};

describe('ProgramBuilderStore', () => {
  let store: ProgramBuilderStore;
  let programsApiMock: { create: ReturnType<typeof vi.fn> };
  let courseSearchMock: {
    getById: ReturnType<typeof vi.fn>;
    resolveCourseIdForWrite: ReturnType<typeof vi.fn>;
    clearGetByIdCache: ReturnType<typeof vi.fn>;
  };
  let languagePairsApiMock: { listAll: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    programsApiMock = { create: vi.fn() };
    courseSearchMock = {
      getById: vi.fn(),
      resolveCourseIdForWrite: vi.fn((id: string) => Promise.resolve(id)),
      clearGetByIdCache: vi.fn(),
    };
    languagePairsApiMock = { listAll: vi.fn() };

    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      providers: [
        ProgramBuilderStore,
        {
          provide: ProgramsApiService,
          useValue: programsApiMock,
        },
        {
          provide: CourseSearchService,
          useValue: courseSearchMock,
        },
        {
          provide: LanguagePairsApiService,
          useValue: languagePairsApiMock,
        },
        {
          provide: AuthStore,
          useValue: { user: vi.fn(() => null) },
        },
        {
          provide: AppLoggerService,
          useValue: { error: vi.fn() },
        },
      ],
    });

    store = TestBed.inject(ProgramBuilderStore);
  });

  describe('createProgram', () => {
    it('should resolve languagePairId from course.languagePair via LanguagePairsApiService.listAll()', async () => {
      languagePairsApiMock.listAll.mockResolvedValue(mockLanguagePairs);
      courseSearchMock.getById.mockResolvedValue(mockCourse);
      (programsApiMock.create as ReturnType<typeof vi.fn>).mockResolvedValue({} as Program);

      const draft: ProgramFormDraft = { ...baseDraft };
      const result = await store.createProgram(draft);

      expect(result).toBe(true);
      expect(languagePairsApiMock.listAll).toHaveBeenCalled();
      expect(courseSearchMock.getById).toHaveBeenCalledWith('course-1');

      const callArgs = (programsApiMock.create as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(callArgs?.languagePairId).toBe(1);
    });

    it('should use inherited course.languagePairId without resolving codes', async () => {
      const courseWithId = {
        ...mockCourse,
        languagePairId: 7,
      } as unknown as CourseWithPrograms;
      courseSearchMock.getById.mockResolvedValue(courseWithId);
      (programsApiMock.create as ReturnType<typeof vi.fn>).mockResolvedValue({} as Program);

      const result = await store.createProgram({ ...baseDraft });

      expect(result).toBe(true);
      expect(languagePairsApiMock.listAll).not.toHaveBeenCalled();

      const callArgs = (programsApiMock.create as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(callArgs?.languagePairId).toBe(7);
    });

    it('should use draft.languagePairId when already set (skip resolution)', async () => {
      languagePairsApiMock.listAll.mockResolvedValue(mockLanguagePairs);
      courseSearchMock.getById.mockResolvedValue(mockCourse);
      (programsApiMock.create as ReturnType<typeof vi.fn>).mockResolvedValue({} as Program);

      const draft: ProgramFormDraft = { ...baseDraft, languagePairId: 42 };
      const result = await store.createProgram(draft);

      expect(result).toBe(true);
      expect(languagePairsApiMock.listAll).not.toHaveBeenCalled();
      expect(courseSearchMock.getById).not.toHaveBeenCalled();

      const callArgs = (programsApiMock.create as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(callArgs?.languagePairId).toBe(42);
    });

    it('should handle missing languagePair on course gracefully (no crash, proceeds without ID)', async () => {
      const courseWithoutPair = {
        ...mockCourse,
        languagePair: undefined,
      } as unknown as CourseWithPrograms;
      courseSearchMock.getById.mockResolvedValue(courseWithoutPair);
      (programsApiMock.create as ReturnType<typeof vi.fn>).mockResolvedValue({} as Program);

      const draft: ProgramFormDraft = { ...baseDraft };
      const result = await store.createProgram(draft);

      expect(result).toBe(true);
      expect(languagePairsApiMock.listAll).not.toHaveBeenCalled();

      const callArgs = (programsApiMock.create as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(callArgs?.languagePairId).toBeUndefined();
    });

    it('should handle LanguagePairsApiService.listAll() failure gracefully', async () => {
      courseSearchMock.getById.mockResolvedValue(mockCourse);
      languagePairsApiMock.listAll.mockRejectedValue(new Error('Network error'));
      (programsApiMock.create as ReturnType<typeof vi.fn>).mockResolvedValue({} as Program);

      const draft: ProgramFormDraft = { ...baseDraft };
      const result = await store.createProgram(draft);

      expect(result).toBe(true);

      const callArgs = (programsApiMock.create as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(callArgs?.languagePairId).toBeUndefined();
    });

    it('should clear getById cache after successful program creation', async () => {
      languagePairsApiMock.listAll.mockResolvedValue(mockLanguagePairs);
      courseSearchMock.getById.mockResolvedValue(mockCourse);
      (programsApiMock.create as ReturnType<typeof vi.fn>).mockResolvedValue({} as Program);

      const draft: ProgramFormDraft = { ...baseDraft };
      await store.createProgram(draft);

      expect(courseSearchMock.clearGetByIdCache).toHaveBeenCalledTimes(1);
    });

    it('should return false and set error when courseId is missing', async () => {
      const draft: ProgramFormDraft = { ...baseDraft, courseId: '' };
      const result = await store.createProgram(draft);

      expect(result).toBe(false);
      expect(store.error()).toBe('Не указан курс для создания программы');
    });

    it('should return false and set error when validation fails', async () => {
      const draft: ProgramFormDraft = { ...baseDraft, title: '' };
      const result = await store.createProgram(draft);

      expect(result).toBe(false);
      expect(store.error()).not.toBeNull();
    });
  });
});
