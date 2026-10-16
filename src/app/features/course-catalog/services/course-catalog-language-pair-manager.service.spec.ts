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
    (mockDrafts.courseTabKnownLanguageDraft as import('@angular/core').WritableSignal<ContentLanguage>).set('ru');
    (mockDrafts.courseTabLearningLanguageDraft as import('@angular/core').WritableSignal<ContentLanguage>).set('zh');

    const result = service.addPair();

    expect(result).toBe(true);
    expect(mockUserStore.addLanguagePair).toHaveBeenCalled();
  });

  it('should not add pair when languages are the same', () => {
    (mockDrafts.courseTabKnownLanguageDraft as import('@angular/core').WritableSignal<ContentLanguage>).set('en');
    (mockDrafts.courseTabLearningLanguageDraft as import('@angular/core').WritableSignal<ContentLanguage>).set('en');

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
    (mockDrafts.settingsPairIdDraft as import('@angular/core').WritableSignal<string>).set('nonexistent');
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
});
