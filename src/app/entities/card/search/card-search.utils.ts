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

const CONTENT_LANGUAGES: readonly ContentLanguage[] = [
  'en', 'zh', 'ru', 'ja', 'de', 'fr', 'es', 'ko', 'ar', 'pt', 'it',
  'nl', 'pl', 'tr', 'cs', 'sv', 'da', 'fi', 'no', 'hu', 'he', 'th',
  'vi', 'uk', 'lt', 'lv', 'ee', 'ro', 'bg', 'hr', 'sk', 'sl', 'ca',
  'gl', 'eu', 'id', 'ms', 'tl',
  'cpp', 'java', 'perl', 'hs', 'rs', 'js',
];

const DIFFICULTIES: readonly CardDifficulty[] = ['beginner', 'intermediate', 'advanced'];
const CARD_KINDS: readonly CardKind[] = [
  'select', 'code-select', 'memory', 'symbol', 'sound', 'timed',
  'keyboard', 'draw', 'tone', 'reading',
];

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
  if (ignore !== 'knownLanguage' && filters.knownLanguage && entry.knownLanguage !== filters.knownLanguage) return false;
  if (ignore !== 'learningLanguage' && filters.learningLanguage && entry.learningLanguage !== filters.learningLanguage) return false;
  if (ignore !== 'difficulty' && filters.difficulty && entry.difficulty !== filters.difficulty) return false;
  if (ignore !== 'kinds' && filters.kinds?.length && !filters.kinds.includes(entry.kind)) return false;
  if (ignore !== 'tags' && filters.tags?.length) {
    const hasAllTags = filters.tags.every((tag) => entry.tags.includes(tag));
    if (!hasAllTags) return false;
  }
  if (ignore !== 'courseId' && filters.courseId && entry.courseId !== filters.courseId) return false;
  if (ignore !== 'lessonId' && filters.lessonId && entry.lessonId !== filters.lessonId) return false;
  if (ignore !== 'scenarioId' && filters.scenarioId && entry.scenarioId !== filters.scenarioId) return false;

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
    const hasAllOtherTags = otherSelectedTags.every((selectedTag) => entry.tags.includes(selectedTag));
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
 * @param codes - Valid language codes (optional; passes through all when empty).
 */
export function buildCardSearchFacets(
  entries: readonly CardIndexEntry[],
  criteria: CardSearchCriteria,
  codes?: readonly string[],
): CardSearchFacets {
  const filters = toSearchFilters(criteria);
  const tagValues = collectTags(entries);

  return {
    knownLanguages: countFacetValues(entries, filters, 'knownLanguage', codes as unknown as readonly ContentLanguage[], (e) => e.knownLanguage) as CardSearchFacets['knownLanguages'],
    learningLanguages: countFacetValues(entries, filters, 'learningLanguage', codes as unknown as readonly ContentLanguage[], (e) => e.learningLanguage) as CardSearchFacets['learningLanguages'],
    difficulties: countFacetValues(entries, filters, 'difficulty', DIFFICULTIES, (e) => e.difficulty),
    kinds: countFacetValues(entries, filters, 'kinds', CARD_KINDS, (e) => e.kind),
    tags: tagValues
      .map((tag) => ({ value: tag, count: entries.filter((entry) => matchesTagFacetEntry(entry, filters, tag)).length }))
      .filter((facet) => facet.count > 0),
  };
}
