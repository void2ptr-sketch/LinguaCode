import { USER_STORAGE_KEY, UserPersistence } from './user.persistence';

describe('UserPersistence', () => {
  let persistence: UserPersistence;

  beforeEach(() => {
    localStorage.clear();
    persistence = new UserPersistence();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should migrate legacy languagePair preference', () => {
    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify({
        id: 'local-user',
        displayName: 'Alex',
        preferences: {
          theme: 'azure-blue',
          fontSize: 'md',
          languagePair: { known: 'ru', learning: 'zh' },
        },
      }),
    );

    const user = persistence.load();

    expect(user?.preferences.languagePairs).toHaveSize(1);
    expect(user?.preferences.languagePairs[0].pair).toEqual({ known: 'ru', learning: 'zh' });
    expect(user?.preferences.activeLanguagePairId).toBe(user?.preferences.languagePairs[0].id);
    expect(user?.preferences.languagePairs[0].settings?.cjkLearning?.displayRomanizations).toEqual([
      'pinyin',
    ]);
  });

  it('should normalize stored languagePairs with per-pair settings', () => {
    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify({
        id: 'local-user',
        displayName: 'Alex',
        preferences: {
          theme: 'azure-blue',
          fontSize: 'md',
          languagePairs: [
            {
              id: 'pair-1',
              pair: { known: 'ru', learning: 'en' },
              createdAt: '2026-01-01T00:00:00.000Z',
              settings: {
                phonetic: { showIpa: true, ipaVariantLabel: 'BrE', answerModes: ['ipa'] },
              },
            },
            {
              id: 'pair-2',
              pair: { known: 'ru', learning: 'zh' },
              createdAt: '2026-01-02T00:00:00.000Z',
              settings: {
                cjkLearning: {
                  displayRomanizations: ['palladius'],
                  answerRomanization: ['palladius'],
                  showTones: false,
                },
              },
            },
          ],
          activeLanguagePairId: 'pair-2',
        },
      }),
    );

    const user = persistence.load();

    expect(user?.preferences.languagePairs).toHaveSize(2);
    expect(user?.preferences.activeLanguagePairId).toBe('pair-2');
    expect(user?.preferences.languagePairs[0].settings?.phonetic?.showIpa).toBeTrue();
    expect(user?.preferences.languagePairs[1].settings?.cjkLearning?.displayRomanizations).toEqual([
      'palladius',
    ]);
  });

  it('should migrate legacy global cjkLearning and phonetic into pair entries', () => {
    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify({
        id: 'local-user',
        displayName: 'Alex',
        preferences: {
          theme: 'azure-blue',
          fontSize: 'md',
          languagePairs: [
            {
              id: 'pair-1',
              pair: { known: 'ru', learning: 'en' },
              createdAt: '2026-01-01T00:00:00.000Z',
            },
            {
              id: 'pair-2',
              pair: { known: 'ru', learning: 'zh' },
              createdAt: '2026-01-02T00:00:00.000Z',
            },
          ],
          activeLanguagePairId: 'pair-2',
          cjkLearning: {
            displayRomanizations: ['palladius'],
            answerRomanization: ['palladius'],
            showTones: true,
          },
          phonetic: { showIpa: true, ipaVariantLabel: 'AmE', answerModes: ['orthography', 'ipa'] },
        },
      }),
    );

    const user = persistence.load();

    const enEntry = user?.preferences.languagePairs.find((entry) => entry.id === 'pair-1');
    const zhEntry = user?.preferences.languagePairs.find((entry) => entry.id === 'pair-2');

    expect(enEntry?.settings?.phonetic?.showIpa).toBeTrue();
    expect(enEntry?.settings?.phonetic?.ipaVariantLabel).toBe('AmE');
    expect(zhEntry?.settings?.cjkLearning?.displayRomanizations).toEqual(['palladius']);
    expect(zhEntry?.settings?.phonetic?.showIpa).toBeTrue();
    expect(zhEntry?.settings?.phonetic?.ipaVariantLabel).toBe('AmE');
  });
});
