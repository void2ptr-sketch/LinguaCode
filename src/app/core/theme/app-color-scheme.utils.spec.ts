import { applyColorSchemeToDocument, normalizeColorScheme, readStoredColorScheme } from './app-color-scheme.utils';

describe('app-color-scheme.utils', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.colorScheme = '';
  });

  it('should normalize invalid values to light', () => {
    expect(normalizeColorScheme('dark')).toBe('dark');
    expect(normalizeColorScheme('system')).toBe('light');
    expect(normalizeColorScheme(undefined)).toBe('light');
  });

  it('should read color scheme from persisted user', () => {
    localStorage.setItem(
      'lingua-code.user',
      JSON.stringify({
        id: 'u1',
        displayName: 'Test',
        preferences: { colorScheme: 'dark', theme: 'azure-blue', fontSize: 'md', languagePairs: [], activeLanguagePairId: '' },
      }),
    );

    expect(readStoredColorScheme()).toBe('dark');
  });

  it('should apply theme classes to documentElement', () => {
    applyColorSchemeToDocument('dark');
    expect(document.documentElement.classList.contains('theme-dark')).toBeTrue();
    expect(document.documentElement.style.colorScheme).toBe('dark');

    applyColorSchemeToDocument('light');
    expect(document.documentElement.classList.contains('theme-light')).toBeTrue();
    expect(document.documentElement.classList.contains('theme-dark')).toBeFalse();
  });
});
