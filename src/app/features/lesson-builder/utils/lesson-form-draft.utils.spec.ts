import { describe, expect, it } from 'vitest';

import type { Lesson } from '../../../entities/course/model/lesson.types';
import {
  LESSON_TITLE_MAX_LENGTH,
  emptyLessonFormDraft,
  formDraftToLessonCreatePayload,
  formDraftToLessonUpdatePayload,
  lessonToFormDraft,
  normalizeLessonTitle,
  serializeLessonFormDraft,
  validateLessonFormDraft,
} from './lesson-form-draft.utils';

const mockLesson: Lesson = {
  id: 'lesson-1',
  programId: 'program-1',
  title: 'Test Lesson',
  description: 'Test description',
  scenarioIds: ['scenario-1'],
  prerequisiteLessonIds: ['lesson-2', 'lesson-3'],
  order: 3,
  updatedAt: '2026-01-01T00:00:00.000Z',
  published: true,
  requiredTier: 'FREE',
};

describe('lesson-form-draft.utils', () => {
  describe('emptyLessonFormDraft', () => {
    it('should create an empty draft without programId', () => {
      expect(emptyLessonFormDraft()).toEqual({
        programId: '',
        title: '',
        description: '',
        order: 0,
        prerequisiteLessonIds: [],
        published: false,
      });
    });

    it('should create an empty draft with programId', () => {
      expect(emptyLessonFormDraft('program-1').programId).toBe('program-1');
    });

    it('should default published to false', () => {
      expect(emptyLessonFormDraft().published).toBe(false);
    });
  });

  describe('lessonToFormDraft', () => {
    it('should map lesson fields to draft', () => {
      const draft = lessonToFormDraft(mockLesson);
      expect(draft).toEqual({
        id: 'lesson-1',
        programId: 'program-1',
        title: 'Test Lesson',
        description: 'Test description',
        order: 3,
        prerequisiteLessonIds: ['lesson-2', 'lesson-3'],
        published: true,
        requiredTier: 'FREE',
      });
    });

    it('should not include scenarioIds in the draft', () => {
      const draft = lessonToFormDraft(mockLesson);
      expect('scenarioIds' in draft).toBe(false);
    });

    it('should clone prerequisiteLessonIds', () => {
      const draft = lessonToFormDraft(mockLesson);
      expect(draft.prerequisiteLessonIds).not.toBe(mockLesson.prerequisiteLessonIds);
    });

    it('should map published and requiredTier', () => {
      const draft = lessonToFormDraft(mockLesson);
      expect(draft.published).toBe(true);
      expect(draft.requiredTier).toBe('FREE');
    });

    it('should handle undefined published and requiredTier', () => {
      const lessonWithoutFields: Lesson = {
        ...mockLesson,
        published: undefined,
        requiredTier: undefined,
      };
      const draft = lessonToFormDraft(lessonWithoutFields);
      expect(draft.published).toBe(undefined);
      expect(draft.requiredTier).toBe(undefined);
    });
  });

  describe('serializeLessonFormDraft', () => {
    it('should produce a stable serialization for equal drafts', () => {
      const a = emptyLessonFormDraft('program-1');
      const b = emptyLessonFormDraft('program-1');
      expect(serializeLessonFormDraft(a)).toBe(serializeLessonFormDraft(b));
    });

    it('should differ when title changes', () => {
      const a = emptyLessonFormDraft();
      const b = { ...a, title: 'Changed' };
      expect(serializeLessonFormDraft(a)).not.toBe(serializeLessonFormDraft(b));
    });

    it('should serialize an explicit field set', () => {
      const draft = { ...emptyLessonFormDraft('program-1'), id: 'lesson-1' };
      const serialized = serializeLessonFormDraft(draft);
      expect(JSON.parse(serialized)).toEqual({
        id: 'lesson-1',
        programId: 'program-1',
        title: '',
        description: '',
        order: 0,
        prerequisiteLessonIds: [],
        published: false,
        requiredTier: undefined,
      });
    });

    it('should ignore prerequisite selection order', () => {
      const a = { ...emptyLessonFormDraft(), prerequisiteLessonIds: ['b', 'a'] };
      const b = { ...emptyLessonFormDraft(), prerequisiteLessonIds: ['a', 'b'] };
      expect(serializeLessonFormDraft(a)).toBe(serializeLessonFormDraft(b));
    });

    it('should include published in serialization', () => {
      const a = emptyLessonFormDraft();
      const b = { ...a, published: true };
      expect(serializeLessonFormDraft(a)).not.toBe(serializeLessonFormDraft(b));
    });

    it('should include requiredTier in serialization', () => {
      const a = emptyLessonFormDraft();
      const b = { ...a, requiredTier: 'STARTER' as const };
      expect(serializeLessonFormDraft(a)).not.toBe(serializeLessonFormDraft(b));
    });
  });

  describe('normalizeLessonTitle', () => {
    it('should trim whitespace', () => {
      expect(normalizeLessonTitle('  Title  ')).toBe('Title');
    });

    it('should strip HTML tags', () => {
      expect(normalizeLessonTitle('<b>Title</b>')).toBe('Title');
    });

    it('should clamp to max length', () => {
      const long = 'a'.repeat(LESSON_TITLE_MAX_LENGTH + 10);
      expect(normalizeLessonTitle(long).length).toBe(LESSON_TITLE_MAX_LENGTH);
    });
  });

  describe('validateLessonFormDraft', () => {
    it('should reject an empty title', () => {
      expect(validateLessonFormDraft(emptyLessonFormDraft())).not.toBeNull();
      expect(validateLessonFormDraft({ ...emptyLessonFormDraft(), title: '   ' })).not.toBeNull();
    });

    it('should accept a valid draft', () => {
      expect(validateLessonFormDraft({ ...emptyLessonFormDraft(), title: 'Valid', order: 1 })).toBeNull();
    });

    it('should reject a title longer than the max length', () => {
      const draft = { ...emptyLessonFormDraft(), title: 'a'.repeat(LESSON_TITLE_MAX_LENGTH + 1) };
      expect(validateLessonFormDraft(draft)).not.toBeNull();
    });

    it('should reject order equal to zero', () => {
      const draft = { ...emptyLessonFormDraft(), title: 'Valid', order: 0 };
      const result = validateLessonFormDraft(draft);
      expect(result).toBe('Порядок должен быть больше нуля');
    });

    it('should reject undefined order (defaults to 0)', () => {
      const draft = { ...emptyLessonFormDraft(), title: 'Valid', order: undefined };
      const result = validateLessonFormDraft(draft);
      expect(result).toBe('Порядок должен быть больше нуля');
    });

    it('should accept order greater than zero', () => {
      expect(validateLessonFormDraft({ ...emptyLessonFormDraft(), title: 'Valid', order: 1 })).toBeNull();
      expect(validateLessonFormDraft({ ...emptyLessonFormDraft(), title: 'Valid', order: 5 })).toBeNull();
    });
  });

  describe('formDraftToLessonCreatePayload', () => {
    it('should map draft to a create payload', () => {
      const draft = {
        programId: 'program-1',
        title: '  New Lesson  ',
        description: 'Desc',
        order: 2,
        prerequisiteLessonIds: ['lesson-1'],
      };
      const payload = formDraftToLessonCreatePayload(draft);
      expect(payload).toEqual({
        programId: 'program-1',
        title: 'New Lesson',
        description: 'Desc',
        order: 2,
        prerequisiteLessonIds: ['lesson-1'],
        published: undefined,
        requiredTier: 'FREE',
      });
    });

    it('should default order and prerequisites', () => {
      const payload = formDraftToLessonCreatePayload({
        programId: 'program-1',
        title: 'New Lesson',
        description: '',
      });
      expect(payload.order).toBe(0);
      expect(payload.prerequisiteLessonIds).toEqual([]);
    });

    it('should include published and requiredTier when present', () => {
      const draft = {
        programId: 'program-1',
        title: 'New Lesson',
        description: 'Desc',
        order: 1,
        prerequisiteLessonIds: [],
        published: true,
        requiredTier: 'STARTER' as const,
      };
      const payload = formDraftToLessonCreatePayload(draft);
      expect(payload.published).toBe(true);
      expect(payload.requiredTier).toBe('STARTER');
    });
  });

  describe('formDraftToLessonUpdatePayload', () => {
    it('should not include programId (immutable on update)', () => {
      const draft = {
        id: 'lesson-1',
        programId: 'program-1',
        title: 'Updated',
        description: 'New desc',
        order: 1,
        prerequisiteLessonIds: ['lesson-2'],
      };
      const payload = formDraftToLessonUpdatePayload(draft);
      expect(payload).toEqual({
        title: 'Updated',
        description: 'New desc',
        order: 1,
        prerequisiteLessonIds: ['lesson-2'],
        published: undefined,
        requiredTier: undefined,
      });
      expect('programId' in payload).toBe(false);
    });

    it('should include published and requiredTier when present', () => {
      const draft = {
        id: 'lesson-1',
        programId: 'program-1',
        title: 'Updated',
        description: 'New desc',
        order: 1,
        prerequisiteLessonIds: ['lesson-2'],
        published: false,
        requiredTier: 'GROWTH' as const,
      };
      const payload = formDraftToLessonUpdatePayload(draft);
      expect(payload.published).toBe(false);
      expect(payload.requiredTier).toBe('GROWTH');
    });
  });
});
