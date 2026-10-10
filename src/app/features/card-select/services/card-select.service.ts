import { Injectable, inject } from '@angular/core';

import {
  CardSearchService,
  CardsApiService,
  resolveScenarioCardIds,
  ScenarioSearchService,
} from '../../../core/repositories';
import { activeLanguagePairCriteria } from '../../../core/domain/language-pair/language-pair-scope.utils';
import { scenarioMatchesLanguagePair } from '../../../core/repositories/scenarios/utils/scenario-card-source.utils';
import type { Card, ScenarioSearchPage } from '../../../core/models';
import { UserStore } from '../../../core/state';

/**
 * Represents a card selection session loaded from a scenario.
 *
 * @remarks
 * Includes the scenario metadata, assembled cards, and any missing card IDs
 * that could not be resolved from the card source.
 */
export type CardSelectSession = {
  scenarioId: string;
  scenarioTitle: string;
  scenarioSourceLabel: string;
  cards: readonly Card[];
  missingCardIds: readonly string[];
};

/**
 * Service for loading and managing card selection sessions.
 *
 * @remarks
 * Resolves scenario card sources, fetches cards, and assembles session data.
 * Validates language pair matching and handles missing cards gracefully.
 */
@Injectable({ providedIn: 'root' })
export class CardSelectService {
  private readonly cardsApiService = inject(CardsApiService);
  private readonly cardSearchService = inject(CardSearchService);
  private readonly scenarioSearchService = inject(ScenarioSearchService);
  private readonly userStore = inject(UserStore);

  /**
   * Searches for published scenarios matching the query and active language pair.
   *
   * @param query - Search query string.
   * @param pageIndex - Zero-based page index.
   * @param pageSize - Number of items per page.
   * @returns Promise resolving to the paginated search results containing matching scenarios.
   * @remarks
   * Automatically scopes results to the active language pair from `UserStore`.
   * Empty query strings are treated as undefined (no filter).
   */
  searchScenarios(query: string, pageIndex: number, pageSize: number): Promise<ScenarioSearchPage> {
    const pair = this.userStore.languagePair();

    return this.scenarioSearchService.search({
      query: query.trim() || undefined,
      scope: 'published',
      ...activeLanguagePairCriteria(pair),
      page: { page: pageIndex, pageSize },
    });
  }

  /**
   * Loads a scenario and assembles a card selection session.
   *
   * @param scenarioId - The ID of the scenario to load.
   * @returns A Promise resolving to the card selection session.
   * @throws Error if the scenario's language pair doesn't match or if no cards are found.
   */
  async loadScenario(scenarioId: string): Promise<CardSelectSession> {
    const scenario = await this.scenarioSearchService.getById(scenarioId);
    const pair = this.userStore.languagePair();

    if (!scenarioMatchesLanguagePair(scenario, pair)) {
      throw new Error('SCENARIO_LANGUAGE_PAIR_MISMATCH');
    }
    const cardIds = await resolveScenarioCardIds(scenario.cardSource, this.cardSearchService);
    const cards = await this.cardsApiService.getByIds(cardIds);
    const cardsById = new Map(cards.map((card) => [card.id, card]));
    const sessionCards: Card[] = [];
    const missingCardIds: string[] = [];

    for (const cardId of cardIds) {
      const card = cardsById.get(cardId);
      if (card) {
        sessionCards.push(card);
      } else {
        missingCardIds.push(cardId);
      }
    }

    if (sessionCards.length === 0) {
      throw new Error('SCENARIO_EMPTY');
    }

    return {
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      scenarioSourceLabel: this.formatSourceLabel(scenario.cardSource),
      cards: sessionCards,
      missingCardIds,
    };
  }

  private formatSourceLabel(source: import('../../../core/models').ScenarioCardSource): string {
    if (source.mode === 'fixed') {
      return `${source.cardIds.length} карточек`;
    }

    if (source.mode === 'snapshot') {
      return `${source.cardIds.length} карточек (snapshot)`;
    }

    return `до ${source.limit ?? 50} по критериям`;
  }
}
