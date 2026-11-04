import { TestBed } from '@angular/core/testing';
import { signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LanguageSettingsComponent } from './language-settings.component';
import { LanguageService } from '../../entities/language-pair/lib/language.service';
import { AvailablePairsService } from '../../entities/language-pair/lib/available-pairs.service';
import { LanguageSettingsStore } from '../../entities/language-pair/lib/language-settings.store';
import { RoleService } from '../../entities/auth/services/role.service';
import { UserStore } from '../../entities/user/model/user.store';
import { UserPersistence } from '../../entities/user/model/user.persistence';
import { LanguagePairsService } from '../../shared/api/generated/language-pairs';
import { LanguageApiService } from '../../entities/language-pair/api/language-api.service';
import type { LanguageDto } from '../../entities/language-pair/api/language-dto.types';
import type { LanguagePairDto } from '../../entities/language-pair/api/language-pairs-api.types';

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

describe('LanguageSettingsComponent — mirror pair event isolation', () => {
  let component: LanguageSettingsComponent;
  let userStore: UserStore;
  let pairsSignal: ReturnType<typeof signal<LanguagePairDto[]>>;
  let createSpy: ReturnType<typeof vi.fn>;
  let deleteSpy: ReturnType<typeof vi.fn>;
  let updateSpy: ReturnType<typeof vi.fn>;
  let snackBarSpy: ReturnType<typeof vi.fn>;

  const pairCard = (pairId: string) => {
    const groups = component.groupedPairs();
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
    createSpy = vi.fn(async () => ({}));
    deleteSpy = vi.fn(async () => undefined);
    updateSpy = vi.fn(async () => ({}));
    snackBarSpy = vi.fn();

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
      load: vi.fn(async () => undefined),
      invalidate: vi.fn(),
    } as unknown as AvailablePairsService;

    const roleServiceMock = {
      roles: signal<string[]>([]),
      isAdmin: signal(false),
      isUser: signal(true),
      canWriteLanguages: signal(false),
      canWritePairs: signal(true),
      hasRole: () => false,
    } as unknown as RoleService;

    await TestBed.configureTestingModule({
      imports: [LanguageSettingsComponent],
      providers: [
        UserStore,
        UserPersistence,
        LanguageSettingsStore,
        { provide: LanguageService, useValue: languageServiceMock },
        { provide: AvailablePairsService, useValue: availablePairsMock },
        { provide: RoleService, useValue: roleServiceMock },
        {
          provide: LanguagePairsService,
          useValue: { languagePairsCreate: createSpy, languagePairsDelete: deleteSpy, languagePairsUpdate: updateSpy },
        },
        { provide: LanguageApiService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: MatSnackBar, useValue: { open: snackBarSpy } },
      ],
    });

    const fixture = TestBed.createComponent(LanguageSettingsComponent);
    component = fixture.componentInstance;
    userStore = TestBed.inject(UserStore);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

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

  it('should scope activation to its own mirror group only', async () => {
    userStore.setActivePairInGroup('ja|zh', { known: 'ja', learning: 'zh' });

    await component.setActivePair({ pairId: '1', known: 'en', learning: 'ru' });

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
    await component.setActivePair({ pairId: '3', known: 'ja', learning: 'zh' });

    expect(userStore.languagePair()).toEqual({ known: 'ja', learning: 'zh' });
  });

  it('should create a UserStore entry without activation side effects', async () => {
    const activeIdBefore = userStore.activeLanguagePairId();
    const markersBefore = { ...userStore.activeByMirrorGroup() };

    await component.setActivePair({ pairId: '3', known: 'ja', learning: 'zh' });

    const entry = userStore
      .languagePairs()
      .find((e) => e.pair.known === 'ja' && e.pair.learning === 'zh');
    expect(entry).toBeDefined();
    expect(userStore.activeLanguagePairId()).not.toBe(activeIdBefore);
    // Only the target group marker changed.
    expect(userStore.activeByMirrorGroup()['ja|zh']).toEqual({ known: 'ja', learning: 'zh' });
    expect(userStore.activeByMirrorGroup()['en|ru']).toEqual(markersBefore['en|ru']);
  });

  it('should ignore activation events with a mismatched pair identity', () => {
    const markersBefore = { ...userStore.activeByMirrorGroup() };
    const activeIdBefore = userStore.activeLanguagePairId();

    component.setActivePair({ pairId: '1', known: 'ja', learning: 'zh' });

    expect(userStore.activeByMirrorGroup()).toEqual(markersBefore);
    expect(userStore.activeLanguagePairId()).toBe(activeIdBefore);
  });

  it('should not activate a newly created pair or touch any group marker', async () => {
    const activeIdBefore = userStore.activeLanguagePairId();
    const markersBefore = { ...userStore.activeByMirrorGroup() };

    component.newKnownCode.set('ja');
    component.newLearningCode.set('zh');
    await component.createPair();

    expect(createSpy).toHaveBeenCalledOnce();
    expect(userStore.activeLanguagePairId()).toBe(activeIdBefore);
    expect(userStore.activeByMirrorGroup()).toEqual(markersBefore);
  });

  it('should disable the add-pair button during creation', async () => {
    component.newKnownCode.set('ja');
    component.newLearningCode.set('zh');

    expect(component.creatingPair()).toBe(false);

    await component.createPair();

    expect(component.creatingPair()).toBe(false);
  });

  it('should show Russian toast messages on pair creation', async () => {
    component.newKnownCode.set('ja');
    component.newLearningCode.set('zh');
    await component.createPair();

    expect(snackBarSpy).toHaveBeenCalledWith('Пара добавлена', 'Закрыть', { duration: 3000 });
  });

  it('should show Russian toast messages on pair removal', async () => {
    await component.removePair({ pairId: '1', known: 'en', learning: 'ru' });

    expect(snackBarSpy).toHaveBeenCalledWith('Пара удалена', 'Закрыть', { duration: 3000 });
  });

  it('should send update request to backend on activation', async () => {
    await component.setActivePair({ pairId: '3', known: 'ja', learning: 'zh' });

    expect(updateSpy).toHaveBeenCalledExactlyOnceWith(3, {
      knownCode: 'ja',
      learningCode: 'zh',
    });
  });

  it('should remove only the targeted pair and keep other groups intact', async () => {
    userStore.setActivePairInGroup('ja|zh', { known: 'ja', learning: 'zh' });
    const markersBefore = { ...userStore.activeByMirrorGroup() };

    await component.removePair({ pairId: '1', known: 'en', learning: 'ru' });

    expect(deleteSpy).toHaveBeenCalledExactlyOnceWith(1);
    // Other groups' markers are untouched.
    expect(userStore.activeByMirrorGroup()['ja|zh']).toEqual(markersBefore['ja|zh']);
  });

  it('should move the group highlight to the mirror sibling when the active direction is removed', async () => {
    userStore.setActivePairInGroup('en|ru', { known: 'en', learning: 'ru' });

    // Remove en→ru; its mirror sibling ru→en (id 2) is still configured.
    await component.removePair({ pairId: '1', known: 'en', learning: 'ru' });

    expect(userStore.activeByMirrorGroup()['en|ru']).toEqual({ known: 'ru', learning: 'en' });
  });
});
