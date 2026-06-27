import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import type {
  Scenario,
  ScenarioIndexEntry,
  ScenarioSearchCriteria,
  ScenarioSearchPage,
} from '../models';
import { paginateArray } from '../../shared/pagination';
import { UserStore } from '../state';

import { scenarioToIndexEntry } from '../data/scenario-index.mapper';
import { filterScenarioIndex } from '../data/scenario-search.utils';
import {
  scenarioUsesCardEntry,
  validateScenarioCardSource,
} from '../data/scenario-card-source.utils';
import { cardIndexMatchesPair, normalizeLanguagePair } from '../data/language-pair.utils';
import { CardsCatalogMockHandler } from './cards-catalog.mock.handler';
import {
  DEFAULT_SCENARIOS,
  loadScenariosFromStorage,
  saveScenariosToStorage,
} from '../data/scenarios-storage';

import type { ScenarioWritePayload } from '../data/scenarios-api.service';

@Injectable({ providedIn: 'root' })
export class ScenariosCatalogMockHandler {
  private readonly cardsHandler = inject(CardsCatalogMockHandler);
  private readonly userStore = inject(UserStore);

  private scenarios: Scenario[] | null = null;

  async search(criteria: ScenarioSearchCriteria): Promise<ScenarioSearchPage> {
    await this.ensureData();

    const filtered = filterScenarioIndex(
      this.scenarios!.map(scenarioToIndexEntry),
      criteria,
      this.userStore.user().id,
    );

    return paginateArray(filtered, criteria.page);
  }

  async getById(scenarioId: string): Promise<Scenario> {
    await this.ensureData();

    const scenario = this.scenarios!.find((item) => item.id === scenarioId);
    if (!scenario) {
      throw notFound('Сценарий не найден');
    }

    return scenario;
  }

  async create(payload: ScenarioWritePayload): Promise<Scenario> {
    await this.ensureData();
    const languagePair = normalizeLanguagePair(payload.languagePair);
    await this.assertValidCardSource(payload.cardSource, languagePair);

    const scenario: Scenario = {
      id: crypto.randomUUID(),
      title: payload.title,
      description: payload.description,
      authorId: this.userStore.user().id,
      cardSource: payload.cardSource,
      published: payload.published,
      updatedAt: new Date().toISOString(),
      languagePair,
    };

    this.scenarios = [...this.scenarios!, scenario];
    this.persist();
    return scenario;
  }

  async update(scenarioId: string, payload: ScenarioWritePayload): Promise<Scenario> {
    await this.ensureData();

    const current = this.scenarios!.find((item) => item.id === scenarioId);
    if (!current) {
      throw notFound('Сценарий не найден');
    }

    this.assertCanEdit(current);
    const languagePair = normalizeLanguagePair(payload.languagePair ?? current.languagePair);
    await this.assertValidCardSource(payload.cardSource, languagePair);

    const updated: Scenario = {
      ...current,
      title: payload.title,
      description: payload.description,
      cardSource: payload.cardSource,
      published: payload.published,
      updatedAt: new Date().toISOString(),
      languagePair,
    };

    this.scenarios = this.scenarios!.map((item) => (item.id === scenarioId ? updated : item));
    this.persist();
    return updated;
  }

  async delete(scenarioId: string): Promise<void> {
    await this.ensureData();

    const current = this.scenarios!.find((item) => item.id === scenarioId);
    if (!current) {
      throw notFound('Сценарий не найден');
    }

    this.assertCanEdit(current);
    this.scenarios = this.scenarios!.filter((item) => item.id !== scenarioId);
    this.persist();
  }

  async findUsingCard(cardId: string): Promise<readonly ScenarioIndexEntry[]> {
    await this.ensureData();
    await this.cardsHandler.ensureIndexForCardLookup();

    const entry = await this.cardsHandler.getIndexEntry(cardId);
    if (!entry) {
      return [];
    }

    return this.scenarios!.filter((scenario) =>
      scenarioUsesCardEntry(scenario.cardSource, entry),
    ).map(scenarioToIndexEntry);
  }

  resetCache(): void {
    this.scenarios = null;
  }

  private async ensureData(): Promise<void> {
    if (this.scenarios) {
      return;
    }

    const migrated = loadScenariosFromStorage();
    this.scenarios = migrated.length > 0 ? [...migrated] : [...DEFAULT_SCENARIOS];
    this.persist();
  }

  private persist(): void {
    saveScenariosToStorage(this.scenarios!);
  }

  private assertCanEdit(scenario: Scenario): void {
    const userId = this.userStore.user().id;
    if (scenario.authorId !== userId) {
      throw forbidden('Нельзя изменять чужой сценарий');
    }
  }

  private async assertValidCardSource(
    source: Scenario['cardSource'],
    languagePair?: import('../models').LanguagePair,
  ): Promise<void> {
    const error = await validateScenarioCardSource(source, async (cardId) => {
      try {
        await this.cardsHandler.getById(cardId);
        return true;
      } catch {
        return false;
      }
    });

    if (error) {
      throw badRequest(error.message);
    }

    if (!languagePair) {
      return;
    }

    if (source.mode === 'fixed' || source.mode === 'snapshot') {
      for (const cardId of source.cardIds) {
        const entry = await this.cardsHandler.getIndexEntry(cardId);
        if (entry && !cardIndexMatchesPair(entry, languagePair)) {
          throw badRequest(`Карточка ${cardId} не соответствует курсу сценария`);
        }
      }
    }
  }
}

function notFound(message: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 404,
    statusText: 'Not Found',
    error: { message },
  });
}

function forbidden(message: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 403,
    statusText: 'Forbidden',
    error: { message },
  });
}

function badRequest(message: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 400,
    statusText: 'Bad Request',
    error: { message },
  });
}
