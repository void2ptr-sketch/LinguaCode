import type { CardIndexMetaOverride } from '../mapping/card-index.mapper';
import {
  CARD_INDEX_META_STORAGE_KEY,
  loadCardIndexMetaOverrides,
  removeCardIndexMetaOverride,
  saveCardIndexMetaOverrides,
  upsertCardIndexMetaOverride,
} from './card-index-meta.storage';
import { readUserContentOverlay } from '../../user/overlay/user-content-overlay.storage';

function makeMeta(overrides?: Partial<CardIndexMetaOverride>): CardIndexMetaOverride {
  return {
    knownLanguage: 'ru',
    learningLanguage: 'zh',
    difficulty: 'intermediate',
    tags: ['hsk1'],
    ...overrides,
  };
}

describe('card-index-meta.storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('CARD_INDEX_META_STORAGE_KEY', () => {
    it('should expose the legacy storage key', () => {
      expect(CARD_INDEX_META_STORAGE_KEY).toBe('lingua-code.card-index-meta');
    });
  });

  describe('loadCardIndexMetaOverrides', () => {
    it('should return empty record when overlay has no metadata', () => {
      expect(loadCardIndexMetaOverrides()).toEqual({});
    });

    it('should return stored overrides from the user-content overlay', () => {
      saveCardIndexMetaOverrides({ 'card-1': makeMeta() });

      const result = loadCardIndexMetaOverrides();

      expect(result['card-1']).toEqual(makeMeta());
    });

    it('should return a copy (mutations do not affect stored data)', () => {
      saveCardIndexMetaOverrides({ 'card-1': makeMeta() });

      const result = loadCardIndexMetaOverrides();
      delete result['card-1'];

      expect(loadCardIndexMetaOverrides()['card-1']).toEqual(makeMeta());
    });
  });

  describe('saveCardIndexMetaOverrides', () => {
    it('should persist overrides into the user-content overlay', () => {
      saveCardIndexMetaOverrides({
        'card-1': makeMeta(),
        'card-2': makeMeta({ difficulty: 'advanced' }),
      });

      const overlay = readUserContentOverlay();

      expect(overlay.cardIndexMeta['card-1']).toEqual(makeMeta());
      expect(overlay.cardIndexMeta['card-2']).toEqual(makeMeta({ difficulty: 'advanced' }));
    });

    it('should replace previously saved overrides', () => {
      saveCardIndexMetaOverrides({ 'card-1': makeMeta() });
      saveCardIndexMetaOverrides({ 'card-2': makeMeta() });

      const result = loadCardIndexMetaOverrides();

      expect(result['card-1']).toBeUndefined();
      expect(result['card-2']).toEqual(makeMeta());
    });
  });

  describe('upsertCardIndexMetaOverride', () => {
    it('should add a new override and return the updated record', () => {
      const result = upsertCardIndexMetaOverride('card-1', makeMeta());

      expect(result['card-1']).toEqual(makeMeta());
      expect(loadCardIndexMetaOverrides()['card-1']).toEqual(makeMeta());
    });

    it('should update an existing override while keeping others', () => {
      upsertCardIndexMetaOverride('card-1', makeMeta());
      const result = upsertCardIndexMetaOverride('card-1', makeMeta({ difficulty: 'advanced' }));

      expect(result['card-1']).toEqual(makeMeta({ difficulty: 'advanced' }));
      expect(loadCardIndexMetaOverrides()['card-1']).toEqual(makeMeta({ difficulty: 'advanced' }));
    });
  });

  describe('removeCardIndexMetaOverride', () => {
    it('should remove an existing override', () => {
      upsertCardIndexMetaOverride('card-1', makeMeta());
      upsertCardIndexMetaOverride('card-2', makeMeta());

      removeCardIndexMetaOverride('card-1');

      const result = loadCardIndexMetaOverrides();
      expect(result['card-1']).toBeUndefined();
      expect(result['card-2']).toEqual(makeMeta());
    });

    it('should do nothing when the override does not exist', () => {
      upsertCardIndexMetaOverride('card-1', makeMeta());

      removeCardIndexMetaOverride('missing');

      expect(loadCardIndexMetaOverrides()).toEqual({ 'card-1': makeMeta() });
    });
  });
});
