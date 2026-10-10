import type { PageResponse } from '../../shared/utils/pagination';

import type { ContentLanguage } from './card-index.types';
import type { ScenarioCardSourceMode } from './scenario-card-source.types';

/**
 * Lightweight catalog entry for a scenario.
 *
 * @remarks
 * Used in scenario lists, filters, and search results. Does not include full scenario payload.
 */
export type ScenarioIndexEntry = {
  id: string;
  title: string;
  authorId: string;
  cardSourceMode: ScenarioCardSourceMode;
  cardSourceSummary: string;
  published: boolean;
  updatedAt: string;
  languagePairSummary?: string;
  courseId?: string;
};

/**
 * Scope filter for scenario listing.
 *
 * @remarks
 * Determines which set of scenarios is shown in the catalog:
 * - 'mine' — only scenarios authored by the current user
 * - 'all' — all scenarios (including drafts)
 * - 'published' — only published scenarios
 */
export type ScenarioListScope = 'mine' | 'all' | 'published';

/**
 * Criteria for searching scenarios in the catalog.
 *
 * @remarks
 * Used by `ScenarioSearchService` to query the scenario catalog with filters
 * and pagination. All fields are optional except `page`.
 */
export type ScenarioSearchCriteria = {
  /** Free-text search query. */
  query?: string;
  /** Filter by author ID. */
  authorId?: string;
  /** Scope filter (mine, all, or published). */
  scope?: ScenarioListScope;
  /** Filter by card source mode (fixed or criteria-based). */
  cardSourceMode?: ScenarioCardSourceMode;
  /** Filter by known (source) language. */
  knownLanguage?: ContentLanguage;
  /** Filter by learning (target) language. */
  learningLanguage?: ContentLanguage;
  /** Filter by course ID (scenarios within a specific course). */
  courseId?: string;
  /** Pagination parameters. */
  page: import('../../shared/utils/pagination').PageRequest;
};

/** Paginated search results for scenario catalog. */
export type ScenarioSearchPage = PageResponse<ScenarioIndexEntry>;
