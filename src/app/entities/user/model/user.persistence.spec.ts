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

  it('should return null when no data stored', () => {
    const user = persistence.load();
    expect(user).toBeNull();
  });

  it('should return null when stored data is invalid JSON', () => {
    localStorage.setItem(USER_STORAGE_KEY, 'not-json');
    const user = persistence.load();
    expect(user).toBeNull();
  });

  it('should return null when stored data is not an object', () => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify('string'));
    const user = persistence.load();
    expect(user).toBeNull();
  });

  it('should return null when stored data is null', () => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(null));
    const user = persistence.load();
    expect(user).toBeNull();
  });

  it('should return user with defaults when minimal data is stored', () => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({}));
    const user = persistence.load();
    expect(user?.id).toBe('local-user');
    expect(user?.displayName).toBe('Ученик');
  });

  it('should use stored id when it is a string', () => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ id: 'custom-user' }));
    const user = persistence.load();
    expect(user?.id).toBe('custom-user');
  });

  it('should fall back to default id when id is not a string', () => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ id: 123 }));
    const user = persistence.load();
    expect(user?.id).toBe('local-user');
  });

  it('should use stored displayName when it is a string', () => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ displayName: 'John' }));
    const user = persistence.load();
    expect(user?.displayName).toBe('John');
  });

  it('should fall back to default displayName when not a string', () => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ displayName: 42 }));
    const user = persistence.load();
    expect(user?.displayName).toBe('Ученик');
  });

  it('should save and load user', () => {
    const user = {
      id: 'test-user',
      displayName: 'Test User',
      preferences: {
        theme: 'azure-blue' as const,
        fontSize: 'md' as const,
        languagePairs: [],
        activeLanguagePairId: null,
      },
    } as never;
    persistence.save(user);

    const loaded = persistence.load();
    expect(loaded?.id).toBe('test-user');
    expect(loaded?.displayName).toBe('Test User');
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

    expect(user?.preferences.languagePairs).toHaveLength(1);
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

    expect(user?.preferences.languagePairs).toHaveLength(2);
    expect(user?.preferences.activeLanguagePairId).toBe('pair-2');
    expect(user?.preferences.languagePairs[0].settings?.phonetic?.showIpa).toBe(true);
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

    expect(enEntry?.settings?.phonetic?.showIpa).toBe(true);
    expect(enEntry?.settings?.phonetic?.ipaVariantLabel).toBe('AmE');
    expect(zhEntry?.settings?.cjkLearning?.displayRomanizations).toEqual(['palladius']);
    expect(zhEntry?.settings?.phonetic?.showIpa).toBe(true);
    expect(zhEntry?.settings?.phonetic?.ipaVariantLabel).toBe('AmE');
  });
});
