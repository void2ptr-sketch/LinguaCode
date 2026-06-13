import { UserStore } from './user.store';

describe('UserStore', () => {
  let store: UserStore;

  beforeEach(() => {
    store = new UserStore();
  });

  it('should expose default user', () => {
    expect(store.displayName()).toBe('Ученик');
    expect(store.preferences().fontSize).toBe('md');
  });

  it('should update display name', () => {
    store.updateDisplayName('Alex');
    expect(store.displayName()).toBe('Alex');
  });

  it('should ignore empty display name', () => {
    store.updateDisplayName('   ');
    expect(store.displayName()).toBe('Ученик');
  });

  it('should update preferences partially', () => {
    store.updatePreferences({ fontSize: 'lg' });
    expect(store.preferences()).toEqual({
      theme: 'azure-blue',
      fontSize: 'lg',
    });
  });
});
