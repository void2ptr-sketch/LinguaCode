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

  it('should expose default user with active language pair', () => {
    expect(store.displayName()).toBe('Ученик');
    expect(store.preferences().fontSize).toBe('md');
    expect(store.languagePairs()).toHaveSize(1);
    expect(store.languagePair()).toEqual({ known: 'ru', learning: 'en' });
    expect(store.languagePairLabel()).toBe('Русский → English');
    expect(store.isActiveEntry(store.languagePairs()[0])).toBeTrue();
    expect(store.cjkLearning().displayRomanization).toBe('pinyin');
    expect(store.phonetic().showIpa).toBeFalse();
    expect(store.languagePairs()[0].settings?.phonetic).toBeDefined();
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

  it('should update appearance preferences partially', () => {
    store.updatePreferences({ fontSize: 'lg' });
    expect(store.preferences().fontSize).toBe('lg');
    expect(store.preferences().theme).toBe('azure-blue');
    expect(store.languagePair()).toEqual({ known: 'ru', learning: 'en' });
  });

  it('should add language pair and make it active', () => {
    store.addLanguagePair({ known: 'ru', learning: 'zh' });

    expect(store.languagePairs()).toHaveSize(2);
    expect(store.languagePair()).toEqual({ known: 'ru', learning: 'zh' });

    const zhEntry = store.languagePairs().find((entry) => entry.pair.learning === 'zh');
    expect(zhEntry?.settings?.cjkLearning?.displayRomanization).toBe('pinyin');
  });

  it('should not duplicate language pairs when adding existing pair', () => {
    store.addLanguagePair({ known: 'ru', learning: 'zh' });
    store.addLanguagePair({ known: 'ru', learning: 'en' });

    expect(store.languagePairs()).toHaveSize(2);
    expect(store.languagePair()).toEqual({ known: 'ru', learning: 'en' });
  });

  it('should switch active language pair and resolve pair-specific settings', () => {
    store.addLanguagePair({ known: 'ru', learning: 'zh' });
    const zhId = store.languagePairs().find((entry) => entry.pair.learning === 'zh')!.id;

    store.updateLanguagePairSettings(zhId, {
      cjkLearning: { displayRomanization: 'palladius', answerRomanization: ['palladius'], showTones: true },
    });

    const enId = store.languagePairs().find((entry) => entry.pair.learning === 'en')!.id;
    store.updateLanguagePairSettings(enId, {
      phonetic: { showIpa: true, ipaVariantLabel: 'BrE', answerModes: ['orthography', 'ipa'] },
    });

    store.setActiveLanguagePair(zhId);
    expect(store.cjkLearning().displayRomanization).toBe('palladius');
    expect(store.phonetic().showIpa).toBeFalse();

    store.setActiveLanguagePair(enId);
    expect(store.cjkLearning().displayRomanization).toBe('pinyin');
    expect(store.phonetic().showIpa).toBeTrue();
    expect(store.phonetic().ipaVariantLabel).toBe('BrE');
  });

  it('should remove language pair and reassign active id', () => {
    store.addLanguagePair({ known: 'ru', learning: 'zh' });
    const activeId = store.activeLanguagePairId();

    store.removeLanguagePair(activeId);

    expect(store.languagePairs()).toHaveSize(1);
    expect(store.languagePair()).toEqual({ known: 'ru', learning: 'en' });
  });

  it('should not remove the last language pair', () => {
    store.removeLanguagePair(store.activeLanguagePairId());
    expect(store.languagePairs()).toHaveSize(1);
  });

  it('should update and persist active language pair via legacy API', () => {
    store.updateLanguagePair({ known: 'ru', learning: 'zh' });
    expect(store.languagePair()).toEqual({ known: 'ru', learning: 'zh' });

    const reloaded = TestBed.inject(UserPersistence).load();
    expect(reloaded?.preferences.languagePairs[0].pair).toEqual({ known: 'ru', learning: 'zh' });
    expect(localStorage.getItem(USER_STORAGE_KEY)).toContain('"learning":"zh"');
  });

  it('should reject identical known and learning languages when adding pair', () => {
    store.addLanguagePair({ known: 'en', learning: 'en' });
    expect(store.languagePairs()).toHaveSize(1);
    expect(store.languagePair()).toEqual({ known: 'ru', learning: 'en' });
  });

  it('should update pair-specific cjk and phonetic settings', () => {
    store.updateActiveLanguagePairSettings({
      phonetic: { showIpa: true, ipaVariantLabel: 'BrE', answerModes: ['orthography', 'ipa'] },
    });

    expect(store.phonetic().showIpa).toBeTrue();
    expect(store.phonetic().ipaVariantLabel).toBe('BrE');
  });
});
