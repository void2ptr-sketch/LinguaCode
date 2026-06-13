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
  });

  it('should normalize stored languagePairs', () => {
    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify({
        id: 'local-user',
        displayName: 'Alex',
        preferences: {
          theme: 'azure-blue',
          fontSize: 'md',
          languagePairs: [
            { id: 'pair-1', pair: { known: 'ru', learning: 'en' }, createdAt: '2026-01-01T00:00:00.000Z' },
            { id: 'pair-2', pair: { known: 'ru', learning: 'zh' }, createdAt: '2026-01-02T00:00:00.000Z' },
          ],
          activeLanguagePairId: 'pair-2',
        },
      }),
    );

    const user = persistence.load();

    expect(user?.preferences.languagePairs).toHaveSize(2);
    expect(user?.preferences.activeLanguagePairId).toBe('pair-2');
    expect(user?.preferences.cjkLearning?.displayRomanization).toBe('pinyin');
    expect(user?.preferences.phonetic?.showIpa).toBeFalse();
  });
});
