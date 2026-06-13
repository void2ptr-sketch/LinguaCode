import { TestBed } from '@angular/core/testing';
import { CardAppearance } from '../models';
import { USER_STORAGE_KEY, UserPersistence } from './user.persistence';
import { UserStore } from './user.store';

describe('UserStore', () => {
  let store: UserStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [UserStore, UserPersistence],
    });
    store = TestBed.inject(UserStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should expose default user with language pair', () => {
    expect(store.displayName()).toBe('Ученик');
    expect(store.preferences().fontSize).toBe('md');
    expect(store.languagePair()).toEqual({ known: 'ru', learning: 'en' });
    expect(store.languagePairLabel()).toBe('Русский → English');
  });

  it('should update display name', () => {
    store.updateDisplayName('Alex');
    expect(store.displayName()).toBe('Alex');
  });

  it('should ignore empty display name', () => {
    store.updateDisplayName('   ');
    expect(store.displayName()).toBe('Ученик');
  });

  it('should sanitize display name input', () => {
    store.updateDisplayName('<script>alert(1)</script>Alex');
    expect(store.displayName()).toBe('alert(1)Alex');
  });

  it('should sanitize theme preference', () => {
    store.updatePreferences({ theme: ' Dark Mode! ' });
    expect(store.preferences().theme).toBe('dark-mode');
  });

  it('should ignore invalid font size', () => {
    store.updatePreferences({ fontSize: 'xl' as CardAppearance['fontSize'] });
    expect(store.preferences().fontSize).toBe('md');
  });

  it('should update preferences partially', () => {
    store.updatePreferences({ fontSize: 'lg' });
    expect(store.preferences()).toEqual({
      theme: 'azure-blue',
      fontSize: 'lg',
      languagePair: { known: 'ru', learning: 'en' },
    });
  });

  it('should update and persist language pair', () => {
    store.updateLanguagePair({ known: 'ru', learning: 'zh' });
    expect(store.languagePair()).toEqual({ known: 'ru', learning: 'zh' });

    const reloaded = TestBed.inject(UserPersistence).load();
    expect(reloaded?.preferences.languagePair).toEqual({ known: 'ru', learning: 'zh' });
    expect(localStorage.getItem(USER_STORAGE_KEY)).toContain('"learning":"zh"');
  });

  it('should reject identical known and learning languages', () => {
    store.updateLanguagePair({ known: 'en', learning: 'en' });
    expect(store.languagePair()).toEqual({ known: 'ru', learning: 'en' });
  });
});
