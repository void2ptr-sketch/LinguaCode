import { Component, signal, computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppThemeService } from './app-theme.service';
import { UserStore } from '../state';
import type { UserPreferences } from '../models';

@Component({
  standalone: true,
  template: '',
})
class TestHostComponent {}

describe('AppThemeService', () => {
  let service: AppThemeService;
  let root: HTMLElement;

  let preferencesSignal: ReturnType<typeof signal<UserPreferences>>;

  const createMockPreferences = (
    overrides: Partial<UserPreferences> = {},
  ): UserPreferences => ({
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

    const userStoreMock: Partial<UserStore> = {
      preferences: computed(() => preferencesSignal()),
    };

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        AppThemeService,
        { provide: UserStore, useValue: userStoreMock },
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
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.classList.contains('theme-light')).toBe(true);
    expect(root.classList.contains('theme-dark')).toBe(false);
    expect(root.style.colorScheme).toBe('light');
  });

  it('should apply dark color scheme when preferences change', async () => {
    preferencesSignal.set(createMockPreferences({ colorScheme: 'dark' }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.classList.contains('theme-dark')).toBe(true);
    expect(root.classList.contains('theme-light')).toBe(false);
    expect(root.style.colorScheme).toBe('dark');
  });

  it('should remove both theme classes before adding the new one', async () => {
    preferencesSignal.set(createMockPreferences({ colorScheme: 'dark' }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.classList.contains('theme-dark')).toBe(true);

    preferencesSignal.set(createMockPreferences({ colorScheme: 'light' }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.classList.contains('theme-light')).toBe(true);
    expect(root.classList.contains('theme-dark')).toBe(false);
  });
});
