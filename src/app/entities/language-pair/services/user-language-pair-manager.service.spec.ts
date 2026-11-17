import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { signal, computed } from '@angular/core';

import { UserLanguagePairManagerService } from './user-language-pair-manager.service';
import { UserStore } from '../../user/model/user.store';
import { UserPersistence } from '../../user/model/user.persistence';
import { LanguageService } from './language.service';
import { AvailablePairsService } from './available-pairs.service';
import { UserApiService } from '../../user/api/user-api.service';
import type { LanguageDto } from '../api/language-dto.types';
import type { LanguagePairDto } from '../api/language-pairs-api.types';

/** Backend languages used by the mocks. */
const LANGUAGES: LanguageDto[] = [
  { id: 1, code: 'en', displayName: 'English', nativeName: 'English', activeFlag: true },
  { id: 2, code: 'ru', displayName: 'Русский', nativeName: 'Русский', activeFlag: true },
  { id: 3, code: 'ja', displayName: 'Japanese', nativeName: '日本語', activeFlag: true },
  { id: 4, code: 'zh', displayName: 'Chinese', nativeName: '中文', activeFlag: true },
] as unknown as LanguageDto[];

/**
 * Backend language pairs: both directions of two mirror pairs.
 * `en↔ru` (ids 1, 2) and `ja↔zh` (ids 3, 4).
 */
const PAIRS: LanguagePairDto[] = [
  { id: 1, knownCode: 'en', learningCode: 'ru' },
  { id: 2, knownCode: 'ru', learningCode: 'en' },
  { id: 3, knownCode: 'ja', learningCode: 'zh' },
  { id: 4, knownCode: 'zh', learningCode: 'ja' },
];

