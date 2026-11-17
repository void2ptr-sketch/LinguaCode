import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { UserPageComponent } from './user-page.component';
import { UserProfileDraftService } from './user-profile-draft.service';
import { UserStore } from '../../../entities/user/model/user.store';
import { UserPersistence } from '../../../entities/user/model/user.persistence';
import { LanguageService } from '../../../entities/language-pair/services/language.service';
import { AvailablePairsService } from '../../../entities/language-pair/services/available-pairs.service';
import { UserLanguagePairManagerService } from '../../../entities/language-pair/services/user-language-pair-manager.service';
import { LanguageSettingsStore } from '../../../entities/language-pair/store/language-settings.store';
import { RoleService } from '../../../entities/auth/services/role.service';
import { UserApiService } from '../../../entities/user/api/user-api.service';
import { UserPreferencesApiService } from '../../../entities/user/api/user-preferences-api.service';
import { CourseCatalogLanguagePairManagerService } from '../../../features/course-catalog/services/course-catalog-language-pair-manager.service';
import type { LanguageDto } from '../../../entities/language-pair/api/language-dto.types';
import type { LanguagePairDto } from '../../../entities/language-pair/api/language-pairs-api.types';

/** Backend languages used by the mocks. */
const LANGUAGES: LanguageDto[] = [
  { id: 1, code: 'en', displayName: 'English', nativeName: 'English', activeFlag: true },
  { id: 2, code: 'ru', displayName: 'Русский', nativeName: 'Русский', activeFlag: true },
] as unknown as LanguageDto[];

/** Backend language pairs (single mirror pair en↔ru). */
const PAIRS: LanguagePairDto[] = [
  { id: 1, knownCode: 'en', learningCode: 'ru' },
  { id: 2, knownCode: 'ru', learningCode: 'en' },
];

/**
 * The page component is now a thin tab shell: drafts live in
 * `UserProfileDraftService`, pair state in `UserLanguagePairManagerService`.
 * These tests verify the shell wiring only — behavioral pair tests live in
 * `user-language-pair-manager.service.spec.ts`, draft/save tests in
 * `user-profile-draft.service.spec.ts`.
 */
describe('UserPageComponent', () => {
  let component: UserPageComponent;
  let fixture: ComponentFixture<UserPageComponent>;
  let userStore: UserStore;
  let drafts: UserProfileDraftService;
  let syncDraftsSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();

    syncDraftsSpy = vi.fn();

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
      pairs: signal<LanguagePairDto[]>([...PAIRS]).asReadonly(),
      loading: signal(false),
      loaded: signal(true),
      visiblePairs: computed(() => PAIRS),
      load: vi.fn(async () => undefined),
      invalidate: vi.fn(),
    } as unknown as AvailablePairsService;

    const roleServiceMock = {
      roles: signal<string[]>([]),
      isAdmin: signal(false),
      isUser: signal(true),
      canManageSystem: signal(false),
      canWriteLanguages: signal(false),
      canWritePairs: signal(true),
      hasRole: () => false,
    } as unknown as RoleService;

    await TestBed.configureTestingModule({
      imports: [UserPageComponent],
      providers: [
        UserStore,
        UserPersistence,
        LanguageSettingsStore,
        UserLanguagePairManagerService,
        { provide: LanguageService, useValue: languageServiceMock },
        { provide: AvailablePairsService, useValue: availablePairsMock },
        { provide: RoleService, useValue: roleServiceMock },
        {
          provide: UserApiService,
          useValue: {
            patchUserPreferences: vi.fn(async () => undefined),
            updateMe: vi.fn(async () => undefined),
          },
        },
        {
          provide: UserPreferencesApiService,
          useValue: {
            save: vi.fn(async () => undefined),
          },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
        {
          provide: MatDialog,
          useValue: {
            open: vi.fn(() => ({
              afterClosed: () => of(true as boolean),
              afterOpened: of(),
              backdropClick: of(),
              close: vi.fn(),
            })),
          },
        },
        {
          provide: CourseCatalogLanguagePairManagerService,
          useValue: {
            syncPairSettingsDrafts: syncDraftsSpy,
            saveActivePairSettings: vi.fn().mockReturnValue('pair-1'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserPageComponent);
    component = fixture.componentInstance;
    userStore = TestBed.inject(UserStore);
    // UserProfileDraftService is provided on the page component itself.
    drafts = fixture.componentRef.injector.get(UserProfileDraftService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should expose displayName from userStore', () => {
    expect(component.displayName).toBe(userStore.displayName);
  });

  it('should have selectedTabIndex initialized to 0', () => {
    expect(component.selectedTabIndex).toBeDefined();
    expect(component.selectedTabIndex()).toBe(0);
  });

  it('should load languages and pairs when the page opens', () => {
    expect(syncDraftsSpy).toHaveBeenCalledOnce();
  });

  it('should share the page-scoped draft service with tab components', () => {
    expect(drafts).toBeDefined();
    expect(drafts.nameDraft()).toBeDefined();
    expect(drafts.themeDraft()).toBeDefined();
  });
});
