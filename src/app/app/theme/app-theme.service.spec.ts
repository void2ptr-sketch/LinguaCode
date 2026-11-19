import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { AppThemeService } from './app-theme.service';
import { UserStore } from '../../entities/user/model/user.store';
import type { UserPreferences } from '../../entities/user/model';

@Component({
  standalone: true,
  template: '',
})
class TestHostComponent {}

describe('AppThemeService', () => {
  let service: AppThemeService;
  let root: HTMLElement;

  let preferencesSignal: ReturnType<typeof signal<UserPreferences>>;

  const createMockPreferences = (overrides: Partial<UserPreferences> = {}): UserPreferences => ({
    theme: 'azure-blue',
    fontSize: 'md',
    colorScheme: 'light',
    cardFocusFullscreen: false,
    learningProficiencyLevel: 'intermediate',
    languagePairs: [],
    activeLanguagePairId: 'default',
    ...overrides,
  });

  beforeEach(() => {
    root = document.documentElement;
    preferencesSignal = signal(createMockPreferences());

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        AppThemeService,
        {
          provide: UserStore,
          useValue: {
            // Provide the plain signal directly — effects track plain signals
            // properly; a computed() wrapper breaks the notification chain
            // when the underlying signal changes outside Angular's zone.
            preferences: preferencesSignal,
          },
        },
      ],
    });

    service = TestBed.inject(AppThemeService);
  });

  afterEach(() => {
    root.classList.remove('theme-light', 'theme-dark');
    root.style.colorScheme = '';
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  it('should apply light color scheme on initialization', async () => {
    await vi.waitFor(
      () => {
        expect(root.classList.contains('theme-light')).toBe(true);
        expect(root.classList.contains('theme-dark')).toBe(false);
        expect(root.style.colorScheme).toBe('light');
      },
      { timeout: 1000 },
    );
  });

  it('should apply dark color scheme when preferences change', async () => {
    preferencesSignal.set(createMockPreferences({ colorScheme: 'dark' }));

    await vi.waitFor(
      () => {
        expect(root.classList.contains('theme-dark')).toBe(true);
        expect(root.classList.contains('theme-light')).toBe(false);
        expect(root.style.colorScheme).toBe('dark');
      },
      { timeout: 1000 },
    );
  });

  it('should remove both theme classes before adding the new one', async () => {
    preferencesSignal.set(createMockPreferences({ colorScheme: 'dark' }));

    await vi.waitFor(
      () => {
        expect(root.classList.contains('theme-dark')).toBe(true);
      },
      { timeout: 1000 },
    );

    preferencesSignal.set(createMockPreferences({ colorScheme: 'light' }));

    await vi.waitFor(
      () => {
        expect(root.classList.contains('theme-light')).toBe(true);
        expect(root.classList.contains('theme-dark')).toBe(false);
      },
      { timeout: 1000 },
    );
  });
});
