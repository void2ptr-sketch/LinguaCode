import type {
  CardDifficulty,
  CardIndexEntry,
  CardKind,
  CardSearchCriteria,
  CardSearchFacets,
  ContentLanguage,
  FacetCount,
} from '../model';
import { normalizeIpa } from '../../phonetic/lib/ipa/ipa-normalize.utils';

export type CardSearchFilterField =
  | 'query'
  | 'knownLanguage'
  | 'learningLanguage'
  | 'difficulty'
  | 'kinds'
  | 'tags'
  | 'courseId'
  | 'lessonId'
  | 'scenarioId';

/** Extracts filters from search criteria, stripping pagination (`page`). */
export function toSearchFilters(criteria: CardSearchCriteria): Omit<CardSearchCriteria, 'page'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { page, ...filters } = criteria;
  return filters;
}

function matchesSearchQuery(entry: CardIndexEntry, rawQuery: string): boolean {
  const query = rawQuery.trim();
  if (!query) return true;

  const queryLower = query.toLowerCase();
  const textHaystack = `${entry.title} ${entry.tags.join(' ')}`.toLowerCase();
  if (textHaystack.includes(queryLower)) return true;

  const queryIpa = normalizeIpa(query);
  if (!queryIpa) return false;

  return entry.ipaReadings.some((reading) => normalizeIpa(reading).includes(queryIpa));
}

/**
 * Checks whether a card index entry matches the given search filters.
 * Supports ignoring one field (for facet calculation) via `ignore`.
 */
export function matchesCardIndexEntry(
  entry: CardIndexEntry,
  filters: Omit<CardSearchCriteria, 'page'>,
  ignore?: CardSearchFilterField,
): boolean {
  if (ignore !== 'query' && filters.query?.trim()) {
    if (!matchesSearchQuery(entry, filters.query)) return false;
  }
  if (
    ignore !== 'knownLanguage' &&
    filters.knownLanguage &&
    entry.knownLanguage !== filters.knownLanguage
  )
    return false;
  if (
    ignore !== 'learningLanguage' &&
    filters.learningLanguage &&
    entry.learningLanguage !== filters.learningLanguage
  )
    return false;
  if (ignore !== 'difficulty' && filters.difficulty && entry.difficulty !== filters.difficulty)
    return false;
  if (ignore !== 'kinds' && filters.kinds?.length && !filters.kinds.includes(entry.kind))
    return false;
  if (ignore !== 'tags' && filters.tags?.length) {
    const hasAllTags = filters.tags.every((tag) => entry.tags.includes(tag));
    if (!hasAllTags) return false;
  }
  if (ignore !== 'courseId' && filters.courseId && entry.courseId !== filters.courseId)
    return false;
  if (ignore !== 'lessonId' && filters.lessonId && entry.lessonId !== filters.lessonId)
    return false;
  if (ignore !== 'scenarioId' && filters.scenarioId && entry.scenarioId !== filters.scenarioId)
    return false;

  return true;
}

/** Facet count for a tag: considers all selected tags except the one being counted. */
export function matchesTagFacetEntry(
  entry: CardIndexEntry,
  filters: Omit<CardSearchCriteria, 'page'>,
  tag: string,
): boolean {
  if (!entry.tags.includes(tag)) return false;
  const otherSelectedTags = filters.tags?.filter((selectedTag) => selectedTag !== tag) ?? [];
  if (otherSelectedTags.length > 0) {
    const hasAllOtherTags = otherSelectedTags.every((selectedTag) =>
      entry.tags.includes(selectedTag),
    );
    if (!hasAllOtherTags) return false;
  }
  return matchesCardIndexEntry(entry, filters, 'tags');
}

/** Filters card index entries according to the given search criteria. */
export function filterCardIndex(
  entries: readonly CardIndexEntry[],
  criteria: CardSearchCriteria,
): readonly CardIndexEntry[] {
  const filters = toSearchFilters(criteria);
  return entries.filter((entry) => matchesCardIndexEntry(entry, filters));
}

function countFacetValues<T extends string>(
  entries: readonly CardIndexEntry[],
  filters: Omit<CardSearchCriteria, 'page'>,
  ignore: CardSearchFilterField,
  values: readonly T[],
  pickValue: (entry: CardIndexEntry) => T,
): readonly FacetCount<T>[] {
  return values
    .map((value) => ({
      value,
      count: entries.filter(
        (entry) => pickValue(entry) === value && matchesCardIndexEntry(entry, filters, ignore),
      ).length,
    }))
    .filter((facet) => facet.count > 0);
}

function collectTags(entries: readonly CardIndexEntry[]): readonly string[] {
  const tags = new Set<string>();
  for (const entry of entries) {
    for (const tag of entry.tags) {
      tags.add(tag);
    }
  }
  return [...tags].sort((left, right) => left.localeCompare(right, 'ru'));
}

/**
 * Builds search facets (facet counts) for card index entries.
 *
 * @param entries - Card index entries to analyze.
 * @param criteria - Current search criteria.
 * @param options - Optional catalog data. When omitted, facets still work
 *                  but language facets won't be filtered to valid codes.
 */
export function buildCardSearchFacets(
  entries: readonly CardIndexEntry[],
  criteria: CardSearchCriteria,
  options?: {
    /** Valid content language codes from backend (used for language facet counts). */
    languageCodes?: readonly string[];
    /** Valid card difficulty values from backend. */
    difficulties?: readonly CardDifficulty[];
    /** Valid card kind values from backend. */
    kinds?: readonly CardKind[];
  },
): CardSearchFacets {
  const filters = toSearchFilters(criteria);
  const tagValues = collectTags(entries);
  const languageCodes = options?.languageCodes ?? [];

  return {
    knownLanguages: countFacetValues(
      entries,
      filters,
      'knownLanguage',
      languageCodes as unknown as readonly ContentLanguage[],
      (e) => e.knownLanguage,
    ) as CardSearchFacets['knownLanguages'],
    learningLanguages: countFacetValues(
      entries,
      filters,
      'learningLanguage',
      languageCodes as unknown as readonly ContentLanguage[],
      (e) => e.learningLanguage,
    ) as CardSearchFacets['learningLanguages'],
    difficulties: countFacetValues(
      entries,
      filters,
      'difficulty',
      options?.difficulties ?? ([] as readonly CardDifficulty[]),
      (e) => e.difficulty,
    ),
    kinds: countFacetValues(
      entries,
      filters,
      'kinds',
      options?.kinds ?? ([] as readonly CardKind[]),
      (e) => e.kind,
    ),
    tags: tagValues
      .map((tag) => ({
        value: tag,
        count: entries.filter((entry) => matchesTagFacetEntry(entry, filters, tag)).length,
      }))
      .filter((facet) => facet.count > 0),
  };
}
