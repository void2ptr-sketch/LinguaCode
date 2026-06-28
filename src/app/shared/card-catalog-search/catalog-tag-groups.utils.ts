import type { FacetCount } from '../../core/models/card-search.types';

/** Порядок тегов сложности в фильтре каталога (id без перевода). */
export const CATALOG_TAG_DIFFICULTY_ORDER = [
  'beginner',
  'intermediate',
  'advanced',
] as const;

/** Порядок тем — как в «Идее курса» Perl interview. */
export const CATALOG_TAG_THEME_ORDER = [
  'intro',
  'basics',
  'modern-perl',
  'tools',
  'architecture-legacy',
  'practice',
  'oop',
] as const;

/** Порядок подтем Perl interview (по сценариям курса). */
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
] as const;

const ORDERED_CATALOG_TAG_IDS = new Set<string>([
  ...CATALOG_TAG_DIFFICULTY_ORDER,
  ...CATALOG_TAG_THEME_ORDER,
  ...CATALOG_TAG_SUBTOPIC_ORDER,
]);

export type CatalogTagFacetGroup = {
  label: string;
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

export function groupCatalogTagFacets(
  tags: readonly FacetCount<string>[],
): readonly CatalogTagFacetGroup[] {
  const facetsByValue = new Map(tags.map((facet) => [facet.value, facet]));
  const groups: CatalogTagFacetGroup[] = [];

  const difficulty = pickOrderedFacets(facetsByValue, CATALOG_TAG_DIFFICULTY_ORDER);
  if (difficulty.length > 0) {
    groups.push({ label: 'Уровень сложности', facets: difficulty });
  }

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
    groups.push({ label: 'Другие', facets: other });
  }

  return groups;
}
