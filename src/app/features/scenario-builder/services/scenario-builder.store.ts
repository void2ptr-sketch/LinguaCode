import { Injectable, computed, inject, signal } from '@angular/core';

import {
  DEFAULT_CRITERIA_LIMIT,
  buildSnapshotCardSource,
  hasCardSearchFilters,
  resolveScenarioCardIds,
  validateScenarioCardSource,
} from '../../../core/repositories/scenarios/utils/scenario-card-source.utils';
import {
  cardIndexMatchesPair,
  normalizeLanguagePair,
} from '../../../core/domain/language-pair/language-pair.utils';
import { activeLanguagePairCriteria } from '../../../core/domain/language-pair/language-pair-scope.utils';
import {
  CardSearchService,
  CourseSearchService,
  ScenarioSearchService,
} from '../../../core/repositories';
import { CardsCatalogMockHandler } from '../../../core/api';
import type {
  CourseIndexEntry,
  Scenario,
  ScenarioCardSource,
  ScenarioIndexEntry,
  ScenarioListScope,
} from '../../../core/models';
import { sanitizePlainText } from '../../../core/security';
import { UserStore } from '../../../core/state';
import { isEditableContentAuthor } from '../../../core/domain/user/system-author.constants';
import { DEFAULT_PAGE_SIZE } from '../../../shared/utils/pagination';
import { ScenarioDraft, ScenarioEditorMode } from '../types';

const sanitizeTitle = (value: string): string => sanitizePlainText(value, 128);
const sanitizeDescription = (value: string): string => sanitizePlainText(value, 512);

/**
 * Store for the scenario builder feature.
 *
 * @remarks
 * Manages scenario list state (pagination, filtering, sorting), editor state
 * (create/edit), and card source validation. Uses Angular Signals for reactive state.
 */
@Injectable({ providedIn: 'root' })
export class ScenarioBuilderStore {
  private readonly scenarioSearchService = inject(ScenarioSearchService);
  private readonly cardSearchService = inject(CardSearchService);
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly cardsCatalogHandler = inject(CardsCatalogMockHandler);
  private readonly userStore = inject(UserStore);

  /** Current page of scenario index entries. */
  readonly indexItems = signal<readonly ScenarioIndexEntry[]>([]);
  /** Total number of scenarios matching the current filter. */
  readonly totalItems = signal(0);
  /** Current zero-based page index. */
  readonly pageIndex = signal(0);
  /** Number of items per page. */
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  /** Search query text. */
  readonly listQuery = signal('');
  /** Current list scope (e.g. 'mine', 'all', 'course'). */
  readonly listScope = signal<ScenarioListScope>('mine');
  /** Optional course filter ID. */
  readonly listCourseId = signal<string | null>(null);
  /** Available courses for the current language pair. */
  readonly courses = signal<readonly CourseIndexEntry[]>([]);

  /** Whether the list is being loaded. */
  readonly loading = signal(false);
  /** Whether the editor is loading a scenario. */
  readonly editorLoading = signal(false);
  /** Error message, if any. */
  readonly error = signal<string | null>(null);
  /** Current editor mode ('list', 'create', or 'edit'). */
  readonly editorMode = signal<ScenarioEditorMode>('list');
  /** ID of the scenario currently being edited. */
  readonly editingScenarioId = signal<string | null>(null);
  /** The scenario currently being edited (or null). */
  readonly editingScenario = signal<Scenario | null>(null);

  /** Whether the current scenario is read-only (not authored by the current user). */
  readonly isReadOnly = computed(() => {
    const scenario = this.editingScenario();
    if (!scenario) {
      return false;
    }

    return !isEditableContentAuthor(scenario.authorId, this.userStore.user().id);
  });

