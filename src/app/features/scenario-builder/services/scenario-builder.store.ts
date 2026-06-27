import { Injectable, computed, inject, signal } from '@angular/core';

import {
  DEFAULT_CRITERIA_LIMIT,
  buildSnapshotCardSource,
  hasCardSearchFilters,
  resolveScenarioCardIds,
  validateScenarioCardSource,
} from '../../../core/data/scenario-card-source.utils';
import {
  cardIndexMatchesPair,
  normalizeLanguagePair,
} from '../../../core/data/language-pair.utils';
import { activeLanguagePairCriteria } from '../../../core/data/language-pair-scope.utils';
import { CardSearchService, ScenarioSearchService } from '../../../core/data';
import { CardsCatalogMockHandler } from '../../../core/api/cards-catalog.mock.handler';
import type {
  Scenario,
  ScenarioCardSource,
  ScenarioIndexEntry,
  ScenarioListScope,
} from '../../../core/models';
import { sanitizePlainText } from '../../../core/security';
import { UserStore } from '../../../core/state';
import { DEFAULT_PAGE_SIZE } from '../../../shared/pagination';
import { ScenarioDraft, ScenarioEditorMode } from '../types';

const sanitizeTitle = (value: string): string => sanitizePlainText(value, 128);
const sanitizeDescription = (value: string): string => sanitizePlainText(value, 512);

@Injectable({ providedIn: 'root' })
export class ScenarioBuilderStore {
  private readonly scenarioSearchService = inject(ScenarioSearchService);
  private readonly cardSearchService = inject(CardSearchService);
  private readonly cardsCatalogHandler = inject(CardsCatalogMockHandler);
  private readonly userStore = inject(UserStore);

  readonly indexItems = signal<readonly ScenarioIndexEntry[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly listQuery = signal('');
  readonly listScope = signal<ScenarioListScope>('mine');

  readonly loading = signal(false);
  readonly editorLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly editorMode = signal<ScenarioEditorMode>('list');
  readonly editingScenarioId = signal<string | null>(null);
  readonly editingScenario = signal<Scenario | null>(null);

  readonly isReadOnly = computed(() => {
    const scenario = this.editingScenario();
    if (!scenario) {
      return false;
    }

    return scenario.authorId !== this.userStore.user().id;
  });

  async loadList(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const pair = this.userStore.languagePair();
      const page = await this.scenarioSearchService.search({
        query: this.listQuery().trim() || undefined,
        scope: this.listScope(),
        ...activeLanguagePairCriteria(pair),
        page: { page: this.pageIndex(), pageSize: this.pageSize() },
      });

      this.indexItems.set(page.items);
      this.totalItems.set(page.totalItems);
    } catch {
      this.error.set('Не удалось загрузить список сценариев');
    } finally {
      this.loading.set(false);
    }
  }

  async load(): Promise<void> {
    await this.loadList();
  }

  setListQuery(query: string): void {
    this.listQuery.set(query);
    this.pageIndex.set(0);
  }

  setListScope(scope: ScenarioListScope): void {
    this.listScope.set(scope);
    this.pageIndex.set(0);
  }

  setPage(pageIndex: number, pageSize: number): void {
    this.pageIndex.set(pageIndex);
    this.pageSize.set(pageSize);
  }

  startCreate(): void {
    this.editorMode.set('create');
    this.editingScenarioId.set(null);
    this.editingScenario.set(null);
    this.error.set(null);
  }

  async startEdit(scenarioId: string): Promise<void> {
    this.editorLoading.set(true);
    this.error.set(null);

    try {
      const scenario = await this.scenarioSearchService.getById(scenarioId);
      this.editorMode.set('edit');
      this.editingScenarioId.set(scenarioId);
      this.editingScenario.set(scenario);
    } catch {
      this.error.set('Не удалось загрузить сценарий');
    } finally {
      this.editorLoading.set(false);
    }
  }

  cancelEdit(): void {
    this.editorMode.set('list');
    this.editingScenarioId.set(null);
    this.editingScenario.set(null);
    this.error.set(null);
  }

  async createScenario(draft: ScenarioDraft): Promise<boolean> {
    const payload = await this.normalizeDraft(draft);
    if (!payload) {
      return false;
    }

    try {
      await this.scenarioSearchService.create(payload);
      this.cancelEdit();
      await this.loadList();
      return true;
    } catch {
      this.error.set('Не удалось создать сценарий');
      return false;
    }
  }

  async updateScenario(scenarioId: string, draft: ScenarioDraft): Promise<boolean> {
    if (this.isReadOnly()) {
      this.error.set('Нельзя изменять чужой сценарий');
      return false;
    }

    const payload = await this.normalizeDraft(draft);
    if (!payload) {
      return false;
    }

    try {
      await this.scenarioSearchService.update(scenarioId, payload);
      this.cancelEdit();
      await this.loadList();
      return true;
    } catch {
      this.error.set('Не удалось сохранить сценарий');
      return false;
    }
  }

