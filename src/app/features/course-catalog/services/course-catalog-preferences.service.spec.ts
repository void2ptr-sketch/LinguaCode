import { TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { vi } from 'vitest';

import { UserStore } from '../../../entities/user/model/user.store';
import { DraftsStore } from './drafts-store';
import { CourseCatalogLanguagePairManagerService } from './course-catalog-language-pair-manager.service';
import { CourseCatalogPreferencesService } from './course-catalog-preferences.service';
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

describe('CourseCatalogPreferencesService', () => {
  let service: CourseCatalogPreferencesService;
  let mockUserStore: Partial<UserStore>;
  let mockDrafts: Partial<DraftsStore>;
  let mockPairManager: Partial<CourseCatalogLanguagePairManagerService>;

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

    mockPairManager = {
      trackActivePairChange: vi.fn(),
      setActive: vi.fn(),
      removePair: vi.fn(),
      addPair: vi.fn().mockReturnValue(true),
      savePairSettings: vi.fn(),
      syncPairSettingsDrafts: vi.fn(),
      settingsEntry: vi.fn(() => mockPairs[0] ?? null),
      shouldShowCjkPreferences: vi.fn(() => false),
      shouldShowPhoneticPreferences: vi.fn(() => false),
      shouldShowTracingSettings: vi.fn(() => false),
      romanizationOptions: vi.fn(() => [
        { value: 'pinyin' as const, label: 'Пиньинь' },
        { value: 'zhuyin' as const, label: 'Жуинь (Bopomofo)' },
      ]),
    };

    TestBed.configureTestingModule({
      providers: [
        CourseCatalogPreferencesService,
        { provide: UserStore, useValue: mockUserStore },
        { provide: DraftsStore, useValue: mockDrafts },
        { provide: CourseCatalogLanguagePairManagerService, useValue: mockPairManager },
      ],
    });

    service = TestBed.inject(CourseCatalogPreferencesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should compute canRemovePair as false when only one pair', () => {
    expect(service.canRemovePair()).toBe(false);
  });

  it('should compute canRemovePair as true when multiple pairs', () => {
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([makePair('pair-1', 'ru', 'en'), makePair('pair-2', 'en', 'zh')]);
    expect(service.canRemovePair()).toBe(true);
  });

  it('should return settings entry', () => {
    const entry = service.settingsEntry();
    expect(entry).toBeTruthy();
    expect(entry?.id).toBe('pair-1');
  });

  it('should return settings course label', () => {
    const label = service.settingsCourseLabel();
    expect(label).toBe('ru → en');
  });

  it('should compute showCjkPreferences from pair manager', () => {
    expect(service.showCjkPreferences()).toBe(false);
  });

  it('should compute showPhoneticPreferences from pair manager', () => {
    // English 'en' triggers phonetic preferences
    expect(service.showPhoneticPreferences()).toBe(true);
  });

  it('should compute showTracingSettings from pair manager', () => {
    // Chinese 'zh' triggers tracing settings, but our pair is 'en'
    expect(service.showTracingSettings()).toBe(false);
  });

  it('should return romanization options from pair manager', () => {
    const options = service.romanizationOptions();
    expect(options).toHaveLength(2);
    expect(options[0].value).toBe('pinyin');
  });

  it('should return first pair when draft id does not match any pair', () => {
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'nonexistent',
    );
    const entry = service.settingsEntry();
    expect(entry?.id).toBe('pair-1');
  });

  it('should return label for fallback first pair when draft id does not match', () => {
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'nonexistent',
    );
    const label = service.settingsCourseLabel();
    expect(label).toBe('ru → en');
  });

  it('should show CJK preferences when pair manager returns true', () => {
    (mockPairManager.shouldShowCjkPreferences as ReturnType<typeof vi.fn>).mockReturnValue(true);
    expect(service.showCjkPreferences()).toBe(true);
  });

  it('should show phonetic preferences when learning is zh', () => {
    const zhPair = makePair('pair-zh', 'en', 'zh');
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([zhPair]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-zh',
    );
    expect(service.showPhoneticPreferences()).toBe(true);
  });

  it('should not show phonetic preferences when learning is neither en nor zh', () => {
    const ruPair = makePair('pair-ru', 'en', 'ru');
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([ruPair]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-ru',
    );
    expect(service.showPhoneticPreferences()).toBe(false);
  });

  it('should show tracing settings when learning is zh', () => {
    const zhPair = makePair('pair-zh', 'en', 'zh');
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([zhPair]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-zh',
    );
    expect(service.showTracingSettings()).toBe(true);
  });

  it('should not show tracing settings when learning is not zh', () => {
    const ruPair = makePair('pair-ru', 'en', 'ru');
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([ruPair]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-ru',
    );
    expect(service.showTracingSettings()).toBe(false);
  });

  it('should return null settings entry when no pairs exist', () => {
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-1',
    );

    const entry = service.settingsEntry();
    expect(entry).toBeNull();
  });

  it('should return empty label when settings entry is null', () => {
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-1',
    );

    const label = service.settingsCourseLabel();
    expect(label).toBe('');
  });

  it('should return false for showCjkPreferences when entry is null', () => {
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-1',
    );

    expect(service.showCjkPreferences()).toBe(false);
  });

  it('should return false for showPhoneticPreferences when entry is null', () => {
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-1',
    );

    expect(service.showPhoneticPreferences()).toBe(false);
  });

  it('should return false for showTracingSettings when entry is null', () => {
    (
      mockUserStore.languagePairs as import('@angular/core').WritableSignal<UserLanguagePairEntry[]>
    ).set([]);
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set(
      'pair-1',
    );

    expect(service.showTracingSettings()).toBe(false);
  });
});
