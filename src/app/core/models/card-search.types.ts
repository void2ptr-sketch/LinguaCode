import type { PageRequest, PageResponse } from './pagination.types';

import type { CardDifficulty, CardIndexEntry, ContentLanguage } from './card-index.types';
import type { CardKind } from './card.types';

/**
 * Search criteria for filtering cards in the catalog.
 *
 * @remarks
 * Used by `CardSearchService` and `CardsApiService` to build paginated queries.
 */
export type CardSearchCriteria = {
  /** Free-text search query. */
  query?: string;
  /** Filter by known (source) language. */
  knownLanguage?: ContentLanguage;
  /** Filter by learning (target) language. */
  learningLanguage?: ContentLanguage;
  /** Filter by difficulty level (beginner / intermediate / advanced). */
  difficulty?: CardDifficulty;
  /** Filter by card kinds (e.g. select, memory, keyboard). */
  kinds?: readonly CardKind[];
  /** Filter by catalog tags (e.g. theme, subtopic). */
  tags?: readonly string[];
  /** Filter by course ID. */
  courseId?: string;
  /** Filter by lesson ID. */
  lessonId?: string;
  /** Filter by scenario ID. */
  scenarioId?: string;
  /** Pagination parameters. */
  page: PageRequest;
};

/**
 * A single facet count entry for a string-valued field.
 *
 * @typeParam T - The string value of the facet (e.g. a language code, card kind, or tag).
 */
export type FacetCount<T extends string> = {
  /** The facet value. */
  value: T;
  /** Number of cards matching this facet value. */
  count: number;
};

/**
 * Aggregated facet counts for card search results.
 *
 * @remarks
 * Used to populate filter sidebar options (known languages, learning languages, difficulties, kinds, tags).
 */
export type CardSearchFacets = {
  knownLanguages: readonly FacetCount<ContentLanguage>[];
  learningLanguages: readonly FacetCount<ContentLanguage>[];
  difficulties: readonly FacetCount<CardDifficulty>[];
  kinds: readonly FacetCount<CardKind>[];
  tags: readonly FacetCount<string>[];
};

/**
 * Full search result containing indexed entries and facet counts.
 *
 * @remarks
 * Used by the card catalog search page to display results and filter options.
 */
export type CardSearchResult = {
  /** Matching card index entries. */
  entries: readonly CardIndexEntry[];
  /** Facet counts for filter sidebar. */
  facets: CardSearchFacets;
};

/**
 * Paginated card search response with facet counts.
 *
 * @remarks
 * Extends `PageResponse<CardIndexEntry>` with additional `facets` field.
 */
export type CardSearchPage = PageResponse<CardIndexEntry> & {
  facets: CardSearchFacets;
};

export type {
  ScenarioCardSort,
  ScenarioCardSource,
  ScenarioCardSourceMode,
} from './scenario-card-source.types';
