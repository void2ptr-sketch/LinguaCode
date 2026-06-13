import { CardSelectStore } from './card-select.store';

describe('CardSelectStore', () => {
  let store: CardSelectStore;

  beforeEach(() => {
    store = new CardSelectStore();
  });

  it('should reset to initial state', () => {
    store.setLoading(true);
    store.setError('failed');

    store.reset();

    expect(store.cards()).toEqual([]);
    expect(store.loading()).toBeFalse();
    expect(store.error()).toBeNull();
  });
});
