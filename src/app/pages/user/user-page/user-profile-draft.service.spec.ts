import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserProfileDraftService } from './user-profile-draft.service';
import { UserStore } from '../../../entities/user/model/user.store';
import { UserPersistence } from '../../../entities/user/model/user.persistence';
import { UserApiService } from '../../../entities/user/api/user-api.service';
import { UserPreferencesApiService } from '../../../entities/user/api/user-preferences-api.service';
import { LEARNING_PROFICIENCY_LEVELS } from '../../../entities/learning/model';

describe('UserProfileDraftService', () => {
  let service: UserProfileDraftService;
  let userStore: UserStore;
  let snackBarSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    snackBarSpy = vi.fn();

    await TestBed.configureTestingModule({
      providers: [
        UserStore,
        UserPersistence,
        UserProfileDraftService,
        {
          provide: UserApiService,
          useValue: {
            updateMe: vi.fn(async () => undefined),
            patchUserPreferences: vi.fn(async () => undefined),
          },
        },
        {
          provide: UserPreferencesApiService,
          useValue: {
            save: vi.fn(async () => undefined),
          },
        },
        { provide: MatSnackBar, useValue: { open: snackBarSpy } },
      ],
    }).compileComponents();

    service = TestBed.inject(UserProfileDraftService);
    userStore = TestBed.inject(UserStore);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should initialize drafts from the store', () => {
    expect(service.nameDraft()).toBe(userStore.displayName());
    expect(service.learningProficiencyDraft()).toBe(
      userStore.preferences().learningProficiencyLevel,
    );
    expect(service.themeDraft()).toBe(userStore.preferences().theme);
    expect(service.fontSizeDraft()).toBe(userStore.preferences().fontSize);
    expect(service.colorSchemeDraft()).toBe(userStore.preferences().colorScheme);
    expect(service.cardFocusFullscreenDraft()).toBe(userStore.preferences().cardFocusFullscreen);
  });

  it('should expose the learning proficiency options', () => {
    expect(service.learningProficiencyOptions).toBe(LEARNING_PROFICIENCY_LEVELS);
  });

  describe('saveProfile', () => {
    it('should call userStore.updateDisplayName', async () => {
      const updateDisplayNameSpy = vi.spyOn(userStore, 'updateDisplayName');
      service.nameDraft.set('New Name');
      await service.saveProfile();
      expect(updateDisplayNameSpy).toHaveBeenCalledWith('New Name');
    });

    it('should call userStore.updatePreferences with all draft values', async () => {
      const updatePreferencesSpy = vi.spyOn(userStore, 'updatePreferences');
      service.themeDraft.set('dark');
      service.fontSizeDraft.set('lg');
      service.colorSchemeDraft.set('dark');
      service.cardFocusFullscreenDraft.set(true);
      service.learningProficiencyDraft.set('intermediate');
      await service.saveProfile();

      expect(updatePreferencesSpy).toHaveBeenCalledWith({
        theme: 'dark',
        fontSize: 'lg',
        colorScheme: 'dark',
        cardFocusFullscreen: true,
        learningProficiencyLevel: 'intermediate',
      });
    });

    it('should call userApi.updateMe with displayName only', async () => {
      const userApi = TestBed.inject(UserApiService) as UserApiService;
      const updateMeSpy = vi.spyOn(userApi, 'updateMe');
      await service.saveProfile();

      expect(updateMeSpy).toHaveBeenCalled();
      const callArgs = updateMeSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(callArgs['displayName']).toBeDefined();
      // preferences are NOT sent to updateMe — they go to userPreferencesApi.save()
      expect(callArgs['preferences']).toBeUndefined();
    });

    it('should call userPreferencesApi.save with learningPairs', async () => {
      const userPrefsApi = TestBed.inject(UserPreferencesApiService) as UserPreferencesApiService;
      const saveSpy = vi.spyOn(userPrefsApi, 'save');
      await service.saveProfile();

      expect(saveSpy).toHaveBeenCalled();
      const prefsArg = saveSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(prefsArg['learningPairs']).toBeDefined();
      expect(prefsArg['theme']).toBeDefined();
      expect(prefsArg['colorScheme']).toBeDefined();
    });

    it('should show success toast on API success', async () => {
      await service.saveProfile();

      expect(snackBarSpy).toHaveBeenCalledWith('Профиль сохранён', 'Закрыть', { duration: 3000 });
    });

    it('should show error toast on API failure', async () => {
      const userApi = TestBed.inject(UserApiService) as UserApiService;
      const userPrefsApi = TestBed.inject(UserPreferencesApiService) as UserPreferencesApiService;
      vi.spyOn(userApi, 'updateMe').mockResolvedValue(undefined as never);
      vi.spyOn(userPrefsApi, 'save').mockRejectedValue(new Error('API error'));

      await service.saveProfile();

      // displayName save succeeds, preferences save fails → "Не удалось сохранить профиль"
      expect(snackBarSpy).toHaveBeenCalledWith('Не удалось сохранить профиль', 'Закрыть', {
        duration: 5000,
      });
    });
  });
});
