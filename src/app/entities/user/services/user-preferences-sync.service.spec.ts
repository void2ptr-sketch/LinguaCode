import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { UserPreferencesSyncService } from './user-preferences-sync.service';
import { UserPreferencesApiService } from '../api/user-preferences-api.service';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';
import type { UserPreferences } from '../../../shared/api/generated/models';

describe('UserPreferencesSyncService', () => {
  let service: UserPreferencesSyncService;
  let loadSpy: ReturnType<typeof vi.fn>;
  let saveSpy: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    loadSpy = vi.fn();
    saveSpy = vi.fn();
    errorSpy = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        UserPreferencesSyncService,
        {
          provide: UserPreferencesApiService,
          useValue: {
            load: loadSpy,
            save: saveSpy,
          },
        },
        {
          provide: AppLoggerService,
          useValue: { error: errorSpy },
        },
      ],
    });

    service = TestBed.inject(UserPreferencesSyncService);
  });

  it('should create', () => {
    expect(service).toBeDefined();
  });

  it('should have null selectedCourseId when no preferences loaded', () => {
    expect(service.selectedCourseId()).toBeNull();
  });

  it('should return selectedCourseId as string when loaded', async () => {
    loadSpy.mockResolvedValue({ selectedCourseId: 42 } as UserPreferences);
    await service.loadPreferences();
    expect(service.selectedCourseId()).toBe('42');
  });

  it('should return null when selectedCourseId is null', async () => {
    loadSpy.mockResolvedValue({} as UserPreferences);
    await service.loadPreferences();
    expect(service.selectedCourseId()).toBeNull();
  });

  it('should convert numeric selectedCourseId to string', async () => {
    loadSpy.mockResolvedValue({ selectedCourseId: 123 } as UserPreferences);
    await service.loadPreferences();
    expect(service.selectedCourseId()).toBe('123');
  });

  it('should save selected course when valid', async () => {
    await service.saveSelectedCourse('42');
    expect(saveSpy).toHaveBeenCalledWith({ selectedCourseId: 42 });
  });

  it('should not save when courseId is not a number', async () => {
    await service.saveSelectedCourse('abc');
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should save when courseId is "0"', async () => {
    await service.saveSelectedCourse('0');
    expect(saveSpy).toHaveBeenCalledWith({ selectedCourseId: 0 });
  });

  it('should log error when load fails', async () => {
    loadSpy.mockRejectedValue(new Error('API error'));
    await service.loadPreferences();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should log error when save fails', async () => {
    saveSpy.mockRejectedValue(new Error('API error'));
    await service.saveSelectedCourse('42');
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should merge with existing preferences when saving', async () => {
    loadSpy.mockResolvedValue({ selectedCourseId: 10 } as UserPreferences);
    await service.loadPreferences();
    await service.saveSelectedCourse('42');
    expect(saveSpy).toHaveBeenCalledWith({ selectedCourseId: 42 });
  });
});
