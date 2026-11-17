import { TestBed } from '@angular/core/testing';
import { vi, describe, expect, it, beforeEach, afterEach } from 'vitest';

import { AvailablePairsService } from './available-pairs.service';
import { LanguageService } from './language.service';
import { LanguageSettingsStore } from '../store/language-settings.store';
import { LanguagePairsApiService } from '../api/language-pairs-api.service';
import type { LanguageDto } from '../api/language-dto.types';
import type { LanguagePairDto } from '../api/language-pairs-api.types';

describe('AvailablePairsService', () => {
  let service: AvailablePairsService;
  let languageService: { languages: ReturnType<typeof vi.fn> };
  let settingsStore: { selectedCodes: ReturnType<typeof vi.fn> };
  let pairsApi: { listAll: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    languageService = {
      languages: vi.fn(() => []),
    };
    settingsStore = {
      selectedCodes: vi.fn(() => []),
    };
    pairsApi = {
      listAll: vi.fn(() => Promise.resolve([])),
    };

    TestBed.configureTestingModule({
      providers: [
        AvailablePairsService,
        { provide: LanguageService, useValue: languageService },
        { provide: LanguageSettingsStore, useValue: settingsStore },
        { provide: LanguagePairsApiService, useValue: pairsApi },
      ],
    });

    service = TestBed.inject(AvailablePairsService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // ── visiblePairs ──

  it('should return empty when no languages are selected', () => {
    languageService.languages.mockReturnValue([]);
    settingsStore.selectedCodes.mockReturnValue([]);
    service.pairs.set([]);

    expect(service.visiblePairs()).toEqual([]);
  });

  it('should filter pairs by active and selected languages', () => {
    const languages: LanguageDto[] = [
      {
        id: 1,
        code: 'en',
        displayName: 'English',
        nativeName: 'English',
        writingDir: 'ltr',
        supportsTones: false,
        supportsPinyin: false,
        fontFamily: '',
        activeFlag: true,
      },
      {
        id: 2,
        code: 'ru',
        displayName: 'Russian',
        nativeName: 'Русский',
        writingDir: 'ltr',
        supportsTones: false,
        supportsPinyin: false,
        fontFamily: '',
        activeFlag: true,
      },
      {
        id: 3,
        code: 'zh',
        displayName: 'Chinese',
        nativeName: '中文',
        writingDir: 'ltr',
        supportsTones: true,
        supportsPinyin: true,
        fontFamily: '',
        activeFlag: true,
      },
      {
        id: 4,
        code: 'de',
        displayName: 'German',
        nativeName: 'Deutsch',
        writingDir: 'ltr',
        supportsTones: false,
        supportsPinyin: false,
        fontFamily: '',
        activeFlag: false,
      },
    ];
    languageService.languages.mockReturnValue(languages);
    settingsStore.selectedCodes.mockReturnValue(['en', 'ru', 'zh']);
    service.pairs.set([
      { id: 1, knownCode: 'en', learningCode: 'ru' },
      { id: 2, knownCode: 'ru', learningCode: 'en' },
      { id: 3, knownCode: 'en', learningCode: 'zh' },
      { id: 4, knownCode: 'de', learningCode: 'en' }, // de is inactive
    ]);

    const result = service.visiblePairs();
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it('should exclude pairs with inactive known language', () => {
    const languages: LanguageDto[] = [
      {
        id: 1,
        code: 'en',
        displayName: 'English',
        nativeName: 'English',
        writingDir: 'ltr',
        supportsTones: false,
        supportsPinyin: false,
        fontFamily: '',
        activeFlag: true,
      },
      {
        id: 2,
        code: 'de',
        displayName: 'German',
        nativeName: 'Deutsch',
        writingDir: 'ltr',
        supportsTones: false,
        supportsPinyin: false,
        fontFamily: '',
        activeFlag: false,
      },
    ];
    languageService.languages.mockReturnValue(languages);
    settingsStore.selectedCodes.mockReturnValue(['en', 'de']);
    service.pairs.set([{ id: 1, knownCode: 'en', learningCode: 'de' }]);

    expect(service.visiblePairs()).toEqual([]);
  });

  it('should exclude pairs with inactive learning language', () => {
    const languages: LanguageDto[] = [
      {
        id: 1,
        code: 'en',
        displayName: 'English',
        nativeName: 'English',
        writingDir: 'ltr',
        supportsTones: false,
        supportsPinyin: false,
        fontFamily: '',
        activeFlag: true,
      },
      {
        id: 2,
        code: 'de',
        displayName: 'German',
        nativeName: 'Deutsch',
        writingDir: 'ltr',
        supportsTones: false,
        supportsPinyin: false,
        fontFamily: '',
        activeFlag: false,
      },
    ];
    languageService.languages.mockReturnValue(languages);
    settingsStore.selectedCodes.mockReturnValue(['en', 'de']);
    service.pairs.set([{ id: 1, knownCode: 'de', learningCode: 'en' }]);

    expect(service.visiblePairs()).toEqual([]);
  });

  it('should exclude pairs with language not in selected codes', () => {
    const languages: LanguageDto[] = [
      {
        id: 1,
        code: 'en',
        displayName: 'English',
        nativeName: 'English',
        writingDir: 'ltr',
        supportsTones: false,
        supportsPinyin: false,
        fontFamily: '',
        activeFlag: true,
      },
      {
        id: 2,
        code: 'fr',
        displayName: 'French',
        nativeName: 'Français',
        writingDir: 'ltr',
        supportsTones: false,
        supportsPinyin: false,
        fontFamily: '',
        activeFlag: true,
      },
    ];
    languageService.languages.mockReturnValue(languages);
    settingsStore.selectedCodes.mockReturnValue(['en']); // only en selected
    service.pairs.set([{ id: 1, knownCode: 'en', learningCode: 'fr' }]);

    expect(service.visiblePairs()).toEqual([]);
  });

  // ── load ──

  it('should load pairs from api', async () => {
    const mockPairs: LanguagePairDto[] = [
      { id: 1, knownCode: 'en', learningCode: 'ru' },
      { id: 2, knownCode: 'ru', learningCode: 'en' },
    ];
    pairsApi.listAll.mockResolvedValue(mockPairs);

    await service.load();

    expect(service.pairs()).toEqual(mockPairs);
    expect(service.loaded()).toBe(true);
    expect(service.loading()).toBe(false);
  });

  it('should set empty pairs on api error', async () => {
    pairsApi.listAll.mockRejectedValue(new Error('Network error'));

    await service.load();

    expect(service.pairs()).toEqual([]);
    expect(service.loaded()).toBe(false);
    expect(service.loading()).toBe(false);
  });

  it('should return cached data within TTL', async () => {
    const mockPairs: LanguagePairDto[] = [{ id: 1, knownCode: 'en', learningCode: 'ru' }];
    pairsApi.listAll.mockResolvedValue(mockPairs);

    // First load
    await service.load();
    expect(service.pairs()).toEqual(mockPairs);

    // Second load within cache TTL (default 5 min) — should not call API
    pairsApi.listAll.mockClear();
    await service.load();

    expect(pairsApi.listAll).not.toHaveBeenCalled();
    expect(service.pairs()).toEqual(mockPairs);
  });

  it('should bypass cache when force is true', async () => {
    const mockPairs: LanguagePairDto[] = [{ id: 1, knownCode: 'en', learningCode: 'ru' }];
    pairsApi.listAll.mockResolvedValue(mockPairs);

    // First load
    await service.load();

    // Force reload
    pairsApi.listAll.mockClear();
    await service.load(true);

    expect(pairsApi.listAll).toHaveBeenCalled();
  });

  it('should reload when cache is stale', async () => {
    const mockPairs: LanguagePairDto[] = [{ id: 1, knownCode: 'en', learningCode: 'ru' }];
    pairsApi.listAll.mockResolvedValue(mockPairs);

    // First load
    await service.load();

    // Manually set lastLoadTime to old value to simulate stale cache
    // CACHE_TTL_MS = 5 * 60 * 1000 = 300000ms
    (service as unknown as { lastLoadTime: number }).lastLoadTime = Date.now() - 300001;

    // Second load — should reload because cache is stale
    pairsApi.listAll.mockClear();
    await service.load();

    expect(pairsApi.listAll).toHaveBeenCalled();
  });

  // ── invalidate ──

  it('should invalidate cache', async () => {
    const mockPairs: LanguagePairDto[] = [{ id: 1, knownCode: 'en', learningCode: 'ru' }];
    pairsApi.listAll.mockResolvedValue(mockPairs);

    await service.load();
    expect(service.loaded()).toBe(true);

    service.invalidate();

    expect(service.pairs()).toEqual([]);
    expect(service.loaded()).toBe(false);
  });

  it('should reload after invalidation', async () => {
    const mockPairs: LanguagePairDto[] = [{ id: 1, knownCode: 'en', learningCode: 'ru' }];
    pairsApi.listAll.mockResolvedValue(mockPairs);

    await service.load();
    service.invalidate();

    pairsApi.listAll.mockClear();
    await service.load();

    expect(pairsApi.listAll).toHaveBeenCalled();
    expect(service.pairs()).toEqual(mockPairs);
  });
});
