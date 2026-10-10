import {
  emptyUserContentOverlay,
  readUserContentOverlay,
  writeUserContentOverlay,
  patchUserContentOverlay,
} from './user-content-overlay.storage';
import {
  USER_CONTENT_OVERLAY_KEY,
  USER_CONTENT_OVERLAY_VERSION,
} from './user-content-overlay.types';
import type { UserContentOverlay } from './user-content-overlay.types';

describe('user-content-overlay.storage', () => {
  const STORAGE_KEY = USER_CONTENT_OVERLAY_KEY;

  beforeEach(() => {
    localStorage.clear();
  });

  describe('emptyUserContentOverlay', () => {
    it('should return an overlay with default version and empty collections', () => {
      const overlay = emptyUserContentOverlay();

      expect(overlay.version).toBe(USER_CONTENT_OVERLAY_VERSION);
      expect(overlay.courses).toEqual({});
      expect(overlay.lessons).toEqual({});
      expect(overlay.scenarios).toEqual({});
      expect(overlay.cards).toEqual({});
      expect(overlay.cardIndexMeta).toEqual({});
      expect(overlay.deletedSystemIds).toEqual({});
    });
  });

  describe('readUserContentOverlay', () => {
    it('should return empty overlay when localStorage key is absent', () => {
      const result = readUserContentOverlay();
      const expected = emptyUserContentOverlay();

      expect(result).toEqual(expected);
    });

    it('should parse and return valid overlay from localStorage', () => {
      const overlay: UserContentOverlay = {
        version: USER_CONTENT_OVERLAY_VERSION,
        courses: { c1: { id: 'c1', title: 'Test Course' } },
        lessons: {},
        scenarios: {},
        cards: {},
        cardIndexMeta: {},
        deletedSystemIds: {},
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overlay));

      const result = readUserContentOverlay();

      expect(result.version).toBe(USER_CONTENT_OVERLAY_VERSION);
      expect(result.courses).toEqual(overlay.courses);
    });

    it('should return empty overlay when stored data is invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not-valid-json');

      const result = readUserContentOverlay();

      expect(result).toEqual(emptyUserContentOverlay());
    });

    it('should normalize partial overlay with defaults', () => {
      const partial = {
        version: USER_CONTENT_OVERLAY_VERSION,
        courses: { c1: { id: 'c1', title: 'Test' } },
      } as Partial<UserContentOverlay>;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(partial));

      const result = readUserContentOverlay();

      expect(result.version).toBe(USER_CONTENT_OVERLAY_VERSION);
      expect(result.courses).toEqual({ c1: { id: 'c1', title: 'Test' } });
      expect(result.lessons).toEqual({});
      expect(result.scenarios).toEqual({});
      expect(result.cards).toEqual({});
      expect(result.cardIndexMeta).toEqual({});
    });

    it('should handle null values in overlay fields gracefully', () => {
      const overlay = {
        version: USER_CONTENT_OVERLAY_VERSION,
        courses: null,
        lessons: null,
        scenarios: null,
        cards: null,
        cardIndexMeta: null,
        deletedSystemIds: null,
      } as unknown as UserContentOverlay;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overlay));

      const result = readUserContentOverlay();

      expect(result.courses).toEqual({});
      expect(result.lessons).toEqual({});
      expect(result.scenarios).toEqual({});
      expect(result.cards).toEqual({});
      expect(result.cardIndexMeta).toEqual({});
      expect(result.deletedSystemIds).toEqual({});
    });
  });

  describe('writeUserContentOverlay', () => {
    it('should save overlay to localStorage', () => {
      const overlay: UserContentOverlay = {
        version: USER_CONTENT_OVERLAY_VERSION,
        courses: { c1: { id: 'c1', title: 'Test' } },
        lessons: {},
        scenarios: {},
        cards: {},
        cardIndexMeta: {},
        deletedSystemIds: {},
      };
      writeUserContentOverlay(overlay);

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.version).toBe(USER_CONTENT_OVERLAY_VERSION);
      expect(parsed.courses).toEqual(overlay.courses);
    });

    it('should normalize overlay before writing', () => {
      const overlay = {
        version: 999,
        courses: { c1: { id: 'c1', title: 'Test' } },
        lessons: 'invalid',
        scenarios: null,
        cards: [],
        cardIndexMeta: undefined,
        deletedSystemIds: 'also-invalid',
      } as unknown as UserContentOverlay;
      writeUserContentOverlay(overlay);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.version).toBe(USER_CONTENT_OVERLAY_VERSION);
      expect(stored.lessons).toEqual({});
      expect(stored.scenarios).toEqual({});
      expect(stored.cards).toEqual({});
      expect(stored.cardIndexMeta).toEqual({});
      expect(stored.deletedSystemIds).toEqual({});
    });
  });

  describe('patchUserContentOverlay', () => {
    it('should apply patch over existing overlay and save', () => {
      const initial: UserContentOverlay = {
        version: USER_CONTENT_OVERLAY_VERSION,
        courses: { c1: { id: 'c1', title: 'Original' } },
        lessons: { l1: { id: 'l1', courseId: 'c1', title: 'Original Lesson' } },
        scenarios: {},
        cards: {},
        cardIndexMeta: {},
        deletedSystemIds: {},
      };
      writeUserContentOverlay(initial);

      const patched = patchUserContentOverlay({
        courses: { c1: { id: 'c1', title: 'Updated' }, c2: { id: 'c2', title: 'New Course' } },
      });

      expect(patched.version).toBe(USER_CONTENT_OVERLAY_VERSION);
      expect(patched.courses).toEqual({
        c1: { id: 'c1', title: 'Updated' },
        c2: { id: 'c2', title: 'New Course' },
      });
      expect(patched.lessons).toEqual(initial.lessons);
    });

    it('should work when no overlay exists yet', () => {
      const patched = patchUserContentOverlay({
        courses: { c1: { id: 'c1', title: 'First Course' } },
      });

      expect(patched.version).toBe(USER_CONTENT_OVERLAY_VERSION);
      expect(patched.courses).toEqual({ c1: { id: 'c1', title: 'First Course' } });
    });

    it('should persist normalized overlay to localStorage', () => {
      writeUserContentOverlay(emptyUserContentOverlay());

      patchUserContentOverlay({
        scenarios: { s1: { id: 's1', title: 'Test' } },
        deletedSystemIds: { courses: ['c-old'] },
      });

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.scenarios).toEqual({ s1: { id: 's1', title: 'Test' } });
      expect(stored.deletedSystemIds).toEqual({ courses: ['c-old'] });
    });
  });
});
