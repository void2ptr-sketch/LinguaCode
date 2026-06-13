import type { PageRequest, PageResponse } from '../../shared/pagination';

import type { CardDifficulty, CardIndexEntry, ContentLanguage } from './card-index.types';
import type { CardKind } from './card.types';

export type CardSearchCriteria = {
  query?: string;
  knownLanguage?: ContentLanguage;
  learningLanguage?: ContentLanguage;
  difficulty?: CardDifficulty;
  kinds?: readonly CardKind[];
  tags?: readonly string[];
  page: PageRequest;
};

export type FacetCount<T extends string> = {
  value: T;
  count: number;
};

export type CardSearchFacets = {
  knownLanguages: readonly FacetCount<ContentLanguage>[];
  learningLanguages: readonly FacetCount<ContentLanguage>[];
  difficulties: readonly FacetCount<CardDifficulty>[];
  kinds: readonly FacetCount<CardKind>[];
  tags: readonly FacetCount<string>[];
};

export type CardSearchResult = {
  entries: readonly CardIndexEntry[];
  facets: CardSearchFacets;
};

export type CardSearchPage = PageResponse<CardIndexEntry> & {
  facets: CardSearchFacets;
};

export type {
  ScenarioCardSort,
  ScenarioCardSource,
  ScenarioCardSourceMode,
} from './scenario-card-source.types';
