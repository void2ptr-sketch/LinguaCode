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

/** Scope filter for scenario listing. */
export type ScenarioListScope = 'mine' | 'all' | 'published';

/** Criteria for searching scenarios in the catalog. */
export type ScenarioSearchCriteria = {
  query?: string;
  authorId?: string;
  scope?: ScenarioListScope;
  cardSourceMode?: ScenarioCardSourceMode;
  knownLanguage?: ContentLanguage;
  learningLanguage?: ContentLanguage;
  courseId?: string;
  page: import('../../shared/utils/pagination').PageRequest;
};

/** Paginated search results for scenario catalog. */
export type ScenarioSearchPage = PageResponse<ScenarioIndexEntry>;
