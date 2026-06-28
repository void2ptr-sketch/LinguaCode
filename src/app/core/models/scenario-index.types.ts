import type { PageResponse } from '../../shared/pagination';

import type { ContentLanguage } from './card-index.types';
import type { ScenarioCardSourceMode } from './scenario-card-source.types';

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

export type ScenarioListScope = 'mine' | 'all' | 'published';

export type ScenarioSearchCriteria = {
  query?: string;
  authorId?: string;
  scope?: ScenarioListScope;
  cardSourceMode?: ScenarioCardSourceMode;
  knownLanguage?: ContentLanguage;
  learningLanguage?: ContentLanguage;
  courseId?: string;
  page: import('../../shared/pagination').PageRequest;
};

export type ScenarioSearchPage = PageResponse<ScenarioIndexEntry>;
