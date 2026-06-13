import {
  clampPage,
  createPageResponse,
  paginateArray,
  toOffsetLimit,
  totalPages,
} from './pagination.utils';

describe('pagination.utils', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

  describe('totalPages', () => {
    it('returns zero when page size is invalid', () => {
      expect(totalPages(10, 0)).toBe(0);
    });

    it('counts full and partial pages', () => {
      expect(totalPages(7, 3)).toBe(3);
      expect(totalPages(6, 3)).toBe(2);
    });
  });

  describe('clampPage', () => {
    it('keeps page in range', () => {
      expect(clampPage(0, 7, 3)).toBe(0);
      expect(clampPage(10, 7, 3)).toBe(2);
      expect(clampPage(-1, 7, 3)).toBe(0);
    });
  });

  describe('toOffsetLimit', () => {
    it('maps page request to offset and limit', () => {
      expect(toOffsetLimit({ page: 2, pageSize: 25 })).toEqual({ offset: 50, limit: 25 });
    });
  });

  describe('createPageResponse', () => {
    it('builds metadata for a page slice', () => {
      expect(createPageResponse(['a', 'b'], 7, { page: 0, pageSize: 3 })).toEqual({
        items: ['a', 'b'],
        page: 0,
        pageSize: 3,
        totalItems: 7,
        totalPages: 3,
      });
    });
  });

  describe('paginateArray', () => {
    it('returns the requested slice', () => {
      expect(paginateArray(items, { page: 0, pageSize: 3 }).items).toEqual(['a', 'b', 'c']);
    });

    it('clamps out-of-range page index', () => {
      expect(paginateArray(items, { page: 10, pageSize: 3 })).toEqual({
        items: ['g'],
        page: 2,
        pageSize: 3,
        totalItems: 7,
        totalPages: 3,
      });
    });
  });
});