  async deleteScenario(scenarioId: string): Promise<void> {
    const item = this.indexItems().find((scenario) => scenario.id === scenarioId);
    if (item && item.authorId !== this.userStore.user().id) {
      this.error.set('Нельзя удалять чужой сценарий');
      return;
    }

    try {
      await this.scenarioSearchService.delete(scenarioId);
      if (this.editingScenarioId() === scenarioId) {
        this.cancelEdit();
      }
      await this.loadList();
    } catch {
      this.error.set('Не удалось удалить сценарий');
    }
  }

  async cardTitle(cardId: string): Promise<string> {
    try {
      const card = await this.cardSearchService.getCardById(cardId);
      return card.title;
    } catch {
      return cardId;
    }
  }

  async validateFixedCardIds(cardIds: readonly string[]): Promise<readonly string[]> {
    const valid: string[] = [];

    for (const cardId of cardIds) {
      try {
        await this.cardSearchService.getCardById(cardId);
        valid.push(cardId);
      } catch {
        // skip missing
      }
    }

    return valid;
  }

  async buildSnapshotFromCriteria(
    criteria: Omit<import('../../../core/models').CardSearchCriteria, 'page'>,
    limit: number,
    sort?: import('../../../core/models').ScenarioCardSort,
    seed?: string,
  ): Promise<ScenarioCardSource | null> {
    if (!hasCardSearchFilters(criteria)) {
      this.error.set('Укажите критерии перед созданием snapshot');
      return null;
    }

    const cardIds = await resolveScenarioCardIds(
      { mode: 'criteria', criteria, limit, sort, seed },
      this.cardSearchService,
    );

    if (cardIds.length === 0) {
      this.error.set('По критериям не найдено карточек');
      return null;
    }

    return buildSnapshotCardSource(cardIds, criteria, limit);
  }

  private async normalizeDraft(
    draft: ScenarioDraft,
  ): Promise<import('../../../core/data/scenarios-api.service').ScenarioWritePayload | null> {
    const title = sanitizeTitle(draft.title);
    const description = sanitizeDescription(draft.description);
    const languagePair = normalizeLanguagePair(draft.languagePair);
    const cardSource = await this.normalizeCardSource(draft.cardSource, languagePair);

    if (!title) {
      this.error.set('Укажите название сценария');
      return null;
    }

    if (!cardSource) {
      return null;
    }

    return { title, description, cardSource, published: draft.published, languagePair };
  }

  private async normalizeCardSource(
    source: ScenarioCardSource,
    languagePair: import('../../../core/models').LanguagePair,
  ): Promise<ScenarioCardSource | null> {
    const cardExists = async (cardId: string): Promise<boolean> => {
      try {
        await this.cardSearchService.getCardById(cardId);
        return true;
      } catch {
        return false;
      }
    };

    if (source.mode === 'fixed') {
      const cardIds = [
        ...new Set((await this.validateFixedCardIds(source.cardIds)).filter(Boolean)),
      ];

      const error = await validateScenarioCardSource({ mode: 'fixed', cardIds }, cardExists);

      if (error) {
        this.error.set(error.message);
        return null;
      }

      const pairError = await this.validateCardIdsMatchPair(cardIds, languagePair);
      if (pairError) {
        this.error.set(pairError);
        return null;
      }

      return { mode: 'fixed', cardIds };
    }

    if (source.mode === 'snapshot') {
      const error = await validateScenarioCardSource(source, cardExists);
      if (error) {
        this.error.set(error.message);
        return null;
      }

      const pairError = await this.validateCardIdsMatchPair(source.cardIds, languagePair);
      if (pairError) {
        this.error.set(pairError);
        return null;
      }

      return source;
    }

    const error = await validateScenarioCardSource(source, cardExists);
    if (error) {
      this.error.set(error.message);
      return null;
    }

    return {
      mode: 'criteria',
      criteria: {
        query: source.criteria.query?.trim() || undefined,
        knownLanguage: source.criteria.knownLanguage,
        learningLanguage: source.criteria.learningLanguage,
        difficulty: source.criteria.difficulty,
        kinds: source.criteria.kinds?.length ? source.criteria.kinds : undefined,
        tags: source.criteria.tags?.length ? source.criteria.tags : undefined,
      },
      limit: source.limit ?? DEFAULT_CRITERIA_LIMIT,
      sort: source.sort,
      seed: source.seed,
    };
  }

  private async validateCardIdsMatchPair(
    cardIds: readonly string[],
    languagePair: import('../../../core/models').LanguagePair,
  ): Promise<string | null> {
    for (const cardId of cardIds) {
      const entry = await this.cardsCatalogHandler.getIndexEntry(cardId);
      if (entry && !cardIndexMatchesPair(entry, languagePair)) {
        return `Карточка ${cardId} не соответствует курсу сценария`;
      }
    }

    return null;
  }
}
