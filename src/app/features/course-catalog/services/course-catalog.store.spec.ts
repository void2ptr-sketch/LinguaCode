import { TestBed } from '@angular/core/testing';
import { CourseCatalogStore } from './course-catalog.store';
import { initialState } from '../models/course-catalog-store';
import type { CourseIndexEntry } from '../../../core/models';
import type { PageEvent } from '@angular/material/paginator';

describe('CourseCatalogStore', () => {
  let store: CourseCatalogStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(CourseCatalogStore);
  });

  describe('initial state', () => {
    it('should have default items', () => {
      expect(store.items()).toEqual([]);
    });

    it('should have default totalItems', () => {
      expect(store.totalItems()).toBe(0);
    });

    it('should have default pageIndex', () => {
      expect(store.pageIndex()).toBe(0);
    });

    it('should have default pageSize', () => {
      expect(store.pageSize()).toBe(10);
    });

    it('should have default loading state', () => {
      expect(store.loading()).toBe(false);
    });

    it('should have default error state', () => {
      expect(store.error()).toBeNull();
    });

    it('should have default progressByCourseId', () => {
      expect(store.progressByCourseId()).toEqual({});
    });

    it('should have default completedCourseIds', () => {
      expect(store.completedCourseIds()).toBeInstanceOf(Set);
      expect(store.completedCourseIds().size).toBe(0);
    });

    it('should have default nameDraft', () => {
      expect(store.nameDraft()).toBe('');
    });

    it('should have default learningProficiencyDraft', () => {
      expect(store.learningProficiencyDraft()).toBe('beginner');
    });

    it('should have default themeDraft', () => {
      expect(store.themeDraft()).toBe('azure-blue');
    });

    it('should have default fontSizeDraft', () => {
      expect(store.fontSizeDraft()).toBe('md');
    });

    it('should have default colorSchemeDraft', () => {
      expect(store.colorSchemeDraft()).toBe('light');
    });

    it('should have default cardFocusFullscreenDraft', () => {
      expect(store.cardFocusFullscreenDraft()).toBe(false);
    });

    it('should have default knownLanguageDraft', () => {
      expect(store.knownLanguageDraft()).toBe('ru');
    });

    it('should have default learningLanguageDraft', () => {
      expect(store.learningLanguageDraft()).toBe('en');
    });

    it('should have default settingsPairIdDraft', () => {
      expect(store.settingsPairIdDraft()).toBe('');
    });

    it('should have default displayRomanizationsDraft', () => {
      expect(store.displayRomanizationsDraft()).toEqual(['pinyin']);
    });

    it('should have default answerRomanizationsDraft', () => {
      expect(store.answerRomanizationsDraft()).toEqual(['pinyin', 'palladius']);
    });

    it('should have default showIpaDraft', () => {
      expect(store.showIpaDraft()).toBe(false);
    });

    it('should have default ipaVariantLabelDraft', () => {
      expect(store.ipaVariantLabelDraft()).toBe('');
    });

    it('should have default answerModesDraft', () => {
      expect(store.answerModesDraft()).toEqual(['orthography']);
    });

    it('should have default toneColorEnabledDraft', () => {
      expect(store.toneColorEnabledDraft()).toBe(false);
    });

    it('should have default toneColorSchemeDraft', () => {
      expect(store.toneColorSchemeDraft()).toBe('classic');
    });

    it('should have default tracingStrokeDurationDraft', () => {
      expect(store.tracingStrokeDurationDraft()).toBe(initialState.tracingStrokeDurationDraft);
    });

    it('should have default selectedTabIndex', () => {
      expect(store.selectedTabIndex()).toBe(0);
    });
  });

  describe('derived signals', () => {
    it('should return false for languagePairInvalid when languages differ', () => {
      expect(store.languagePairInvalid()).toBe(false);
    });

    it('should return true for languagePairInvalid when languages are equal', () => {
      store.setKnownLanguageDraft('en');
      store.setLearningLanguageDraft('en');
      expect(store.languagePairInvalid()).toBe(true);
    });

    it('should reset languagePairInvalid when languages differ again', () => {
      store.setKnownLanguageDraft('en');
      store.setLearningLanguageDraft('en');
      expect(store.languagePairInvalid()).toBe(true);

      store.setKnownLanguageDraft('ru');
      expect(store.languagePairInvalid()).toBe(false);
    });

    it('should return empty string for settingsEntryLabel', () => {
      expect(store.settingsEntryLabel()).toBe('');
    });

    it('should return romanization options', () => {
      const options = store.romanizationOptions();
      expect(options).toHaveLength(2);
      expect(options[0]).toEqual({ value: 'pinyin', label: 'Пиньинь' });
      expect(options[1]).toEqual({ value: 'zhuyin', label: 'Жуинь (Bopomofo)' });
    });
  });

  describe('course catalog mutations', () => {
    it('should set items', () => {
      const items: CourseIndexEntry[] = [
        { id: 'c1', title: 'Course 1', authorId: 'user1', lessonCount: 5, published: true, updatedAt: '2024-01-01T00:00:00.000Z', languagePairSummary: 'Русский → English' },
      ];
      store.setItems(items);
      expect(store.items()).toEqual(items);
    });

    it('should set totalItems', () => {
      store.setTotalItems(42);
      expect(store.totalItems()).toBe(42);
    });

    it('should set pageIndex', () => {
      store.setPageIndex(3);
      expect(store.pageIndex()).toBe(3);
    });

    it('should set pageSize', () => {
      store.setPageSize(25);
      expect(store.pageSize()).toBe(25);
    });

    it('should set loading', () => {
      store.setLoading(true);
      expect(store.loading()).toBe(true);

      store.setLoading(false);
      expect(store.loading()).toBe(false);
    });

    it('should set error', () => {
      store.setError('Some error');
      expect(store.error()).toBe('Some error');

      store.setError(null);
      expect(store.error()).toBeNull();
    });

    it('should set progressByCourseId', () => {
      store.setProgressByCourseId({ c1: 50, c2: 100 });
      expect(store.progressByCourseId()).toEqual({ c1: 50, c2: 100 });
    });

    it('should set completedCourseIds', () => {
      const completed = new Set(['c1', 'c2']);
      store.setCompletedCourseIds(completed);
      expect(store.completedCourseIds()).toEqual(completed);
    });
  });

  describe('profile mutations', () => {
    it('should set nameDraft', () => {
      store.setNameDraft('Alex');
      expect(store.nameDraft()).toBe('Alex');
    });

    it('should set learningProficiencyDraft', () => {
      store.setLearningProficiencyDraft('advanced');
      expect(store.learningProficiencyDraft()).toBe('advanced');
    });

    it('should set themeDraft', () => {
      store.setThemeDraft('dark');
      expect(store.themeDraft()).toBe('dark');
    });

    it('should set fontSizeDraft', () => {
      store.setFontSizeDraft('lg');
      expect(store.fontSizeDraft()).toBe('lg');
    });

    it('should set colorSchemeDraft', () => {
      store.setColorSchemeDraft('dark');
      expect(store.colorSchemeDraft()).toBe('dark');
    });

    it('should set cardFocusFullscreenDraft', () => {
      store.setCardFocusFullscreenDraft(true);
      expect(store.cardFocusFullscreenDraft()).toBe(true);

      store.setCardFocusFullscreenDraft(false);
      expect(store.cardFocusFullscreenDraft()).toBe(false);
    });
  });

  describe('course tab mutations', () => {
    it('should set knownLanguageDraft', () => {
      store.setKnownLanguageDraft('en');
      expect(store.knownLanguageDraft()).toBe('en');
    });

    it('should set learningLanguageDraft', () => {
      store.setLearningLanguageDraft('zh');
      expect(store.learningLanguageDraft()).toBe('zh');
    });
  });

  describe('settings tab mutations', () => {
    it('should set settingsPairIdDraft', () => {
      store.setSettingsPairIdDraft('pair-123');
      expect(store.settingsPairIdDraft()).toBe('pair-123');
    });

    it('should set displayRomanizationsDraft', () => {
      store.setDisplayRomanizationsDraft(['palladius']);
      expect(store.displayRomanizationsDraft()).toEqual(['palladius']);
    });

    it('should set answerRomanizationsDraft', () => {
      store.setAnswerRomanizationsDraft(['pinyin']);
      expect(store.answerRomanizationsDraft()).toEqual(['pinyin']);
    });

    it('should set showIpaDraft', () => {
      store.setShowIpaDraft(true);
      expect(store.showIpaDraft()).toBe(true);
    });

    it('should set ipaVariantLabelDraft', () => {
      store.setIpaVariantLabelDraft('BrE');
      expect(store.ipaVariantLabelDraft()).toBe('BrE');
    });

    it('should set answerModesDraft', () => {
      store.setAnswerModesDraft(['orthography', 'ipa']);
      expect(store.answerModesDraft()).toEqual(['orthography', 'ipa']);
    });

    it('should set toneColorEnabledDraft', () => {
      store.setToneColorEnabledDraft(true);
      expect(store.toneColorEnabledDraft()).toBe(true);
    });

    it('should set toneColorSchemeDraft', () => {
      store.setToneColorSchemeDraft('warm');
      expect(store.toneColorSchemeDraft()).toBe('warm');
    });

    it('should set tracingStrokeDurationDraft', () => {
      store.setTracingStrokeDurationDraft(1.5);
      expect(store.tracingStrokeDurationDraft()).toBe(1.5);
    });
  });

  describe('tab control mutations', () => {
    it('should set selectedTabIndex', () => {
      store.setSelectedTabIndex(2);
      expect(store.selectedTabIndex()).toBe(2);
    });
  });

  describe('batch mutations', () => {
    it('should initialize from preferences', () => {
      store.initializeFromPreferences(
        'John',
        'intermediate',
        'dark',
        'lg',
        'dark',
        true,
        'pair-456',
        ['palladius'],
        ['pinyin'],
        true,
        'AmE',
        ['orthography', 'ipa'],
        true,
        'warm',
        1.2,
      );

      expect(store.nameDraft()).toBe('John');
      expect(store.learningProficiencyDraft()).toBe('intermediate');
      expect(store.themeDraft()).toBe('dark');
      expect(store.fontSizeDraft()).toBe('lg');
      expect(store.colorSchemeDraft()).toBe('dark');
      expect(store.cardFocusFullscreenDraft()).toBe(true);
      expect(store.settingsPairIdDraft()).toBe('pair-456');
      expect(store.displayRomanizationsDraft()).toEqual(['palladius']);
      expect(store.answerRomanizationsDraft()).toEqual(['pinyin']);
      expect(store.showIpaDraft()).toBe(true);
      expect(store.ipaVariantLabelDraft()).toBe('AmE');
      expect(store.answerModesDraft()).toEqual(['orthography', 'ipa']);
      expect(store.toneColorEnabledDraft()).toBe(true);
      expect(store.toneColorSchemeDraft()).toBe('warm');
      expect(store.tracingStrokeDurationDraft()).toBe(1.2);
    });

    it('should not mutate input arrays', () => {
      const inputRomanizations = ['pinyin'] as const;
      const inputAnswerRomanizations = ['palladius'] as const;

      store.initializeFromPreferences(
        'Name',
        'beginner',
        'light',
        'md',
        'light',
        false,
        'pair-1',
        inputRomanizations,
        inputAnswerRomanizations,
        false,
        '',
        ['orthography'],
        false,
        'classic',
        0.5,
      );

      // Mutate internal state
      const internalRomanizations = store.displayRomanizationsDraft();
      (internalRomanizations as string[]).push('zhuyin');

      // Original should not be affected
      expect(inputRomanizations).not.toContain('zhuyin');
    });
  });

  describe('page events', () => {
    it('should update pageIndex and pageSize from PageEvent', () => {
      const event: PageEvent = {
        pageIndex: 5,
        pageSize: 20,
        previousPageIndex: 0,
        length: 100,
      };

      store.onPageChange(event);
      expect(store.pageIndex()).toBe(5);
      expect(store.pageSize()).toBe(20);
    });

    it('should reset pageIndex to 0 on page size change', () => {
      store.setPageIndex(3);
      store.setPageSize(10);

      const event: PageEvent = {
        pageIndex: 0,
        pageSize: 50,
        previousPageIndex: 3,
        length: 200,
      };

      store.onPageChange(event);
      expect(store.pageIndex()).toBe(0);
      expect(store.pageSize()).toBe(50);
    });
  });

  describe('state isolation', () => {
    it('should not affect other state fields when updating single field', () => {
      store.setNameDraft('Test');
      expect(store.totalItems()).toBe(0);
      expect(store.items()).toEqual([]);
      expect(store.themeDraft()).toBe('azure-blue');
      expect(store.knownLanguageDraft()).toBe('ru');
    });

    it('should maintain state consistency after multiple updates', () => {
      store.setTotalItems(100);
      store.setPageIndex(2);
      store.setPageSize(15);
      store.setLoading(true);
      store.setError(null);

      expect(store.totalItems()).toBe(100);
      expect(store.pageIndex()).toBe(2);
      expect(store.pageSize()).toBe(15);
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
    });
  });
});
