import { CardAppearance } from '../models';
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
    });
  });
});
