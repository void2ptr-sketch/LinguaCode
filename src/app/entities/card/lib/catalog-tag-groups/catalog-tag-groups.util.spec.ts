import { describe, expect, it } from 'vitest';
import {
  CATALOG_TAG_THEME_ORDER,
  CATALOG_TAG_SUBTOPIC_ORDER,
  groupCatalogTagFacets,
} from './catalog-tag-groups.util';
import type { FacetCount } from '../../model';

describe('catalog-tag-groups.util', () => {
  // ── CATALOG_TAG_THEME_ORDER ──

  describe('CATALOG_TAG_THEME_ORDER', () => {
    it('should have all theme orders', () => {
      expect(CATALOG_TAG_THEME_ORDER).toContain('intro');
      expect(CATALOG_TAG_THEME_ORDER).toContain('modern-perl');
      expect(CATALOG_TAG_THEME_ORDER).toContain('oop');
      expect(CATALOG_TAG_THEME_ORDER.length).toBe(7);
    });
  });

  // ── CATALOG_TAG_SUBTOPIC_ORDER ──

  describe('CATALOG_TAG_SUBTOPIC_ORDER', () => {
    it('should have subtopic orders', () => {
      expect(CATALOG_TAG_SUBTOPIC_ORDER).toContain('scalar-context');
      expect(CATALOG_TAG_SUBTOPIC_ORDER).toContain('dbi-transactions');
      expect(CATALOG_TAG_SUBTOPIC_ORDER).toContain('cgi-legacy');
    });

    it('should have many subtopics', () => {
      expect(CATALOG_TAG_SUBTOPIC_ORDER.length).toBeGreaterThan(30);
    });
  });

  // ── groupCatalogTagFacets ──

  describe('groupCatalogTagFacets', () => {
    const makeFacet = (value: string, count: number): FacetCount<string> => ({
      value,
      count,
    });

    it('should return empty array when no tags', () => {
      const result = groupCatalogTagFacets([]);
      expect(result).toEqual([]);
    });

    it('should group theme tags', () => {
      const tags: FacetCount<string>[] = [makeFacet('intro', 5), makeFacet('basics', 3)];
      const result = groupCatalogTagFacets(tags);
      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('\u0422\u0435\u043c\u044b');
      expect(result[0].facets).toHaveLength(2);
    });

    it('should group subtopic tags', () => {
      const tags: FacetCount<string>[] = [makeFacet('scalar-context', 5), makeFacet('sigils', 3)];
      const result = groupCatalogTagFacets(tags);
      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('\u041f\u043e\u0434\u0442\u0435\u043c\u044b');
    });

    it('should group other tags', () => {
      const tags: FacetCount<string>[] = [makeFacet('vocabulary', 5), makeFacet('greetings', 3)];
      const result = groupCatalogTagFacets(tags);
      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('\u0422\u0435\u0433\u0438');
    });

    it('should group themes and subtopics together', () => {
      const tags: FacetCount<string>[] = [makeFacet('intro', 5), makeFacet('scalar-context', 3)];
      const result = groupCatalogTagFacets(tags);
      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('\u0422\u0435\u043c\u044b');
      expect(result[1].label).toBe('\u041f\u043e\u0434\u0442\u0435\u043c\u044b');
    });

    it('should group themes, subtopics and other together', () => {
      const tags: FacetCount<string>[] = [
        makeFacet('intro', 5),
        makeFacet('scalar-context', 3),
        makeFacet('vocabulary', 2),
      ];
      const result = groupCatalogTagFacets(tags);
      expect(result).toHaveLength(3);
      expect(result[0].label).toBe('\u0422\u0435\u043c\u044b');
      expect(result[1].label).toBe('\u041f\u043e\u0434\u0442\u0435\u043c\u044b');
      expect(result[2].label).toBe('\u0422\u0435\u0433\u0438');
    });

    it('should filter out zero-count facets', () => {
      const tags: FacetCount<string>[] = [makeFacet('intro', 0), makeFacet('basics', 3)];
      const result = groupCatalogTagFacets(tags);
      expect(result[0].facets).toHaveLength(1);
      expect(result[0].facets[0].value).toBe('basics');
    });

    it('should sort other tags alphabetically', () => {
      const tags: FacetCount<string>[] = [
        makeFacet('zoo', 1),
        makeFacet('apple', 2),
        makeFacet('middle', 3),
      ];
      const result = groupCatalogTagFacets(tags);
      expect(result[0].facets.map((f) => f.value)).toEqual(['apple', 'middle', 'zoo']);
    });

    it('should order theme tags by theme order', () => {
      const tags: FacetCount<string>[] = [
        makeFacet('oop', 1),
        makeFacet('intro', 2),
        makeFacet('basics', 3),
      ];
      const result = groupCatalogTagFacets(tags);
      expect(result[0].facets.map((f) => f.value)).toEqual(['intro', 'basics', 'oop']);
    });

    it('should order subtopic tags by subtopic order', () => {
      const tags: FacetCount<string>[] = [
        makeFacet('dbi-transactions', 1),
        makeFacet('scalar-context', 2),
        makeFacet('sigils', 3),
      ];
      const result = groupCatalogTagFacets(tags);
      expect(result[0].facets.map((f) => f.value)).toEqual([
        'scalar-context',
        'sigils',
        'dbi-transactions',
      ]);
    });
  });
});
