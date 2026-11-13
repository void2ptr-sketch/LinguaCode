import { describe, expect, it } from 'vitest';

import type { ProgramRequiredTier } from '../../../entities/program/model';

import type { Program } from '../../../entities/program/model/program.types';
import {
  PROGRAM_TITLE_MAX_LENGTH,
  emptyProgramFormDraft,
  formDraftToProgramCreatePayload,
  formDraftToProgramUpdatePayload,
  normalizeProgramTitle,
  programToFormDraft,
  serializeProgramFormDraft,
  validateProgramFormDraft,
} from './program-form-draft.utils';

const mockProgram: Program = {
  id: 'program-1',
  courseId: 'course-1',
  title: 'Test Program',
  description: 'Test description',
  lessonIds: ['lesson-1', 'lesson-2'],
  order: 3,
  requiredTier: 'FREE',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('program-form-draft.utils', () => {
  describe('emptyProgramFormDraft', () => {
    it('should create an empty draft without courseId', () => {
      expect(emptyProgramFormDraft()).toEqual({
        courseId: '',
        title: '',
        description: '',
        requiredTier: 'FREE',
      });
    });

    it('should create an empty draft with courseId', () => {
      expect(emptyProgramFormDraft('course-1').courseId).toBe('course-1');
    });
  });

  describe('programToFormDraft', () => {
    it('should map program fields to draft', () => {
      const draft = programToFormDraft(mockProgram);
      expect(draft).toEqual({
        id: 'program-1',
        courseId: 'course-1',
        title: 'Test Program',
        description: 'Test description',
        order: 3,
        requiredTier: 'FREE',
      });
    });

    it('should default requiredTier to FREE when missing', () => {
      const draft = programToFormDraft({ ...mockProgram, requiredTier: undefined });
      expect(draft.requiredTier).toBe('FREE');
    });

    it('should not include lessonIds in the draft', () => {
      const draft = programToFormDraft(mockProgram);
      expect('lessonIds' in draft).toBe(false);
    });
  });

  describe('serializeProgramFormDraft', () => {
    it('should produce a stable serialization for equal drafts', () => {
      const a = emptyProgramFormDraft('course-1');
      const b = emptyProgramFormDraft('course-1');
      expect(serializeProgramFormDraft(a)).toBe(serializeProgramFormDraft(b));
    });

    it('should differ when title changes', () => {
      const a = emptyProgramFormDraft();
      const b = { ...a, title: 'Changed' };
      expect(serializeProgramFormDraft(a)).not.toBe(serializeProgramFormDraft(b));
    });

    it('should serialize an explicit field set', () => {
      const draft = { ...emptyProgramFormDraft('course-1'), id: 'program-1' };
      const serialized = serializeProgramFormDraft(draft);
      expect(JSON.parse(serialized)).toEqual({
        id: 'program-1',
        courseId: 'course-1',
        title: '',
        description: '',
        order: undefined,
        requiredTier: 'FREE',
      });
    });
  });

  describe('normalizeProgramTitle', () => {
    it('should trim whitespace', () => {
      expect(normalizeProgramTitle('  Title  ')).toBe('Title');
    });

    it('should strip HTML tags', () => {
      expect(normalizeProgramTitle('<b>Title</b>')).toBe('Title');
    });

    it('should clamp to max length', () => {
      const long = 'a'.repeat(PROGRAM_TITLE_MAX_LENGTH + 10);
      expect(normalizeProgramTitle(long).length).toBe(PROGRAM_TITLE_MAX_LENGTH);
    });
  });

  describe('validateProgramFormDraft', () => {
    it('should reject an empty title', () => {
      expect(validateProgramFormDraft(emptyProgramFormDraft())).not.toBeNull();
      expect(validateProgramFormDraft({ ...emptyProgramFormDraft(), title: '   ' })).not.toBeNull();
    });

    it('should accept a valid draft', () => {
      expect(validateProgramFormDraft({ ...emptyProgramFormDraft(), title: 'Valid' })).toBeNull();
    });

    it('should reject a title longer than the max length', () => {
      const draft = { ...emptyProgramFormDraft(), title: 'a'.repeat(PROGRAM_TITLE_MAX_LENGTH + 1) };
      expect(validateProgramFormDraft(draft)).not.toBeNull();
    });
  });

  describe('formDraftToProgramCreatePayload', () => {
    it('should map draft to a create payload', () => {
      const draft: import('../types').ProgramFormDraft = {
        courseId: 'course-1',
        title: '  New Program  ',
        description: 'Desc',
        order: 2,
        requiredTier: 'STARTER' as ProgramRequiredTier,
      };
      const payload = formDraftToProgramCreatePayload(draft, ['lesson-1']);
      expect(payload).toEqual({
        courseId: 'course-1',
        title: 'New Program',
        description: 'Desc',
        lessonIds: ['lesson-1'],
        order: 2,
        requiredTier: 'STARTER',
      });
    });

    it('should default lessonIds and order', () => {
      const payload = formDraftToProgramCreatePayload({
        courseId: 'course-1',
        title: 'New Program',
        description: '',
        requiredTier: 'FREE',
      });
      expect(payload.lessonIds).toEqual([]);
      expect(payload.order).toBe(0);
    });
  });

  describe('formDraftToProgramUpdatePayload', () => {
    it('should include the draft id and preserve lessonIds', () => {
      const draft: import('../types').ProgramFormDraft = {
        id: 'program-1',
        courseId: 'course-1',
        title: 'Updated',
        description: 'New desc',
        order: 1,
        requiredTier: 'GROWTH' as ProgramRequiredTier,
      };
      const payload = formDraftToProgramUpdatePayload(draft, ['lesson-1', 'lesson-2']);
      expect(payload).toEqual({
        id: 'program-1',
        courseId: 'course-1',
        title: 'Updated',
        description: 'New desc',
        lessonIds: ['lesson-1', 'lesson-2'],
        order: 1,
        requiredTier: 'GROWTH',
      });
    });
  });
});
