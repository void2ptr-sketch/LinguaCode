import { clampPageIndex, paginateItems } from './paginate-items';

describe('paginateItems', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

  it('returns the first page slice', () => {
    expect(paginateItems(items, 0, 3)).toEqual({
      items: ['a', 'b', 'c'],
      pageIndex: 0,
      pageSize: 3,
      totalItems: 7,
    });
  });

  it('returns the last partial page slice', () => {
    expect(paginateItems(items, 2, 3)).toEqual({
      items: ['g'],
      pageIndex: 2,
      pageSize: 3,
      totalItems: 7,
    });
  });

  it('clamps page index when it is out of range', () => {
    expect(paginateItems(items, 10, 3).pageIndex).toBe(2);
    expect(paginateItems(items, 10, 3).items).toEqual(['g']);
  });
});

describe('clampPageIndex', () => {
  it('returns zero for empty collections', () => {
    expect(clampPageIndex(0, 5, 10)).toBe(0);
  });

  it('clamps to the last page', () => {
    expect(clampPageIndex(7, 5, 3)).toBe(2);
  });
});