describe('UserLanguagePairManagerService', () => {
  let service: UserLanguagePairManagerService;
  let userStore: UserStore;
  let pairsSignal: ReturnType<typeof signal<LanguagePairDto[]>>;
  let patchPrefsSpy: ReturnType<typeof vi.fn>;
  let loadSpy: ReturnType<typeof vi.fn>;

  const pairCard = (pairId: string) => {
    const groups = service.groupedPairs();
    for (const group of groups) {
      const card = group.directions.find((d) => d.id === pairId);
      if (card) {
        return { group, card };
      }
    }
    throw new Error(`Pair card ${pairId} not found`);
  };

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();

    pairsSignal = signal<LanguagePairDto[]>([...PAIRS]);
    patchPrefsSpy = vi.fn(async () => undefined);
    loadSpy = vi.fn(async () => undefined);

    const languageServiceMock = {
      languages: signal<LanguageDto[]>(LANGUAGES),
      loading: signal(false),
      loaded: signal(true),
      getCodes: () => LANGUAGES.map((l) => l.code),
      getLabels: () => Object.fromEntries(LANGUAGES.map((l) => [l.code, l.displayName])),
      findByCode: (code: string) => LANGUAGES.find((l) => l.code === code),
      isValid: (code: string) => LANGUAGES.some((l) => l.code === code),
      load: vi.fn(async () => undefined),
    } as unknown as LanguageService;

    const availablePairsMock = {
      pairs: pairsSignal.asReadonly(),
      loading: signal(false),
      loaded: signal(true),
      visiblePairs: computed(() => pairsSignal()),
      load: loadSpy,
      invalidate: vi.fn(),
    } as unknown as AvailablePairsService;

    await TestBed.configureTestingModule({
      providers: [
        UserStore,
        UserPersistence,
        UserLanguagePairManagerService,
        { provide: LanguageService, useValue: languageServiceMock },
        { provide: AvailablePairsService, useValue: availablePairsMock },
        {
          provide: UserApiService,
          useValue: {
            patchUserPreferences: patchPrefsSpy,
            updateMe: vi.fn(async () => undefined),
          },
        },
      ],
    }).compileComponents();

    service = TestBed.inject(UserLanguagePairManagerService);
    userStore = TestBed.inject(UserStore);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should derive configured pairs from AvailablePairsService', () => {
    expect(service.configuredPairs()).toHaveLength(4);
  });

  describe('grouped pairs', () => {
    it('should derive card isActive from per-group markers, not the global pair', () => {
      // Default profile: ru→en is the globally active pair and its group marker.
      expect(userStore.languagePair()).toEqual({ known: 'ru', learning: 'en' });

      // ja→zh highlighted inside its own group while ru→en stays globally active.
      userStore.setActivePairInGroup('ja|zh', { known: 'ja', learning: 'zh' });

      expect(pairCard('2').card.isActive).toBe(true); // ru→en
      expect(pairCard('1').card.isActive).toBe(false); // en→ru
      expect(pairCard('3').card.isActive).toBe(true); // ja→zh
      expect(pairCard('4').card.isActive).toBe(false); // zh→ja
    });

    it('should expose labels and active-pair state', () => {
      expect(service.hasActivePair()).toBe(true);
      expect(service.activePairLabel()).toBe('Русский → English');
      expect(service.getLanguageLabel('en')).toBe('English');
    });
  });

  describe('setActivePair', () => {
    it('should scope activation to its own mirror group only', async () => {
      userStore.setActivePairInGroup('ja|zh', { known: 'ja', learning: 'zh' });

      const result = await service.setActivePair({ pairId: '1', known: 'en', learning: 'ru' });

      expect(result).toEqual({ ok: true });
      // EN↔RU: highlight moved to en→ru.
      expect(userStore.activeByMirrorGroup()['en|ru']).toEqual({ known: 'en', learning: 'ru' });
      expect(pairCard('1').card.isActive).toBe(true);
      expect(pairCard('2').card.isActive).toBe(false);

      // JA↔ZH: untouched by the activation in the other group.
      expect(userStore.activeByMirrorGroup()['ja|zh']).toEqual({ known: 'ja', learning: 'zh' });
      expect(pairCard('3').card.isActive).toBe(true);
      expect(pairCard('4').card.isActive).toBe(false);
    });

    it('should sync the global active pair on activation', async () => {
      await service.setActivePair({ pairId: '3', known: 'ja', learning: 'zh' });

      expect(userStore.languagePair()).toEqual({ known: 'ja', learning: 'zh' });
    });

    it('should create a UserStore entry without activation side effects', async () => {
      const activeIdBefore = userStore.activeLanguagePairId();
      const markersBefore = { ...userStore.activeByMirrorGroup() };

      await service.setActivePair({ pairId: '3', known: 'ja', learning: 'zh' });

      const entry = userStore
        .languagePairs()
        .find((e) => e.pair.known === 'ja' && e.pair.learning === 'zh');
      expect(entry).toBeDefined();
      expect(userStore.activeLanguagePairId()).not.toBe(activeIdBefore);
      // Only the target group marker changed.
      expect(userStore.activeByMirrorGroup()['ja|zh']).toEqual({ known: 'ja', learning: 'zh' });
      expect(userStore.activeByMirrorGroup()['en|ru']).toEqual(markersBefore['en|ru']);
    });

    it('should ignore activation events with a mismatched pair identity', async () => {
      const markersBefore = { ...userStore.activeByMirrorGroup() };
      const activeIdBefore = userStore.activeLanguagePairId();

      const result = await service.setActivePair({ pairId: '1', known: 'ja', learning: 'zh' });

      expect(result).toEqual({ ok: false, reason: 'Пара не найдена' });
      expect(userStore.activeByMirrorGroup()).toEqual(markersBefore);
      expect(userStore.activeLanguagePairId()).toBe(activeIdBefore);
    });

    it('should remove mirror sibling when activating the opposite direction', async () => {
      // Initial state: UserStore has default pair (ru→en).
      expect(userStore.languagePairs()).toHaveLength(1);

      // Activate EN→RU, which should remove RU→EN from the same mirror group.
      await service.setActivePair({ pairId: '1', known: 'en', learning: 'ru' });

      // UserStore should only contain the activated direction, not the mirror sibling.
      const pairsAfter = userStore.languagePairs();
      expect(pairsAfter).toHaveLength(1);
      expect(pairsAfter[0].pair).toEqual({ known: 'en', learning: 'ru' });
      // User preferences should be updated.
      expect(patchPrefsSpy).toHaveBeenCalledOnce();
    });

    it('should persist active pair to backend on activation', async () => {
      await service.setActivePair({ pairId: '3', known: 'ja', learning: 'zh' });

      expect(patchPrefsSpy).toHaveBeenCalledOnce();
      const callArgs = patchPrefsSpy.mock.calls[0][0];
      expect(callArgs.activeLanguagePairId).toBeDefined();
      expect(callArgs.learningPairs).toContainEqual({ known: 'ja', learning: 'zh' });
    });
  });

  describe('removePair', () => {
    it('should remove only the targeted pair and keep other groups intact', async () => {
      userStore.setActivePairInGroup('ja|zh', { known: 'ja', learning: 'zh' });
      const markersBefore = { ...userStore.activeByMirrorGroup() };

      const result = await service.removePair({ pairId: '1', known: 'en', learning: 'ru' });

      expect(result).toEqual({ ok: true });
      // Should update user preferences, not call language pairs API
      expect(patchPrefsSpy).toHaveBeenCalledOnce();
      // The pairs list is reloaded after mutation.
      expect(loadSpy).toHaveBeenCalledWith(true);
      // Other groups' markers are untouched.
      expect(userStore.activeByMirrorGroup()['ja|zh']).toEqual(markersBefore['ja|zh']);
    });

    it('should move the group highlight to the mirror sibling when the active direction is removed', async () => {
      userStore.setActivePairInGroup('en|ru', { known: 'en', learning: 'ru' });

      // Remove en→ru; its mirror sibling ru→en (id 2) is still configured.
      await service.removePair({ pairId: '1', known: 'en', learning: 'ru' });

      expect(userStore.activeByMirrorGroup()['en|ru']).toEqual({ known: 'ru', learning: 'en' });
    });

    it('should reject removal events with a mismatched pair identity', async () => {
      const result = await service.removePair({ pairId: '1', known: 'ja', learning: 'zh' });

      expect(result).toEqual({ ok: false, reason: 'Пара не найдена' });
      expect(patchPrefsSpy).not.toHaveBeenCalled();
    });
  });

  describe('pair search', () => {
    it('should show all groups when the pair search is empty', () => {
      service.pairSearch.set('');
      expect(service.filteredGroupedPairs()).toHaveLength(2);
    });

    it('should filter pair catalog by language code', () => {
      service.pairSearch.set('ja');
      const groups = service.filteredGroupedPairs();
      expect(groups).toHaveLength(1);
      expect(groups[0].key).toBe('ja|zh');
    });

    it('should filter pair catalog by display label, case-insensitively', () => {
      service.pairSearch.set('CHINESE');
      const groups = service.filteredGroupedPairs();
      expect(groups).toHaveLength(1);
      expect(groups[0].key).toBe('ja|zh');
    });

    it('should return no groups for a non-matching search', () => {
      service.pairSearch.set('klingon');
      expect(service.filteredGroupedPairs()).toHaveLength(0);
    });
  });
});
