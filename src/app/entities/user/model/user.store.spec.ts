import { TestBed } from '@angular/core/testing';
import { CardAppearance } from '../../card/model';
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
    expect(store.preferences().colorScheme).toBe('light');
    expect(store.preferences().cardFocusFullscreen).toBe(false);
    expect(store.preferences().learningProficiencyLevel).toBe('beginner');
    expect(store.learningProficiencyLevel()).toBe('beginner');
    expect(store.languagePairs()).toHaveLength(1);
    expect(store.languagePair()).toEqual({ known: 'ru', learning: 'en' });
    expect(store.languagePairLabel()).toBe('ru → en');
    expect(store.isActiveEntry(store.languagePairs()[0])).toBe(true);
    expect(store.cjkLearning().displayRomanizations).toEqual(['pinyin']);
    expect(store.phonetic().showIpa).toBe(false);
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

  it('should update color scheme preference', () => {
    store.updatePreferences({ colorScheme: 'dark' });
    expect(store.preferences().colorScheme).toBe('dark');

    store.updatePreferences({ colorScheme: 'invalid' as 'light' });
    expect(store.preferences().colorScheme).toBe('light');
  });

  it('should update card focus fullscreen preference', () => {
    store.updatePreferences({ cardFocusFullscreen: true });
    expect(store.preferences().cardFocusFullscreen).toBe(true);

    store.updatePreferences({ cardFocusFullscreen: 'yes' as unknown as boolean });
    expect(store.preferences().cardFocusFullscreen).toBe(false);
  });

  it('should update learning proficiency level', () => {
    store.updatePreferences({ learningProficiencyLevel: 'advanced' });
    expect(store.learningProficiencyLevel()).toBe('advanced');

    store.updatePreferences({ learningProficiencyLevel: 'invalid' as 'advanced' });
    expect(store.learningProficiencyLevel()).toBe('beginner');
  });

  it('should update appearance preferences partially', () => {
    store.updatePreferences({ fontSize: 'lg' });
    expect(store.preferences().fontSize).toBe('lg');
    expect(store.preferences().theme).toBe('azure-blue');
    expect(store.languagePair()).toEqual({ known: 'ru', learning: 'en' });
  });

  it('should add language pair and make it active', () => {
    store.addLanguagePair({ known: 'ru', learning: 'zh' });

    expect(store.languagePairs()).toHaveLength(2);
    expect(store.languagePair()).toEqual({ known: 'ru', learning: 'zh' });

    const zhEntry = store.languagePairs().find((entry) => entry.pair.learning === 'zh');
    expect(zhEntry?.settings?.cjkLearning?.displayRomanizations).toEqual(['pinyin']);
  });

  it('should not duplicate language pairs when adding existing pair', () => {
    store.addLanguagePair({ known: 'ru', learning: 'zh' });
    store.addLanguagePair({ known: 'ru', learning: 'en' });

    expect(store.languagePairs()).toHaveLength(2);
    expect(store.languagePair()).toEqual({ known: 'ru', learning: 'en' });
  });

  it('should switch active language pair and resolve pair-specific settings', () => {
    store.addLanguagePair({ known: 'ru', learning: 'zh' });
    const zhId = store.languagePairs().find((entry) => entry.pair.learning === 'zh')!.id;

    store.updateLanguagePairSettings(zhId, {
      cjkLearning: {
        displayRomanizations: ['palladius'],
        answerRomanization: ['palladius'],
        showTones: true,
        toneColorScheme: 'classic',
        tracingStrokeDurationSec: 1,
      },
    });

    const enId = store.languagePairs().find((entry) => entry.pair.learning === 'en')!.id;
    store.updateLanguagePairSettings(enId, {
      phonetic: { showIpa: true, ipaVariantLabel: 'BrE', answerModes: ['orthography', 'ipa'] },
    });

    store.setActiveLanguagePair(zhId);
    expect(store.cjkLearning().displayRomanizations).toEqual(['palladius']);
    expect(store.phonetic().showIpa).toBe(false);

    store.setActiveLanguagePair(enId);
    expect(store.cjkLearning().displayRomanizations).toEqual(['pinyin']);
    expect(store.phonetic().showIpa).toBe(true);
    expect(store.phonetic().ipaVariantLabel).toBe('BrE');
  });

  it('should remove language pair and reassign active id', () => {
    store.addLanguagePair({ known: 'ru', learning: 'zh' });
    const activeId = store.activeLanguagePairId();

    store.removeLanguagePair(activeId!);

    expect(store.languagePairs()).toHaveLength(1);
    expect(store.languagePair()).toEqual({ known: 'ru', learning: 'en' });
  });

  it('should remove the last language pair and clear active id', () => {
    const activeId = store.activeLanguagePairId();
    store.removeLanguagePair(activeId!);
    expect(store.languagePairs()).toHaveLength(0);
    expect(store.activeLanguagePairId()).toBeUndefined();
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
    expect(store.languagePairs()).toHaveLength(1);
    expect(store.languagePair()).toEqual({ known: 'ru', learning: 'en' });
  });

  it('should update pair-specific cjk and phonetic settings', () => {
    store.updateActiveLanguagePairSettings({
      phonetic: { showIpa: true, ipaVariantLabel: 'BrE', answerModes: ['orthography', 'ipa'] },
    });

    expect(store.phonetic().showIpa).toBe(true);
    expect(store.phonetic().ipaVariantLabel).toBe('BrE');
  });

  describe('mirror-group isolation', () => {
    it('should seed the mirror-group marker when activating a pair', () => {
      store.addLanguagePair({ known: 'en', learning: 'ru' });

      expect(store.activeByMirrorGroup()['en|ru']).toEqual({ known: 'en', learning: 'ru' });
      // Other mirror groups stay untouched.
      expect(store.activeByMirrorGroup()['ja|zh']).toBeUndefined();
    });

    it('should not activate pair or change markers when activate is false', () => {
      const beforeActiveId = store.activeLanguagePairId();

      const newId = store.addLanguagePair({ known: 'ja', learning: 'zh' }, { activate: false });

      expect(newId).not.toBe('');
      expect(store.activeLanguagePairId()).toBe(beforeActiveId);
      expect(store.languagePair()).toEqual({ known: 'ru', learning: 'en' });
      expect(store.activeByMirrorGroup()['ja|zh']).toBeUndefined();
      expect(store.activeByMirrorGroup()['en|ru']).toEqual({ known: 'ru', learning: 'en' });
    });

    it('should set a group marker scoped to a single mirror group', () => {
      store.addLanguagePair({ known: 'en', learning: 'ru' });
      store.setActivePairInGroup('ja|zh', { known: 'ja', learning: 'zh' });

      expect(store.activeByMirrorGroup()['en|ru']).toEqual({ known: 'en', learning: 'ru' });
      expect(store.activeByMirrorGroup()['ja|zh']).toEqual({ known: 'ja', learning: 'zh' });
    });

    it('should reject a group marker whose key does not match the pair', () => {
      store.setActivePairInGroup('ja|zh', { known: 'en', learning: 'ru' });

      expect(store.activeByMirrorGroup()['ja|zh']).toBeUndefined();
    });

    it('should isolate activation events between mirror groups', () => {
      store.addLanguagePair({ known: 'en', learning: 'ru' });
      store.addLanguagePair({ known: 'ja', learning: 'zh' });

      // Re-activate the EN↔RU direction — the JA↔ZH marker must not change.
      store.addLanguagePair({ known: 'ru', learning: 'en' });

      expect(store.activeByMirrorGroup()['en|ru']).toEqual({ known: 'ru', learning: 'en' });
      expect(store.activeByMirrorGroup()['ja|zh']).toEqual({ known: 'ja', learning: 'zh' });
    });

    it('should move the group marker to the mirror sibling when the active pair is removed', () => {
      store.addLanguagePair({ known: 'en', learning: 'ru' });
      store.addLanguagePair({ known: 'ru', learning: 'en' }, { activate: false });
      const activeId = store.activeLanguagePairId();

      store.removeLanguagePair(activeId!);

      expect(store.activeByMirrorGroup()['en|ru']).toEqual({ known: 'ru', learning: 'en' });
    });

    it('should clear the group marker when the mirror sibling is not configured', () => {
      store.addLanguagePair({ known: 'ja', learning: 'zh' });
      const jaZhId = store.activeLanguagePairId();

      store.removeLanguagePair(jaZhId!);

      expect(store.activeByMirrorGroup()['ja|zh']).toBeUndefined();
    });

    it('should not touch other groups when removing a pair', () => {
      store.addLanguagePair({ known: 'en', learning: 'ru' });
      store.addLanguagePair({ known: 'ja', learning: 'zh' }, { activate: false });
      const enRuId = store.languagePairs().find((e) => e.pair.known === 'en')!.id;

      store.removeLanguagePair(enRuId);

      expect(store.activeByMirrorGroup()['ja|zh']).toBeUndefined();
    });

    it('should seed mirror-group markers when loading a legacy profile', () => {
      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify({
          id: 'local-user',
          displayName: 'Ученик',
          preferences: {
            theme: 'azure-blue',
            fontSize: 'md',
            languagePairs: [{ id: 'pair-1', pair: { known: 'ru', learning: 'en' } }],
            activeLanguagePairId: 'pair-1',
          },
        }),
      );

      const loaded = TestBed.inject(UserPersistence).load();
      expect(loaded).not.toBeNull();
      expect(loaded?.preferences.activeLanguagePairId).toBe('pair-1');
      expect(loaded?.preferences.activeByMirrorGroup?.['en|ru']).toEqual({
        known: 'ru',
        learning: 'en',
      });
    });
  });
});
