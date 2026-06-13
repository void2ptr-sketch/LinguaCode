import { Injectable, inject } from '@angular/core';
import { CardRepository } from '../../../core/data';
import { Card, Scenario } from '../../../core/models';
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
  private readonly scenarioBuilderService = inject(ScenarioBuilderService);

  listScenarios(): readonly Scenario[] {
    return this.scenarioBuilderService.loadScenarios();
  }

  async loadScenario(scenarioId: string): Promise<CardSelectSession> {
    const cards = await this.cardRepository.ensureLoaded();
    const scenario = this.listScenarios().find((item) => item.id === scenarioId);

    if (!scenario) {
      throw new Error('SCENARIO_NOT_FOUND');
    }

    const cardsById = new Map(cards.map((card) => [card.id, card]));
    const sessionCards: Card[] = [];
    const missingCardIds: string[] = [];

    for (const cardId of scenario.cardIds) {
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
