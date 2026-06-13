import { Injectable, inject } from '@angular/core';

import { CardRepository, CardSearchService, resolveScenarioCardIds } from '../../../core/data';
import { Card } from '../../../core/models';
import { ScenarioBuilderService } from '../../scenario-builder/services/scenario-builder.service';

export type CardSelectSession = {
  scenarioId: string;
  scenarioTitle: string;
  cards: readonly Card[];
  missingCardIds: readonly string[];
};

@Injectable({ providedIn: 'root' })
export class CardSelectService {
  private readonly cardRepository = inject(CardRepository);
  private readonly cardSearchService = inject(CardSearchService);
  private readonly scenarioBuilderService = inject(ScenarioBuilderService);

  listScenarios() {
    return this.scenarioBuilderService.loadScenarios();
  }

  async loadScenario(scenarioId: string): Promise<CardSelectSession> {
    const cards = await this.cardRepository.ensureLoaded();
    const scenario = this.listScenarios().find((item) => item.id === scenarioId);

    if (!scenario) {
      throw new Error('SCENARIO_NOT_FOUND');
    }

    const cardIds = await resolveScenarioCardIds(scenario.cardSource, this.cardSearchService);
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
      cards: sessionCards,
      missingCardIds,
    };
  }
}
