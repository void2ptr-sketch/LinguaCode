import { groupCatalogTagFacets } from './catalog-tag-groups.utils';
import { tagLabel } from './catalog-labels';

describe('groupCatalogTagFacets', () => {
  it('should group tags by themes, subtopics and other tags in course order', () => {
    const groups = groupCatalogTagFacets([
      { value: 'regex-captures', count: 3 },
      { value: 'basics', count: 10 },
      { value: 'beginner', count: 20 },
      { value: 'greetings', count: 2 },
      { value: 'oop', count: 2 },
      { value: 'advanced', count: 5 },
    ]);

    expect(groups.map((group) => group.label)).toEqual([
      'Темы',
      'Подтемы',
      'Теги',
    ]);
    expect(groups[0]?.facets.map((facet) => facet.value)).toEqual(['basics', 'oop']);
    expect(groups[1]?.facets.map((facet) => facet.value)).toEqual(['regex-captures']);
    expect(groups[2]?.facets.map((facet) => facet.value)).toEqual(['beginner', 'advanced', 'greetings']);
  });
});

describe('tagLabel', () => {
  it('should not translate difficulty tag ids', () => {
    expect(tagLabel('beginner')).toBe('beginner');
    expect(tagLabel('intermediate')).toBe('intermediate');
    expect(tagLabel('advanced')).toBe('advanced');
  });

  it('should translate known theme labels', () => {
    expect(tagLabel('basics')).toBe('Основы');
    expect(tagLabel('modern-perl')).toBe('Современный Perl');
  });
});
