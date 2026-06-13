import type { CardSearchCriteria, Scenario, ScenarioCardSource } from '../models';
import type { LegacyScenario } from '../models/scenario.types';

import type { CardSearchService } from './card-search.service';

export const DEFAULT_CRITERIA_LIMIT = 50;

export function emptyCardSearchCriteria(): Omit<CardSearchCriteria, 'page'> {
  return {};
}

export function hasCardSearchFilters(criteria: Omit<CardSearchCriteria, 'page'>): boolean {
  return Boolean(
    criteria.query?.trim() ||
      criteria.language ||
      criteria.difficulty ||
      (criteria.kinds?.length ?? 0) > 0 ||
      (criteria.tags?.length ?? 0) > 0,
  );
}

export function scenarioUsesCardId(source: ScenarioCardSource, cardId: string): boolean {
  return source.mode === 'fixed' && source.cardIds.includes(cardId);
}

export function scenarioCardsLabel(source: ScenarioCardSource): string {
  if (source.mode === 'fixed') {
    return `${source.cardIds.length} карточек`;
  }

  return `до ${source.limit ?? DEFAULT_CRITERIA_LIMIT} по критериям`;
}

export function normalizeScenario(raw: LegacyScenario): Scenario {
  if (raw.cardSource) {
    return {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      authorId: raw.authorId,
      cardSource: raw.cardSource,
    };
  }

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    authorId: raw.authorId,
    cardSource: {
      mode: 'fixed',
      cardIds: raw.cardIds ?? [],
    },
  };
}

export async function resolveScenarioCardIds(
  source: ScenarioCardSource,
  cardSearchService: CardSearchService,
): Promise<readonly string[]> {
  if (source.mode === 'fixed') {
    return source.cardIds;
  }

  const limit = source.limit ?? DEFAULT_CRITERIA_LIMIT;
  const page = await cardSearchService.search({
    ...source.criteria,
    page: { page: 0, pageSize: limit },
  });

  return page.items.map((entry) => entry.id);
}
