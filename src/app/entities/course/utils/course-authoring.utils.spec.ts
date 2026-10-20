import { describe, expect, it } from 'vitest';
import {
  COURSE_IDEA_MAX_LENGTH,
  emptyCourseAuthoring,
  isCourseAuthoringStatus,
  normalizeCourseAuthoring,
  courseAuthoringWithIdea,
  sameCourseAuthoring,
} from './course-authoring.utils';

describe('course-authoring.utils', () => {
  // ── COURSE_IDEA_MAX_LENGTH ──

  describe('COURSE_IDEA_MAX_LENGTH', () => {
    it('should have max length', () => {
      expect(COURSE_IDEA_MAX_LENGTH).toBe(16000);
    });
  });

  // ── emptyCourseAuthoring ──

  describe('emptyCourseAuthoring', () => {
    it('should return empty authoring', () => {
      const result = emptyCourseAuthoring();
      expect(result.idea).toBe('');
      expect(result.status).toBe('draft');
    });
  });

  // ── isCourseAuthoringStatus ──

  describe('isCourseAuthoringStatus', () => {
    it('should return true for valid statuses', () => {
      expect(isCourseAuthoringStatus('draft')).toBe(true);
      expect(isCourseAuthoringStatus('planned')).toBe(true);
      expect(isCourseAuthoringStatus('generating')).toBe(true);
      expect(isCourseAuthoringStatus('materialized')).toBe(true);
      expect(isCourseAuthoringStatus('failed')).toBe(true);
    });

    it('should return false for invalid status', () => {
      expect(isCourseAuthoringStatus('invalid')).toBe(false);
      expect(isCourseAuthoringStatus('')).toBe(false);
      expect(isCourseAuthoringStatus('DRAFT')).toBe(false);
    });
  });

  // ── normalizeCourseAuthoring ──

  describe('normalizeCourseAuthoring', () => {
    it('should return undefined for undefined input', () => {
      expect(normalizeCourseAuthoring(undefined)).toBeUndefined();
    });

    it('should normalize empty authoring to undefined', () => {
      const result = normalizeCourseAuthoring({ idea: '', status: 'draft' });
      expect(result).toBeUndefined();
    });

    it('should normalize authoring with trimmed empty idea to undefined', () => {
      const result = normalizeCourseAuthoring({ idea: '   ', status: 'draft' });
      expect(result).toBeUndefined();
    });

    it('should keep authoring with non-empty idea', () => {
      const result = normalizeCourseAuthoring({ idea: 'My idea', status: 'draft' });
      expect(result).toBeDefined();
      expect(result!.idea).toBe('My idea');
      expect(result!.status).toBe('draft');
    });

    it('should normalize invalid status to draft', () => {
      const result = normalizeCourseAuthoring({
        idea: 'Test',
        status: 'invalid' as never,
      });
      expect(result!.status).toBe('draft');
    });

    it('should preserve ideaUpdatedAt', () => {
      const ts = '2024-01-01T00:00:00.000Z';
      const result = normalizeCourseAuthoring({
        idea: 'Test',
        status: 'draft',
        ideaUpdatedAt: ts,
      });
      expect(result!.ideaUpdatedAt).toBe(ts);
    });

    it('should preserve materializedAt', () => {
      const ts = '2024-01-01T00:00:00.000Z';
      const result = normalizeCourseAuthoring({
        idea: 'Test',
        status: 'draft',
        materializedAt: ts,
      });
      expect(result!.materializedAt).toBe(ts);
    });

    it('should preserve lastError', () => {
      const result = normalizeCourseAuthoring({
        idea: 'Test',
        status: 'draft',
        lastError: 'Something failed',
      });
      expect(result!.lastError).toBe('Something failed');
    });

    it('should keep authoring with materializedAt even with empty idea', () => {
      const ts = '2024-01-01T00:00:00.000Z';
      const result = normalizeCourseAuthoring({
        idea: '',
        status: 'draft',
        materializedAt: ts,
      });
      expect(result).toBeDefined();
    });

    it('should keep authoring with lastError even with empty idea', () => {
      const result = normalizeCourseAuthoring({
        idea: '',
        status: 'draft',
        lastError: 'Error',
      });
      expect(result).toBeDefined();
    });
  });

  // ── courseAuthoringWithIdea ──

  describe('courseAuthoringWithIdea', () => {
    it('should return same authoring when idea is unchanged', () => {
      const authoring = { idea: 'Test', status: 'draft' as const };
      const result = courseAuthoringWithIdea(authoring, 'Test');
      expect(result.idea).toBe('Test');
      expect(result.status).toBe('draft');
    });

    it('should update idea when different', () => {
      const authoring = { idea: 'Old', status: 'draft' as const };
      const result = courseAuthoringWithIdea(authoring, 'New');
      expect(result.idea).toBe('New');
      expect(result.ideaUpdatedAt).toBeDefined();
    });

    it('should reset status from materialized to draft when idea changes', () => {
      const authoring = { idea: 'Old', status: 'materialized' as const };
      const result = courseAuthoringWithIdea(authoring, 'New');
      expect(result.status).toBe('draft');
    });

    it('should preserve status when idea unchanged', () => {
      const authoring = { idea: 'Same', status: 'materialized' as const };
      const result = courseAuthoringWithIdea(authoring, 'Same');
      expect(result.status).toBe('materialized');
    });

    it('should preserve status when idea changes from non-materialized', () => {
      const authoring = { idea: 'Old', status: 'generating' as const };
      const result = courseAuthoringWithIdea(authoring, 'New');
      expect(result.status).toBe('generating');
    });

    it('should trim whitespace when comparing ideas', () => {
      const authoring = { idea: '  Test  ', status: 'draft' as const };
      const result = courseAuthoringWithIdea(authoring, 'Test');
      expect(result.idea).toBe('Test');
    });

    it('should update idea when whitespace differs', () => {
      const authoring = { idea: 'Test', status: 'draft' as const };
      const result = courseAuthoringWithIdea(authoring, '  Test  ');
      expect(result.idea).toBe('  Test  ');
    });
  });

  // ── sameCourseAuthoring ──

  describe('sameCourseAuthoring', () => {
    it('should return true for equal authorings', () => {
      const a = { idea: 'Test', status: 'draft' as const };
      expect(sameCourseAuthoring(a, a)).toBe(true);
    });

    it('should return true for structurally equal authorings', () => {
      const a = { idea: 'Test', status: 'draft' as const };
      const b = { idea: 'Test', status: 'draft' as const };
      expect(sameCourseAuthoring(a, b)).toBe(true);
    });

    it('should return false for different ideas', () => {
      expect(
        sameCourseAuthoring(
          { idea: 'A', status: 'draft' as const },
          { idea: 'B', status: 'draft' as const },
        ),
      ).toBe(false);
    });

    it('should return true for both undefined', () => {
      expect(sameCourseAuthoring(undefined, undefined)).toBe(true);
    });

    it('should return true for undefined and empty', () => {
      expect(sameCourseAuthoring(undefined, { idea: '', status: 'draft' })).toBe(true);
    });

    it('should return false for undefined and non-empty', () => {
      expect(sameCourseAuthoring(undefined, { idea: 'Test', status: 'draft' as const })).toBe(
        false,
      );
    });

    it('should return false when only whitespace differs in idea', () => {
      expect(
        sameCourseAuthoring(
          { idea: '  Test  ', status: 'draft' as const },
          { idea: 'Test', status: 'draft' as const },
        ),
      ).toBe(false);
    });
  });
});
