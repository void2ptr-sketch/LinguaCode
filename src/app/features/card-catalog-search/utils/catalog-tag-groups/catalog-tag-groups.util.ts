import type { FacetCount } from '../../../../core/models/card-search.types';

/**
 * Ordered list of catalog tag theme IDs.
 *
 * @remarks
 * Defines the display order for theme facets in the card catalog filter sidebar.
 * Based on the "Course Idea" structure for Perl interview content.
 */
export const CATALOG_TAG_THEME_ORDER = [
  'intro',
  'basics',
  'modern-perl',
  'tools',
  'architecture-legacy',
  'practice',
  'oop',
] as const;

/**
 * Ordered list of catalog tag subtopic IDs.
 *
 * @remarks
 * Defines the display order for subtopic facets in the card catalog filter sidebar.
 * Derived from course scenario structure for Perl interview content.
 */
export const CATALOG_TAG_SUBTOPIC_ORDER = [
  'scalar-context',
  'array-scalar',
  'sigils',
  'undef',
  'use-strict',
  'use-warnings',
  'my-our',
  'feature-say',
  'regex-captures',
  'regex-modifiers',
  'match-operators',
  'qr-compile',
  'sub-args',
  'map-grep',
  'spaceship',
  'sort',
  'use-require',
  'bless-oop',
  'file-io',
  'red-flags',
  'dbi-dbd',
  'dbi-placeholders',
  'dbi-prepare-execute',
  'dbi-transactions',
  'dbi-errors',
  'cgi-module',
  'cgi-params',
  'cgi-binmode',
  'cgi-headers',
  'cgi-legacy',
  'oracle',
  'oracle-dsn',
  'oracle-placeholders',
  'oracle-connect',
  'oracle-plsql',
  'oracle-lob',
] as const;

const ORDERED_CATALOG_TAG_IDS = new Set<string>([
  ...CATALOG_TAG_THEME_ORDER,
  ...CATALOG_TAG_SUBTOPIC_ORDER,
]);

/**
 * A grouped set of catalog tag facets with a display label.
 *
 * @remarks
 * Used to organize tag facets into themed sections (Themes, Subtopics, Other Tags).
 *
 * @example
 * ```ts
 * // Result from groupCatalogTagFacets:
 * // [
 * //   { label: 'Темы', facets: [...] },
 * //   { label: 'Подтемы', facets: [...] },
 * //   { label: 'Теги', facets: [...] }
 * // ]
 * ```
 */
export type CatalogTagFacetGroup = {
  /**
   * Display label for the group.
   *
   * @remarks
   * Common values are "Темы" (Themes), "Подтемы" (Subtopics), and "Теги" (Tags).
   */
  label: string;
  /**
   * Facet counts belonging to this group.
   *
   * @remarks
   * Each facet contains a tag value and its count in the current search results.
   */
  facets: readonly FacetCount<string>[];
};

function pickOrderedFacets(
  facetsByValue: ReadonlyMap<string, FacetCount<string>>,
  order: readonly string[],
): readonly FacetCount<string>[] {
  return order
    .map((value) => facetsByValue.get(value))
    .filter((facet): facet is FacetCount<string> => facet !== undefined && facet.count > 0);
}

/**
 * Groups catalog tag facets into themed sections.
 *
 * @param tags - Array of tag facet counts from card search results.
 * @returns An array of `CatalogTagFacetGroup` objects ordered by theme → subtopic → other.
 *
 * @remarks
 * Tags matching `CATALOG_TAG_THEME_ORDER` are grouped as "Темы",
 * tags matching `CATALOG_TAG_SUBTOPIC_ORDER` as "Подтемы",
 * and all remaining tags as "Теги" (sorted alphabetically).
 */
export function groupCatalogTagFacets(
  tags: readonly FacetCount<string>[],
): readonly CatalogTagFacetGroup[] {
  const facetsByValue = new Map(tags.map((facet) => [facet.value, facet]));
  const groups: CatalogTagFacetGroup[] = [];

  const themes = pickOrderedFacets(facetsByValue, CATALOG_TAG_THEME_ORDER);
  if (themes.length > 0) {
    groups.push({ label: 'Темы', facets: themes });
  }

  const subtopics = pickOrderedFacets(facetsByValue, CATALOG_TAG_SUBTOPIC_ORDER);
  if (subtopics.length > 0) {
    groups.push({ label: 'Подтемы', facets: subtopics });
  }

  const other = tags
    .filter((facet) => !ORDERED_CATALOG_TAG_IDS.has(facet.value))
    .sort((left, right) => left.value.localeCompare(right.value, 'ru'));

  if (other.length > 0) {
    groups.push({ label: 'Теги', facets: other });
  }

  return groups;
}
