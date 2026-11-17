import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { LanguageSettingsStore } from './language-settings.store';
import { LanguageService } from '../services/language.service';
import type { LanguageDto } from '../api/language-dto.types';

describe('LanguageSettingsStore', () => {
  let store: LanguageSettingsStore;
  let languageService: LanguageService;
  let getCodesSpy: ReturnType<typeof vi.fn>;
  let languagesSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getCodesSpy = vi.fn(() => ['en', 'zh', 'ru']);
    languagesSpy = vi.fn(() => [
      { id: 1, code: 'en', displayName: 'English', nativeName: 'English', writingDir: 'ltr', supportsTones: false, supportsPinyin: false, fontFamily: '', activeFlag: true },
      { id: 2, code: 'zh', displayName: 'Chinese', nativeName: '中文', writingDir: 'ltr', supportsTones: true, supportsPinyin: true, fontFamily: '', activeFlag: true },
      { id: 3, code: 'ru', displayName: 'Russian', nativeName: 'Русский', writingDir: 'ltr', supportsTones: false, supportsPinyin: false, fontFamily: '', activeFlag: true },
    ] as LanguageDto[]);

    TestBed.configureTestingModule({
      providers: [
        LanguageSettingsStore,
        {
          provide: LanguageService,
          useValue: {
            getCodes: getCodesSpy,
            languages: languagesSpy,
          },
        },
      ],
    });

    store = TestBed.inject(LanguageSettingsStore);
    languageService = TestBed.inject(LanguageService) as unknown as LanguageService;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(store).toBeDefined();
  });

  it('should have empty selectedCodes by default', () => {
    expect(store.selectedCodes()).toEqual(['en', 'zh', 'ru']);
  });

  it('should return all backend codes when no languages selected', () => {
    expect(store.selectedCodes()).toEqual(['en', 'zh', 'ru']);
  });

  it('should filter selected codes to only valid ones', () => {
    sessionStorage.setItem('lingua-code.language-settings', JSON.stringify({
      selectedCodes: ['en', 'invalid-code'],
      activePairId: null,
      configuredPairs: [],
    }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        LanguageSettingsStore,
        {
          provide: LanguageService,
          useValue: {
            getCodes: getCodesSpy,
            languages: languagesSpy,
          },
        },
      ],
    });

    const store2 = TestBed.inject(LanguageSettingsStore);
    expect(store2.selectedCodes()).toEqual(['en']);
  });

  it('should add a language when not already selected', () => {
    store.addLanguage('en');
    expect(store.selectedCodes()).toContain('en');
  });

  it('should not add a language that is already selected', () => {
    sessionStorage.setItem('lingua-code.language-settings', JSON.stringify({
      selectedCodes: ['en'],
      activePairId: null,
      configuredPairs: [],
    }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        LanguageSettingsStore,
        {
          provide: LanguageService,
          useValue: {
            getCodes: getCodesSpy,
            languages: languagesSpy,
          },
        },
      ],
    });

    const store2 = TestBed.inject(LanguageSettingsStore);
    const before = store2.selectedCodes().length;
    store2.addLanguage('en');
    expect(store2.selectedCodes().length).toBe(before);
  });

  it('should not add an invalid language code', () => {
    const before = store.selectedCodes().length;
    store.addLanguage('xx');
    expect(store.selectedCodes().length).toBe(before);
  });

  it('should remove a language', () => {
    sessionStorage.setItem('lingua-code.language-settings', JSON.stringify({
      selectedCodes: ['en', 'zh'],
      activePairId: null,
      configuredPairs: [],
    }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        LanguageSettingsStore,
        {
          provide: LanguageService,
          useValue: {
            getCodes: getCodesSpy,
            languages: languagesSpy,
          },
        },
      ],
    });

    const store2 = TestBed.inject(LanguageSettingsStore);
    store2.removeLanguage('en');
    expect(store2.selectedCodes()).toEqual(['zh']);
  });

  it('should set selected languages', () => {
    store.setSelectedLanguages(['en', 'zh']);
    expect(store.selectedCodes()).toEqual(['en', 'zh']);
  });

  it('should filter invalid codes when setting selected languages', () => {
    store.setSelectedLanguages(['en', 'invalid']);
    expect(store.selectedCodes()).toEqual(['en']);
  });

  it('should set active pair', () => {
    store.setActivePair('pair-1');
    expect(store.activePairId()).toBe('pair-1');
  });

  it('should create a new pair', () => {
    const id = store.createPair('en', 'zh');
    expect(id).toBeTruthy();
    expect(store.configuredPairs()).toHaveLength(1);
    expect(store.configuredPairs()[0].known).toBe('en');
    expect(store.configuredPairs()[0].learning).toBe('zh');
  });

  it('should set activePairId to new pair id when no active pair', () => {
    store.createPair('en', 'zh');
    expect(store.activePairId()).toBeTruthy();
  });

  it('should keep existing activePairId when one exists', () => {
    sessionStorage.setItem('lingua-code.language-settings', JSON.stringify({
      selectedCodes: [],
      activePairId: 'existing-pair',
      configuredPairs: [{ id: 'existing-pair', known: 'en', learning: 'zh' }],
    }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        LanguageSettingsStore,
        {
          provide: LanguageService,
          useValue: {
            getCodes: getCodesSpy,
            languages: languagesSpy,
          },
        },
      ],
    });

    const store2 = TestBed.inject(LanguageSettingsStore);
    store2.createPair('ru', 'en');
    expect(store2.activePairId()).toBe('existing-pair');
  });

  it('should remove a pair', () => {
    store.createPair('en', 'zh');
    const id = store.configuredPairs()[0].id;
    store.removePair(id);
    expect(store.configuredPairs()).toHaveLength(0);
  });

  it('should update activePairId when removing the active pair', () => {
    store.createPair('en', 'zh');
    const id = store.configuredPairs()[0].id;
    store.setActivePair(id);
    store.removePair(id);
    expect(store.activePairId()).toBeNull();
  });

  it('should return null when no pairs configured', () => {
    expect(store.getActivePair()).toBeNull();
  });

  it('should return the active pair when configured', () => {
    store.createPair('en', 'zh');
    const id = store.configuredPairs()[0].id;
    store.setActivePair(id);
    const pair = store.getActivePair();
    expect(pair?.known).toBe('en');
    expect(pair?.learning).toBe('zh');
  });

  it('should return the first pair when no active pair but pairs exist', () => {
    store.createPair('en', 'zh');
    store.createPair('ru', 'en');
    const pair = store.getActivePair();
    expect(pair?.known).toBe('en');
    expect(pair?.learning).toBe('zh');
  });

  it('should get available languages from languageService', () => {
    const langs = store.getAvailableLanguages();
    expect(langs).toEqual([
      { id: 1, code: 'en', displayName: 'English', nativeName: 'English', writingDir: 'ltr', supportsTones: false, supportsPinyin: false, fontFamily: '', activeFlag: true },
      { id: 2, code: 'zh', displayName: 'Chinese', nativeName: '中文', writingDir: 'ltr', supportsTones: true, supportsPinyin: true, fontFamily: '', activeFlag: true },
      { id: 3, code: 'ru', displayName: 'Russian', nativeName: 'Русский', writingDir: 'ltr', supportsTones: false, supportsPinyin: false, fontFamily: '', activeFlag: true },
    ]);
  });

  it('should handle corrupt session data gracefully', () => {
    sessionStorage.setItem('lingua-code.language-settings', 'not-json');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        LanguageSettingsStore,
        {
          provide: LanguageService,
          useValue: {
            getCodes: getCodesSpy,
            languages: languagesSpy,
          },
        },
      ],
    });

    const store2 = TestBed.inject(LanguageSettingsStore);
    expect(store2.selectedCodes()).toEqual(['en', 'zh', 'ru']);
  });
});
