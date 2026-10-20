import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DraftsStore } from './drafts-store';
import type { AppColorScheme, UserPreferences } from '../../../entities/user/model';
import type { RomanizationSystem, ToneColorSchemeId } from '../../../entities/phonetic/model';
import { TRACING_STROKE_DURATION_BOUNDS } from '../../../entities/phonetic/model';
import type { AnswerDisplayMode } from '../../../entities/course/ui/course-display-settings-matrix/course-display-settings-matrix.util';

describe('DraftsStore', () => {
  let store: DraftsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(DraftsStore);
  });

  // ── Profile section ──

  it('should have initial profile draft values', () => {
    expect(store.profileNameDraft()).toBe('');
    expect(store.profileLearningProficiencyDraft()).toBe('beginner');
    expect(store.profileThemeDraft()).toBe('light');
    expect(store.profileFontSizeDraft()).toBe('md');
    expect(store.profileColorSchemeDraft()).toBe('light');
    expect(store.profileCardFocusFullscreenDraft()).toBe(false);
  });

  it('should update profile name draft', () => {
    store.setProfileNameDraft('Alice');
    expect(store.profileNameDraft()).toBe('Alice');
  });

  it('should update profile learning proficiency draft', () => {
    store.setProfileLearningProficiencyDraft('intermediate');
    expect(store.profileLearningProficiencyDraft()).toBe('intermediate');
  });

  it('should update profile theme draft', () => {
    store.setProfileThemeDraft('dark');
    expect(store.profileThemeDraft()).toBe('dark');
  });

  it('should update profile font size draft', () => {
    store.setProfileFontSizeDraft('lg');
    expect(store.profileFontSizeDraft()).toBe('lg');
  });

  it('should update profile color scheme draft', () => {
    store.setProfileColorSchemeDraft('dark');
    expect(store.profileColorSchemeDraft()).toBe('dark');
  });

  it('should update profile card focus fullscreen draft', () => {
    store.setProfileCardFocusFullscreenDraft(true);
    expect(store.profileCardFocusFullscreenDraft()).toBe(true);
  });

  it('should initialize all profile drafts from values', () => {
    store.initializeProfile(
      'Bob',
      'advanced',
      'dark' as AppColorScheme,
      'sm' as UserPreferences['fontSize'],
      'ocean' as AppColorScheme,
      true,
    );

    expect(store.profileNameDraft()).toBe('Bob');
    expect(store.profileLearningProficiencyDraft()).toBe('advanced');
    expect(store.profileThemeDraft()).toBe('dark');
    expect(store.profileFontSizeDraft()).toBe('sm');
    expect(store.profileColorSchemeDraft()).toBe('ocean');
    expect(store.profileCardFocusFullscreenDraft()).toBe(true);
  });

  // ── Course Tab section ──

  it('should have initial course tab draft values', () => {
    expect(store.courseTabKnownLanguageDraft()).toBe('ru');
    expect(store.courseTabLearningLanguageDraft()).toBe('en');
  });

  it('should update known language draft', () => {
    store.setCourseTabKnownLanguageDraft('en');
    expect(store.courseTabKnownLanguageDraft()).toBe('en');
  });

  it('should update learning language draft', () => {
    store.setCourseTabLearningLanguageDraft('zh');
    expect(store.courseTabLearningLanguageDraft()).toBe('zh');
  });

  it('should report language pair as invalid when languages are the same', () => {
    store.setCourseTabKnownLanguageDraft('en');
    store.setCourseTabLearningLanguageDraft('en');
    expect(store.courseTabLanguagePairInvalid()).toBe(true);
  });

  it('should report language pair as valid when languages differ', () => {
    store.setCourseTabKnownLanguageDraft('en');
    store.setCourseTabLearningLanguageDraft('ru');
    expect(store.courseTabLanguagePairInvalid()).toBe(false);
  });

  // ── Settings section ──

  it('should have initial settings draft values', () => {
    expect(store.settingsPairIdDraft()).toBe('');
    expect(store.settingsDisplayRomanizationsDraft()).toEqual(['pinyin']);
    expect(store.settingsAnswerRomanizationsDraft()).toEqual(['pinyin', 'palladius']);
    expect(store.settingsShowIpaDraft()).toBe(false);
    expect(store.settingsIpaVariantLabelDraft()).toBe('');
    expect(store.settingsAnswerModesDraft()).toEqual(['orthography']);
    expect(store.settingsToneColorEnabledDraft()).toBe(false);
    expect(store.settingsToneColorSchemeDraft()).toBe('classic');
    expect(store.settingsTracingStrokeDurationDraft()).toBe(
      TRACING_STROKE_DURATION_BOUNDS.defaultSec,
    );
  });

  it('should update settings pair id draft', () => {
    store.setSettingsPairIdDraft('pair-1');
    expect(store.settingsPairIdDraft()).toBe('pair-1');
  });

  it('should update settings display romanizations draft', () => {
    store.setSettingsDisplayRomanizationsDraft(['pinyin', 'palladius']);
    expect(store.settingsDisplayRomanizationsDraft()).toEqual(['pinyin', 'palladius']);
  });

  it('should update settings answer romanizations draft', () => {
    store.setSettingsAnswerRomanizationsDraft(['palladius']);
    expect(store.settingsAnswerRomanizationsDraft()).toEqual(['palladius']);
  });

  it('should update settings show ipa draft', () => {
    store.setSettingsShowIpaDraft(true);
    expect(store.settingsShowIpaDraft()).toBe(true);
  });

  it('should update settings ipa variant label draft', () => {
    store.setSettingsIpaVariantLabelDraft('CC-CEDICT');
    expect(store.settingsIpaVariantLabelDraft()).toBe('CC-CEDICT');
  });

  it('should update settings answer modes draft', () => {
    store.setSettingsAnswerModesDraft(['orthography', 'ipa']);
    expect(store.settingsAnswerModesDraft()).toEqual(['orthography', 'ipa']);
  });

  it('should update settings tone color enabled draft', () => {
    store.setSettingsToneColorEnabledDraft(true);
    expect(store.settingsToneColorEnabledDraft()).toBe(true);
  });

  it('should update settings tone color scheme draft', () => {
    store.setSettingsToneColorSchemeDraft('pastel');
    expect(store.settingsToneColorSchemeDraft()).toBe('pastel');
  });

  it('should update settings tracing stroke duration draft', () => {
    store.setSettingsTracingStrokeDurationDraft(30);
    expect(store.settingsTracingStrokeDurationDraft()).toBe(30);
  });

  it('should initialize all settings drafts from values', () => {
    store.initializeSettings(
      'pair-2',
      ['pinyin'] as RomanizationSystem[],
      ['palladius'] as RomanizationSystem[],
      true,
      'X-SAMPA',
      ['orthography', 'audio'] as AnswerDisplayMode[],
      true,
      'classic' as ToneColorSchemeId,
      60,
    );

    expect(store.settingsPairIdDraft()).toBe('pair-2');
    expect(store.settingsDisplayRomanizationsDraft()).toEqual(['pinyin']);
    expect(store.settingsAnswerRomanizationsDraft()).toEqual(['palladius']);
    expect(store.settingsShowIpaDraft()).toBe(true);
    expect(store.settingsIpaVariantLabelDraft()).toBe('X-SAMPA');
    expect(store.settingsAnswerModesDraft()).toEqual(['orthography', 'audio']);
    expect(store.settingsToneColorEnabledDraft()).toBe(true);
    expect(store.settingsToneColorSchemeDraft()).toBe('classic');
    expect(store.settingsTracingStrokeDurationDraft()).toBe(60);
  });

  // ── Independence of sections ──

  it('should allow independent updates across sections', () => {
    store.setProfileNameDraft('Carol');
    store.setCourseTabKnownLanguageDraft('zh');
    store.setSettingsShowIpaDraft(true);

    expect(store.profileNameDraft()).toBe('Carol');
    expect(store.courseTabKnownLanguageDraft()).toBe('zh');
    expect(store.settingsShowIpaDraft()).toBe(true);
    // Other values unchanged
    expect(store.profileLearningProficiencyDraft()).toBe('beginner');
    expect(store.courseTabLearningLanguageDraft()).toBe('en');
    expect(store.settingsDisplayRomanizationsDraft()).toEqual(['pinyin']);
  });
});
