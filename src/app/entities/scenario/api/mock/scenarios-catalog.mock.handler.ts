import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import type {
  Scenario,
  ScenarioIndexEntry,
  ScenarioSearchCriteria,
  ScenarioSearchPage,
} from '../../model';
import { paginateArray } from '../../../../shared/utils/pagination';
import { UserStore } from '../../../user/model/user.store';
import { AuthStore } from '../../../auth/services/auth.store';
import { LanguagePairsApiService } from '../../../language-pair/api/language-pairs-api.service';
import type { LanguagePair } from '../../../language-pair/model/language-pair.types';
import type { ContentLanguage } from '../../../card/model';

import { scenarioToIndexEntry } from '../../mapping/scenario-index.mapper';
import { filterScenarioIndex } from '../../search/scenario-search.utils';
import {
  scenarioUsesCardEntry,
  validateScenarioCardSource,
} from '../../utils/scenario-card-source.utils';
import {
  cardIndexMatchesPair,
} from '../../../language-pair/utils/language-pair.utils';
import { isEditableContentAuthor, isSystemAuthor } from '../../../user/lib/system-author.constants';
import { CardsCatalogMockHandler } from '../../../card/api/mock/cards-catalog.mock.handler';
import { ContentSeedRepository } from '../../../content-seed/content-seed.repository';
import { loadScenariosFromStorage, saveScenariosToStorage } from '../../storage/scenarios-storage';

import type { ScenarioWritePayload } from '../../repository/scenario-catalog.port';

@Injectable({ providedIn: 'root' })
export class ScenariosCatalogMockHandler {
  private readonly cardsHandler = inject(CardsCatalogMockHandler);
  private readonly userStore = inject(UserStore);
  private readonly authStore = inject(AuthStore);
  private readonly contentSeed = inject(ContentSeedRepository);
  private readonly languagePairsApi = inject(LanguagePairsApiService);

  /** Cache of numeric pair ID → `{ known, learning }` codes. */
  private pairIdCache: Map<number, LanguagePair> | null = null;

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

  async getByIdBatch(scenarioIds: readonly string[]): Promise<readonly Scenario[]> {
    await this.ensureData();

    const ids = new Set(scenarioIds);
    const results: Scenario[] = [];

    for (const scenario of this.scenarios!) {
      if (ids.has(scenario.id)) {
        results.push(scenario);
      }
    }

    return results;
  }

  async create(payload: ScenarioWritePayload): Promise<Scenario> {
    await this.ensureData();
    const languagePair = await this.resolveLanguagePair(payload.languagePairId);
    await this.assertValidCardSource(payload.cardSource, languagePair);

    const scenario: Scenario = {
      id: crypto.randomUUID(),
      title: payload.title,
      description: payload.description,
      authorId: this.userStore.user().id,
      cardSource: payload.cardSource,
      published: payload.published,
      updatedAt: new Date().toISOString(),
      languagePairId: payload.languagePairId,
      languagePair,
      courseId: payload.courseId ? String(payload.courseId) : undefined,
      programId: payload.programId ? String(payload.programId) : undefined,
      lessonId: payload.lessonId ? String(payload.lessonId) : undefined,
      requiredTier: payload.requiredTier ?? 'FREE',
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
    const languagePairId = payload.languagePairId ?? current.languagePairId;
    const languagePair = await this.resolveLanguagePair(languagePairId);
    await this.assertValidCardSource(payload.cardSource, languagePair);

    const updated: Scenario = isSystemAuthor(current.authorId)
      ? {
          ...current,
          title: payload.title,
          description: payload.description,
          published: payload.published,
          order: payload.order,
          updatedAt: new Date().toISOString(),
        }
      : {
          ...current,
          title: payload.title,
          description: payload.description,
          cardSource: payload.cardSource,
          published: payload.published,
          order: payload.order,
          updatedAt: new Date().toISOString(),
          languagePairId,
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

  /**
   * Finds all scenarios that use the given card as a source.
   *
   * @param cardId - The unique identifier of the card.
   * @returns An array of `ScenarioIndexEntry` for matching scenarios.
   */
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

  /**
   * Resolves a numeric `languagePairId` to a `LanguagePair` code pair
   * using the cached `/language-pairs` endpoint.
   */
  private async resolveLanguagePair(
    languagePairId: number | undefined,
  ): Promise<LanguagePair | undefined> {
    if (languagePairId == null) return undefined;

    if (!this.pairIdCache) {
      try {
        const all = await this.languagePairsApi.listAll();
        this.pairIdCache = new Map(
          all.map((p) => [
            p.id,
            { known: p.knownCode as ContentLanguage, learning: p.learningCode as ContentLanguage },
          ]),
        );
      } catch {
        this.pairIdCache = new Map();
      }
    }

    const result = this.pairIdCache.get(languagePairId);
    return result ?? undefined;
  }

  private async ensureData(): Promise<void> {
    await this.contentSeed.preload();
    this.scenarios = [...loadScenariosFromStorage()];
  }

  private persist(): void {
    saveScenariosToStorage(this.scenarios!);
  }

  private assertCanEdit(scenario: Scenario): void {
    const user = this.authStore.user();
    if (!user || !isEditableContentAuthor(scenario.authorId, user.id, user.roles)) {
      throw forbidden('Нельзя изменять чужой сценарий');
    }
  }

  private async assertValidCardSource(
    source: Scenario['cardSource'],
    languagePair?: import('../../../language-pair/model/language-pair.types').LanguagePair,
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