  /**
   * Loads the scenario list based on current filters and pagination.
   *
   * @remarks
   * Sets `indexItems` and `totalItems` from the API response.
   * Applies the current query, scope, course filter, and language pair criteria.
   */
  async loadList(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const pair = this.userStore.languagePair();
      const courseId = this.listCourseId();
      const page = await this.scenarioSearchService.search({
        query: this.listQuery().trim() || undefined,
        scope: this.listScope(),
        courseId: courseId ?? undefined,
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

  /**
   * Loads both the scenario list and available courses.
   *
   * @remarks
   * Calls `loadList()` and `loadCourses()` sequentially.
   * Used during component initialization.
   */
  async load(): Promise<void> {
    await this.loadList();
    await this.loadCourses();
  }

  /**
   * Loads available courses for the current language pair.
   *
   * @remarks
   * Fetches up to 100 courses matching the current language pair.
   * On error, sets an empty array (never throws).
   */
  async loadCourses(): Promise<void> {
    try {
      const pair = this.userStore.languagePair();
      const page = await this.courseSearchService.search({
        scope: 'all',
        knownLanguage: pair.known,
        learningLanguage: pair.learning,
        page: { page: 0, pageSize: 100 },
      });
      this.courses.set(page.items);
    } catch {
      this.courses.set([]);
    }
  }

  /**
   * Sets the search query and resets to page 0.
   *
   * @param query - The search query text.
   */
  setListQuery(query: string): void {
    this.listQuery.set(query);
    this.pageIndex.set(0);
  }

  /**
   * Sets the list scope and resets to page 0.
   *
   * @param scope - The new scope ('mine', 'all', or 'course').
   * @remarks
   * Resets `pageIndex` to 0 to show the first page of the new scope.
   */
  setListScope(scope: ScenarioListScope): void {
    this.listScope.set(scope);
    this.pageIndex.set(0);
  }

  /**
   * Sets the course filter and reloads the list.
   *
   * @param courseId - The course ID to filter by, or `null` to remove the filter.
   */
  async setListCourseId(courseId: string | null): Promise<void> {
    this.listCourseId.set(courseId);
    this.pageIndex.set(0);
    await this.loadList();
  }

  /**
   * Sets pagination parameters.
   *
   * @param pageIndex - The new zero-based page index.
   * @param pageSize - The new page size.
   */
  setPage(pageIndex: number, pageSize: number): void {
    this.pageIndex.set(pageIndex);
    this.pageSize.set(pageSize);
  }

  /**
   * Enters create mode for a new scenario.
   *
   * @remarks
   * Resets editor state (mode, editingScenarioId, editingScenario, error).
   */
  startCreate(): void {
    this.editorMode.set('create');
    this.editingScenarioId.set(null);
    this.editingScenario.set(null);
    this.error.set(null);
  }

  /**
   * Enters edit mode and loads the scenario by ID.
   *
   * @param scenarioId - The scenario ID to edit.
   */
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

  /**
   * Exits edit mode and returns to list view.
   *
   * @remarks
   * Resets editor state (mode, editingScenarioId, editingScenario, error).
   */
  cancelEdit(): void {
    this.editorMode.set('list');
    this.editingScenarioId.set(null);
    this.editingScenario.set(null);
    this.error.set(null);
  }

  /**
   * Creates a new scenario from a draft.
   *
   * @param draft - The scenario draft.
   * @returns `true` if created successfully, `false` on validation or API error.
   */
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

  /**
   * Updates an existing scenario from a draft.
   *
   * @param scenarioId - The scenario ID to update.
   * @param draft - The scenario draft.
   * @returns `true` if updated successfully, `false` on validation or API error.
   */
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

  /**
   * Deletes a scenario by ID.
   *
   * @remarks
   * Checks access rights (only the author can delete). If the deleted scenario is currently
   * being edited, cancels the editing state.
   *
   * @param scenarioId - The scenario ID to delete.
   */
  async deleteScenario(scenarioId: string): Promise<void> {
    const item = this.indexItems().find((scenario) => scenario.id === scenarioId);
    if (item && !isEditableContentAuthor(item.authorId, this.userStore.user().id)) {
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

  /**
   * Retrieves the title of a card by its ID.
   *
   * @remarks
   * Falls back to the card ID if the API call fails.
   *
   * @param cardId - The card ID.
   * @returns The card title, or the card ID as fallback.
   */
  async cardTitle(cardId: string): Promise<string> {
    try {
      const card = await this.cardSearchService.getCardById(cardId);
      return card.title;
    } catch {
      return cardId;
    }
  }

  /**
   * Validates that all card IDs in a fixed card source exist.
   *
   * @param cardIds - Array of card IDs to validate.
   * @returns Array of valid card IDs (missing cards are filtered out).
   */
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

  /**
   * Builds a snapshot card source from search criteria.
   *
   * @param criteria - The card search criteria.
   * @param limit - Maximum number of cards to include.
   * @param sort - Optional sort configuration.
   * @param seed - Optional seed for deterministic results.
   * @returns A snapshot card source, or `null` on error.
   */
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

  /**
   * Normalizes and validates a scenario draft.
   *
   * @remarks
   * Sanitizes title, description, and language pair. Normalizes the card source
   * based on its mode (fixed, snapshot, or criteria). Returns null if validation fails.
   *
   * @param draft - The user-provided scenario draft.
   * @returns A ScenarioWritePayload for the API, or null if validation fails.
   * @private
   */
  private async normalizeDraft(
    draft: ScenarioDraft,
  ): Promise<
    | import('../../../core/repositories/scenarios/api/scenarios-api.service').ScenarioWritePayload
    | null
  > {
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

  /**
   * Normalizes the card source based on its mode.
   *
   * @remarks
   * - `fixed`: validates that all card IDs exist and match the language pair.
   * - `snapshot`: validates that all card IDs exist and match the language pair.
   * - `criteria`: trims query and returns the criteria as-is.
   *
   * @param source - The card source to normalize.
   * @param languagePair - The current language pair for validation.
   * @returns A normalized ScenarioCardSource, or null if validation fails.
   * @private
   */
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

  /**
   * Validates that all card IDs match the given language pair.
   *
   * @remarks
   * Checks each card ID against the cards catalog mock handler.
   * Returns an error message if any card doesn't match, or null if all match.
   *
   * @param cardIds - The card IDs to validate.
   * @param languagePair - The expected language pair.
   * @returns An error message if validation fails, or null.
   * @private
   */
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
