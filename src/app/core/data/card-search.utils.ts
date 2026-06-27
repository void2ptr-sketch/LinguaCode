import type {
  CardDifficulty,
  CardIndexEntry,
  CardKind,
  CardSearchCriteria,
  CardSearchFacets,
  FacetCount,
} from '../models';
import { normalizeIpa } from './ipa-normalize.utils';
import { contentLanguages } from './language-pair.utils';

export type CardSearchFilterField =
  | 'query'
  | 'knownLanguage'
  | 'learningLanguage'
  | 'difficulty'
  | 'kinds'
  | 'tags';

const CONTENT_LANGUAGES = contentLanguages();
const DIFFICULTIES: readonly CardDifficulty[] = ['beginner', 'intermediate', 'advanced'];
const CARD_KINDS: readonly CardKind[] = [
  'select',
  'memory',
  'symbol',
  'sound',
  'timed',
  'keyboard',
  'draw',
  'tone',
  'reading',
];

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

  return true;
}

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
        count: entries.filter(
          (entry) => entry.tags.includes(tag) && matchesCardIndexEntry(entry, filters, 'tags'),
        ).length,
      }))
      .filter((facet) => facet.count > 0),
  };
}
