import { describe, it, expect } from 'vitest';
import { initialState } from './course-catalog-store';
import type { CourseCatalogState } from './course-catalog-store';
import { TRACING_STROKE_DURATION_BOUNDS } from '../../../entities/phonetic/model';

describe('course-catalog-store model', () => {
  describe('initialState', () => {
    it('should have empty items array', () => {
      expect(initialState.items).toEqual([]);
    });

    it('should have zero totalItems', () => {
      expect(initialState.totalItems).toBe(0);
    });

    it('should have zero pageIndex', () => {
      expect(initialState.pageIndex).toBe(0);
    });

    it('should have default pageSize of 10', () => {
      expect(initialState.pageSize).toBe(10);
    });

    it('should have loading set to false', () => {
      expect(initialState.loading).toBe(false);
    });

    it('should have null error', () => {
      expect(initialState.error).toBeNull();
    });

    it('should have empty progressByCourseId', () => {
      expect(initialState.progressByCourseId).toEqual({});
    });

    it('should have empty completedCourseIds Set', () => {
      expect(initialState.completedCourseIds).toBeInstanceOf(Set);
      expect(initialState.completedCourseIds.size).toBe(0);
    });

    it('should have empty nameDraft', () => {
      expect(initialState.nameDraft).toBe('');
    });

    it('should have beginner learningProficiencyDraft', () => {
      expect(initialState.learningProficiencyDraft).toBe('beginner');
    });

    it('should have azure-blue themeDraft', () => {
      expect(initialState.themeDraft).toBe('azure-blue');
    });

    it('should have md fontSizeDraft', () => {
      expect(initialState.fontSizeDraft).toBe('md');
    });

    it('should have light colorSchemeDraft', () => {
      expect(initialState.colorSchemeDraft).toBe('light');
    });

    it('should have false cardFocusFullscreenDraft', () => {
      expect(initialState.cardFocusFullscreenDraft).toBe(false);
    });

    it('should have ru knownLanguageDraft', () => {
      expect(initialState.knownLanguageDraft).toBe('ru');
    });

    it('should have en learningLanguageDraft', () => {
      expect(initialState.learningLanguageDraft).toBe('en');
    });

    it('should have empty settingsPairIdDraft', () => {
      expect(initialState.settingsPairIdDraft).toBe('');
    });

    it('should have pinyin displayRomanizationsDraft', () => {
      expect(initialState.displayRomanizationsDraft).toEqual(['pinyin']);
    });

    it('should have pinyin and palladius answerRomanizationsDraft', () => {
      expect(initialState.answerRomanizationsDraft).toEqual(['pinyin', 'palladius']);
    });

    it('should have false showIpaDraft', () => {
      expect(initialState.showIpaDraft).toBe(false);
    });

    it('should have empty ipaVariantLabelDraft', () => {
      expect(initialState.ipaVariantLabelDraft).toBe('');
    });

    it('should have orthography answerModesDraft', () => {
      expect(initialState.answerModesDraft).toEqual(['orthography']);
    });

    it('should have false toneColorEnabledDraft', () => {
      expect(initialState.toneColorEnabledDraft).toBe(false);
    });

    it('should have classic toneColorSchemeDraft', () => {
      expect(initialState.toneColorSchemeDraft).toBe('classic');
    });

    it('should have default tracingStrokeDurationDraft', () => {
      expect(initialState.tracingStrokeDurationDraft).toBe(
        TRACING_STROKE_DURATION_BOUNDS.defaultSec,
      );
    });

    it('should have zero selectedTabIndex', () => {
      expect(initialState.selectedTabIndex).toBe(0);
    });
  });

  describe('type safety', () => {
    it('should be assignable to CourseCatalogState type', () => {
      const state: CourseCatalogState = initialState;
      expect(state).toBeDefined();
    });

    it('should be immutable - modifying copy should not affect original', () => {
      const copy = { ...initialState };
      copy.nameDraft = 'Modified';
      expect(initialState.nameDraft).toBe('');
    });
  });
});
