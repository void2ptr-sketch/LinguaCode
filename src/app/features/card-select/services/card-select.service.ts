import { Injectable, inject } from '@angular/core';

import {
  CardSearchService,
  CardsApiService,
  resolveScenarioCardIds,
  ScenarioSearchService,
} from '../../../core/data';
import { Card } from '../../../core/models';

export type CardSelectSession = {
  scenarioId: string;
  scenarioTitle: string;
  scenarioSourceLabel: string;
  cards: readonly Card[];
  missingCardIds: readonly string[];
};

@Injectable({ providedIn: 'root' })
export class CardSelectService {
  private readonly cardsApiService = inject(CardsApiService);
  private readonly cardSearchService = inject(CardSearchService);
  private readonly scenarioSearchService = inject(ScenarioSearchService);

  searchScenarios(query: string, pageIndex: number, pageSize: number) {
    return this.scenarioSearchService.search({
      query: query.trim() || undefined,
      scope: 'published',
      page: { page: pageIndex, pageSize },
    });
  }

  async loadScenario(scenarioId: string): Promise<CardSelectSession> {
    const scenario = await this.scenarioSearchService.getById(scenarioId);
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
