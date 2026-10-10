import type {
  CardDifficulty,
  CardIndexEntry,
  CardKind,
  CardSearchCriteria,
  CardSearchFacets,
  FacetCount,
} from '../../../models';
import { normalizeIpa } from '../../ipa/ipa-normalize.utils';
import { contentLanguages } from '../../language-pair/language-pair.utils';

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

const CONTENT_LANGUAGES = contentLanguages();
const DIFFICULTIES: readonly CardDifficulty[] = ['beginner', 'intermediate', 'advanced'];
const CARD_KINDS: readonly CardKind[] = [
  'select',
  'code-select',
  'memory',
  'symbol',
  'sound',
  'timed',
  'keyboard',
  'draw',
  'tone',
  'reading',
];

/**
 * Извлекает фильтры из критериев поиска, отбрасывая пагинацию (`page`).
 * Возвращает объект без поля `page`, готовый для фильтрации.
 */
export function toSearchFilters(criteria: CardSearchCriteria): Omit<CardSearchCriteria, 'page'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { page, ...filters } = criteria;
  return filters;
}

function matchesSearchQuery(entry: CardIndexEntry, rawQuery: string): boolean {
  const query = rawQuery.trim();
  if (!query) {
    return true;
  }

  const queryLower = query.toLowerCase();
  const textHaystack = `${entry.title} ${entry.tags.join(' ')}`.toLowerCase();
  if (textHaystack.includes(queryLower)) {
    return true;
  }

  const queryIpa = normalizeIpa(query);
  if (!queryIpa) {
    return false;
  }

  return entry.ipaReadings.some((reading) => normalizeIpa(reading).includes(queryIpa));
}

/**
 * Проверяет, соответствует ли запись индекса заданным фильтрам поиска.
 * Поддерживает игнорирование одного поля (для расчёта фасетов) через параметр `ignore`.
 */
export function matchesCardIndexEntry(
  entry: CardIndexEntry,
  filters: Omit<CardSearchCriteria, 'page'>,
  ignore?: CardSearchFilterField,
): boolean {
  if (ignore !== 'query' && filters.query?.trim()) {
    if (!matchesSearchQuery(entry, filters.query)) {
      return false;
    }
  }

  if (
    ignore !== 'knownLanguage' &&
    filters.knownLanguage &&
    entry.knownLanguage !== filters.knownLanguage
  ) {
    return false;
  }

  if (
    ignore !== 'learningLanguage' &&
    filters.learningLanguage &&
    entry.learningLanguage !== filters.learningLanguage
  ) {
    return false;
  }

  if (ignore !== 'difficulty' && filters.difficulty && entry.difficulty !== filters.difficulty) {
    return false;
  }

  if (ignore !== 'kinds' && filters.kinds?.length && !filters.kinds.includes(entry.kind)) {
    return false;
  }

  if (ignore !== 'tags' && filters.tags?.length) {
    const hasAllTags = filters.tags.every((tag) => entry.tags.includes(tag));
    if (!hasAllTags) {
      return false;
    }
  }

  if (ignore !== 'courseId' && filters.courseId && entry.courseId !== filters.courseId) {
    return false;
  }

  if (ignore !== 'lessonId' && filters.lessonId && entry.lessonId !== filters.lessonId) {
    return false;
  }

  if (ignore !== 'scenarioId' && filters.scenarioId && entry.scenarioId !== filters.scenarioId) {
    return false;
  }

  return true;
}

/** Подсчёт facet для тега: учитывает все выбранные теги, кроме считаемого. */
export function matchesTagFacetEntry(
  entry: CardIndexEntry,
  filters: Omit<CardSearchCriteria, 'page'>,
  tag: string,
): boolean {
  if (!entry.tags.includes(tag)) {
    return false;
  }

  const otherSelectedTags = filters.tags?.filter((selectedTag) => selectedTag !== tag) ?? [];
  if (otherSelectedTags.length > 0) {
    const hasAllOtherTags = otherSelectedTags.every((selectedTag) =>
      entry.tags.includes(selectedTag),
    );
    if (!hasAllOtherTags) {
      return false;
    }
  }

  return matchesCardIndexEntry(entry, filters, 'tags');
}

/**
 * Filters card index entries according to the given search criteria.
 *
 * @remarks
 * Strips pagination from the criteria and delegates to `matchesCardIndexEntry`.
 *
 * @param entries - The card index entries to filter.
 * @param criteria - The search criteria including pagination.
 * @returns The filtered list of card index entries.
 */
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
 * @remarks
 * Computes counts for known languages, learning languages, difficulties, kinds, and tags.
 * Each facet excludes its own value from the count (to support multi-select filtering).
 *
 * @param entries - The card index entries to analyze.
 * @param criteria - The current search criteria (excluding pagination).
 * @returns A `CardSearchFacets` object with facet counts for each field.
 */
export function buildCardSearchFacets(
  entries: readonly CardIndexEntry[],
  criteria: CardSearchCriteria,
): CardSearchFacets {
  const filters = toSearchFilters(criteria);
  const tagValues = collectTags(entries);

  return {
    knownLanguages: countFacetValues(
      entries,
      filters,
      'knownLanguage',
      CONTENT_LANGUAGES,
      (entry) => entry.knownLanguage,
    ),
    learningLanguages: countFacetValues(
      entries,
      filters,
      'learningLanguage',
      CONTENT_LANGUAGES,
      (entry) => entry.learningLanguage,
    ),
    difficulties: countFacetValues(
      entries,
      filters,
      'difficulty',
      DIFFICULTIES,
      (entry) => entry.difficulty,
    ),
    kinds: countFacetValues(entries, filters, 'kinds', CARD_KINDS, (entry) => entry.kind),
    tags: tagValues
      .map((tag) => ({
        value: tag,
        count: entries.filter((entry) => matchesTagFacetEntry(entry, filters, tag)).length,
      }))
      .filter((facet) => facet.count > 0),
  };
}
