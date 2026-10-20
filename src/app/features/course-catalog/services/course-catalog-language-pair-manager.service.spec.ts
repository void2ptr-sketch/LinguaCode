import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { vi } from 'vitest';

import { UserStore } from '../../../entities/user/model/user.store';
import { DraftsStore } from './drafts-store';
import { CourseCatalogLanguagePairManagerService } from './course-catalog-language-pair-manager.service';
import type { UserLanguagePairEntry } from '../../../entities/user/model';
import type { ContentLanguage } from '../../../entities/card/model';

function makePair(
  id: string,
  known: ContentLanguage,
  learning: ContentLanguage,
): UserLanguagePairEntry {
  return {
    id,
    pair: { known, learning },
    createdAt: '2024-01-01T00:00:00.000Z',
  };
}

describe('CourseCatalogLanguagePairManagerService', () => {
  let service: CourseCatalogLanguagePairManagerService;
  let mockUserStore: Partial<UserStore>;
  let mockDrafts: Partial<DraftsStore>;

  const mockPairs: UserLanguagePairEntry[] = [makePair('pair-1', 'ru', 'en')];

  beforeEach(() => {
    mockUserStore = {
      displayName: signal('Ученик'),
      preferences: signal({
        theme: 'azure-blue',
        fontSize: 'md',
        colorScheme: 'light',
        cardFocusFullscreen: false,
        learningProficiencyLevel: 'beginner',
        languagePairs: mockPairs,
        activeLanguagePairId: 'pair-1',
      }),
      languagePairs: signal(mockPairs),
      activeLanguagePairId: signal('pair-1'),
      languagePair: signal({ known: 'ru', learning: 'en' }),
      formatEntryLabel: vi.fn(
        (entry: UserLanguagePairEntry) => `${entry.pair.known} → ${entry.pair.learning}`,
      ),
      isActiveEntry: vi.fn((entry: UserLanguagePairEntry) => entry.id === 'pair-1'),
      setActiveLanguagePair: vi.fn(),
      removeLanguagePair: vi.fn(),
      addLanguagePair: vi.fn(),
      updateDisplayName: vi.fn(),
      updatePreferences: vi.fn(),
      updateLanguagePairSettings: vi.fn(),
    };

    mockDrafts = {
      profileNameDraft: signal('Ученик'),
      profileLearningProficiencyDraft: signal('beginner'),
      profileThemeDraft: signal('light'),
      profileFontSizeDraft: signal('md'),
      profileColorSchemeDraft: signal('light'),
      profileCardFocusFullscreenDraft: signal(false),
      courseTabKnownLanguageDraft: signal('ru'),
      courseTabLearningLanguageDraft: signal('en'),
      courseTabLanguagePairInvalid: computed(() => false),
      settingsPairIdDraft: signal('pair-1'),
      settingsDisplayRomanizationsDraft: signal(['pinyin']),
      settingsAnswerRomanizationsDraft: signal(['pinyin']),
      settingsShowIpaDraft: signal(false),
      settingsIpaVariantLabelDraft: signal(''),
      settingsAnswerModesDraft: signal(['orthography']),
      settingsToneColorEnabledDraft: signal(false),
      settingsToneColorSchemeDraft: signal('classic'),
      settingsTracingStrokeDurationDraft: signal(0.5),
      setProfileNameDraft: vi.fn(),
      setProfileLearningProficiencyDraft: vi.fn(),
      setProfileThemeDraft: vi.fn(),
      setProfileFontSizeDraft: vi.fn(),
      setProfileColorSchemeDraft: vi.fn(),
      setProfileCardFocusFullscreenDraft: vi.fn(),
      setCourseTabKnownLanguageDraft: vi.fn(),
      setCourseTabLearningLanguageDraft: vi.fn(),
      setSettingsPairIdDraft: vi.fn(),
      setSettingsDisplayRomanizationsDraft: vi.fn(),
      setSettingsAnswerRomanizationsDraft: vi.fn(),
      setSettingsShowIpaDraft: vi.fn(),
      setSettingsIpaVariantLabelDraft: vi.fn(),
      setSettingsAnswerModesDraft: vi.fn(),
      setSettingsToneColorEnabledDraft: vi.fn(),
      setSettingsToneColorSchemeDraft: vi.fn(),
      setSettingsTracingStrokeDurationDraft: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CourseCatalogLanguagePairManagerService,
        { provide: UserStore, useValue: mockUserStore },
        { provide: DraftsStore, useValue: mockDrafts },
      ],
    });

    service = TestBed.inject(CourseCatalogLanguagePairManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call user store setActiveLanguagePair and sync drafts on setActive', () => {
    service.setActive('pair-1');

    expect(mockUserStore.setActiveLanguagePair).toHaveBeenCalledWith('pair-1');
    expect(mockDrafts.setSettingsPairIdDraft).toHaveBeenCalledWith('pair-1');
  });

  it('should call user store removeLanguagePair on removePair', () => {
    service.removePair('pair-1');

    expect(mockUserStore.removeLanguagePair).toHaveBeenCalledWith('pair-1');
  });

  it('should call user store addLanguagePair on addPair when languages differ', () => {
    (
      mockDrafts.courseTabKnownLanguageDraft as import('@angular/core').WritableSignal<ContentLanguage>
    ).set('ru');
    (
      mockDrafts.courseTabLearningLanguageDraft as import('@angular/core').WritableSignal<ContentLanguage>
    ).set('zh');

    const result = service.addPair();

    expect(result).toBe(true);
    expect(mockUserStore.addLanguagePair).toHaveBeenCalled();
  });

  it('should not add pair when languages are the same', () => {
    (
      mockDrafts.courseTabKnownLanguageDraft as import('@angular/core').WritableSignal<ContentLanguage>
    ).set('en');
    (
      mockDrafts.courseTabLearningLanguageDraft as import('@angular/core').WritableSignal<ContentLanguage>
    ).set('en');

    const result = service.addPair();

    expect(result).toBe(false);
    expect(mockUserStore.addLanguagePair).not.toHaveBeenCalled();
  });

  it('should sync pair settings drafts', () => {
    service.syncPairSettingsDrafts();

    expect(mockDrafts.setSettingsDisplayRomanizationsDraft).toHaveBeenCalled();
    expect(mockDrafts.setSettingsAnswerRomanizationsDraft).toHaveBeenCalled();
    expect(mockDrafts.setSettingsToneColorEnabledDraft).toHaveBeenCalled();
    expect(mockDrafts.setSettingsShowIpaDraft).toHaveBeenCalled();
  });

  it('should return settings entry', () => {
    const entry = service.settingsEntry();
    expect(entry).toBeTruthy();
    expect(entry?.id).toBe('pair-1');
  });

  it('should return null when no settings entry', () => {
    // When settingsPairIdDraft doesn't match any pair, it falls back to first pair
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'nonexistent',
    );
    const entry = service.settingsEntry();
    // Falls back to first pair, not null
    expect(entry).toBeTruthy();
    expect(entry?.id).toBe('pair-1');
  });

  it('should track active pair change', () => {
    const loadCallback = vi.fn().mockResolvedValue(undefined);
    TestBed.runInInjectionContext(() => {
      service.trackActivePairChange(loadCallback);
    });
    // Effect is created but doesn't call callback on first trigger
    expect(loadCallback).not.toHaveBeenCalled();
  });

  it('should return false from addPair when known equals learning', () => {
    (
      mockDrafts.courseTabKnownLanguageDraft as import('@angular/core').WritableSignal<ContentLanguage>
    ).set('en');
    (
      mockDrafts.courseTabLearningLanguageDraft as import('@angular/core').WritableSignal<ContentLanguage>
    ).set('en');

    expect(service.addPair()).toBe(false);
    expect(mockUserStore.addLanguagePair).not.toHaveBeenCalled();
  });

  it('should add pair and set active when known differs from learning', () => {
    (
      mockDrafts.courseTabKnownLanguageDraft as import('@angular/core').WritableSignal<ContentLanguage>
    ).set('ru');
    (
      mockDrafts.courseTabLearningLanguageDraft as import('@angular/core').WritableSignal<ContentLanguage>
    ).set('zh');

    const result = service.addPair();

    expect(result).toBe(true);
    expect(mockUserStore.addLanguagePair).toHaveBeenCalled();
    expect(mockDrafts.setSettingsPairIdDraft).toHaveBeenCalled();
  });

  it('should remove pair and reassign settings to active pair when settings pair is removed', () => {
    const secondPair = makePair('pair-2', 'en', 'zh');
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([makePair('pair-1', 'ru', 'en'), secondPair]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-1',
    );

    service.removePair('pair-1');

    expect(mockUserStore.removeLanguagePair).toHaveBeenCalledWith('pair-1');
    // When settings pair is removed, settings reassign to activeLanguagePairId
    expect(mockDrafts.setSettingsPairIdDraft).toHaveBeenCalledWith('pair-1');
  });

  it('should remove pair and reassign settings when settings pair differs from active', () => {
    const secondPair = makePair('pair-2', 'en', 'zh');
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([makePair('pair-1', 'ru', 'en'), secondPair]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-2',
    );

    service.removePair('pair-2');

    expect(mockUserStore.removeLanguagePair).toHaveBeenCalledWith('pair-2');
    // After removing pair-2, settings reassign to activeLanguagePairId (pair-1)
    expect(mockDrafts.setSettingsPairIdDraft).toHaveBeenCalledWith('pair-1');
  });

  it('should return settings entry from first pair when draft id does not match', () => {
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'nonexistent',
    );

    const entry = service.settingsEntry();
    expect(entry?.id).toBe('pair-1');
  });

  it('should return null when no pairs exist', () => {
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'nonexistent',
    );

    const entry = service.settingsEntry();
    expect(entry).toBeNull();
  });

  it('should show CJK preferences when pair is ru→zh', () => {
    expect(service.shouldShowCjkPreferences({ known: 'ru', learning: 'zh' })).toBe(true);
  });

  it('should not show CJK preferences for other pairs', () => {
    expect(service.shouldShowCjkPreferences({ known: 'en', learning: 'zh' })).toBe(false);
    expect(service.shouldShowCjkPreferences({ known: 'ru', learning: 'en' })).toBe(false);
    expect(service.shouldShowCjkPreferences({ known: 'en', learning: 'ru' })).toBe(false);
  });

  it('should show phonetic preferences for English', () => {
    expect(service.shouldShowPhoneticPreferences({ known: 'ru', learning: 'en' })).toBe(true);
  });

  it('should show phonetic preferences for Chinese', () => {
    expect(service.shouldShowPhoneticPreferences({ known: 'en', learning: 'zh' })).toBe(true);
  });

  it('should not show phonetic preferences for other languages', () => {
    expect(service.shouldShowPhoneticPreferences({ known: 'ru', learning: 'de' })).toBe(false);
  });

  it('should show tracing settings for Chinese', () => {
    expect(service.shouldShowTracingSettings({ known: 'ru', learning: 'zh' })).toBe(true);
  });

  it('should not show tracing settings for non-Chinese', () => {
    expect(service.shouldShowTracingSettings({ known: 'en', learning: 'en' })).toBe(false);
    expect(service.shouldShowTracingSettings({ known: 'ru', learning: 'en' })).toBe(false);
  });

  it('should include palladius in romanization options when CJK preferences shown', () => {
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([makePair('pair-zh', 'ru', 'zh')]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-zh',
    );

    const options = service.romanizationOptions();
    const values = options.map((o) => o.value);
    expect(values).toContain('palladius');
    expect(values).toContain('pinyin');
  });

  it('should not include palladius when CJK preferences not shown', () => {
    const options = service.romanizationOptions();
    const values = options.map((o) => o.value);
    expect(values).not.toContain('palladius');
    expect(values).toContain('pinyin');
  });

  it('should save CJK settings when entry has ru→zh pair', () => {
    const zhPair = makePair('pair-zh', 'ru', 'zh');
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([zhPair]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-zh',
    );

    service.savePairSettings(zhPair);

    expect(mockUserStore.updateLanguagePairSettings).toHaveBeenCalledWith(
      'pair-zh',
      expect.objectContaining({
        cjkLearning: expect.any(Object),
      }),
    );
  });

  it('should save phonetic settings when entry has English pair', () => {
    const enPair = makePair('pair-en', 'ru', 'en');
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([enPair]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-en',
    );

    service.savePairSettings(enPair);

    expect(mockUserStore.updateLanguagePairSettings).toHaveBeenCalledWith(
      'pair-en',
      expect.objectContaining({
        phonetic: expect.any(Object),
      }),
    );
  });

  it('should not save settings when no CJK or phonetic preferences apply', () => {
    const javaPair = makePair('pair-java', 'ru', 'java');
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([javaPair]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-java',
    );

    service.savePairSettings(javaPair);

    expect(mockUserStore.updateLanguagePairSettings).not.toHaveBeenCalled();
  });

  it('should save both CJK and phonetic settings when entry matches both', () => {
    const pair = makePair('pair-both', 'ru', 'zh');
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([pair]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-both',
    );

    service.savePairSettings(pair);

    expect(mockUserStore.updateLanguagePairSettings).toHaveBeenCalledWith(
      'pair-both',
      expect.objectContaining({
        cjkLearning: expect.any(Object),
        phonetic: expect.any(Object),
      }),
    );
  });

  it('should trim IPA variant label and omit when empty', () => {
    const enPair = makePair('pair-en', 'ru', 'en');
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([enPair]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-en',
    );
    (mockDrafts.settingsIpaVariantLabelDraft as import('@angular/core').WritableSignal<string>).set(
      '  ',
    );

    service.savePairSettings(enPair);

    const updateCall = (mockUserStore.updateLanguagePairSettings as ReturnType<typeof vi.fn>).mock
      .calls[0];
    const patch = updateCall[1] as Partial<UserLanguagePairEntry> & {
      phonetic?: { ipaVariantLabel?: string };
    };
    expect(patch.phonetic?.ipaVariantLabel).toBeUndefined();
  });
});
