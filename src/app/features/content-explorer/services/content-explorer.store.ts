/**
 * Store for the content explorer tree (Course → Program → Lesson → Scenario → Card).
 *
 * @remarks
 * Lazy-loading tree: roots are course catalog entries; expanding a node loads
 * its children by existing ID references (`programIds`, `lessons`, `scenarioIds`,
 * `cardSource`) via existing entity services — no new backend endpoints.
 *
 * Each node is a `ExplorerNode` instance holding its own signals, so mutating
 * a node updates only the affected template bindings.
 */
import { Injectable, inject, signal } from '@angular/core';

import { CourseSearchService } from '../../../entities/course/search/course-search.service';
import type { CourseIndexEntry, CourseWithPrograms } from '../../../entities/course/model';
import { ProgramsApiService } from '../../../entities/program/api/programs-api.service';
import type { ProgramWithLessons } from '../../../entities/program/model/program.types';
import type { ProgramIndexEntry } from '../../../entities/program/model/program-search.types';
import { ScenarioSearchService } from '../../../entities/scenario/search/scenario-search.service';
import type { Scenario } from '../../../entities/scenario/model/scenario.types';
import type { ScenarioIndexEntry } from '../../../entities/scenario/model/scenario-index.types';
import type { ScenarioCardSource } from '../../../entities/scenario/model/scenario-card-source.types';
import { CardSearchService } from '../../../entities/card/search/card-search.service';
import type { CardIndexEntry } from '../../../entities/card/model/card-index.types';
import { AuthStore } from '../../../entities/auth/services/auth.store';
import { isEditableContentAuthor } from '../../../entities/user/lib/system-author.constants';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';

import type { ExplorerNodeKind, ExplorerRevealTarget } from '../types/content-explorer.types';

const ROOT_PAGE_SIZE = 100;
/** Page size for entity catalog searches (courses / programs / scenarios). */
const SEARCH_PAGE_SIZE = 100;
/** Max number of per-card fallback lookups when the index cache misses. */
const MAX_CARD_FALLBACK_LOOKUPS = 20;

/** A single node of the content explorer tree. */
export class ExplorerNode {
  /** Node kind — which entity level this node represents. */
  readonly kind: ExplorerNodeKind;
  /** Entity ID. */
  readonly id: string;
  /**
   * Unique registry key of this node: `${kind}:${id}`.
   *
   * @remarks
   * Entity IDs are NOT unique across levels (the backend numbers courses,
   * programs, lessons and scenarios each from 1), so a flat ID map would
   * create parent-chain collisions and infinite breadcrumb loops.
   */
  readonly key: string;
  /** Parent node registry key; `null` for root (course) nodes. */
  readonly parentId: string | null;

  /** Display title (kept in a signal so refreshes re-render). */
  readonly title = signal<string>('');
  /** Secondary line: counts, language pair, status. */
  readonly meta = signal<string>('');

  /** Loaded children; `null` means «not loaded yet». Empty array = leaf. */
  readonly children = signal<readonly ExplorerNode[] | null>(null);
  /** Whether the node is expanded in the tree. */
  readonly expanded = signal(false);
  /** Whether child loading is in progress. */
  readonly loadingChildren = signal(false);
  /** Child loading error message, if any. */
  readonly childError = signal<string | null>(null);

  /** Whether the current user may edit this entity (dialogs enforce too). */
  readonly editable: boolean;
  /** Shared entity: card referenced by multiple scenarios (badge in UI). */
  readonly shared: boolean;
  /** Virtual node: not an entity itself (e.g. «набор по критериям»). */
  readonly virtual: boolean;

  /** Kind-specific payload (ProgramWithLessons / Lesson / Scenario / CardIndexEntry / CourseIndexEntry). */
  data: unknown;

  constructor(params: {
    kind: ExplorerNodeKind;
    id: string;
    parentId: string | null;
    title: string;
    meta?: string;
    editable?: boolean;
    shared?: boolean;
    virtual?: boolean;
    data?: unknown;
  }) {
    this.kind = params.kind;
    this.id = params.id;
    this.key = `${params.kind}:${params.id}`;
    this.parentId = params.parentId;
    this.title.set(params.title);
    this.meta.set(params.meta ?? '');
    this.editable = params.editable ?? true;
    this.shared = params.shared ?? false;
    this.virtual = params.virtual ?? false;
    this.data = params.data;
  }
}

/** Result of `reveal()` — whether the target chain was fully resolved. */
export type ExplorerRevealResult = { found: boolean; node: ExplorerNode | null };

@Injectable({ providedIn: 'root' })
export class ContentExplorerStore {
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly programsApi = inject(ProgramsApiService);
  private readonly scenarioSearchService = inject(ScenarioSearchService);
  private readonly cardSearchService = inject(CardSearchService);
  private readonly authStore = inject(AuthStore);
  private readonly logger = inject(AppLoggerService);

  /** Root (course) nodes. */
  readonly roots = signal<readonly ExplorerNode[]>([]);
  /** Whether roots are loading. */
  readonly loading = signal(false);
  /** Roots loading error message, if any. */
  readonly error = signal<string | null>(null);

  /** ID of the selected node (for the detail panel). */
  readonly selectedId = signal<string | null>(null);
  /** The selected node instance, if present in the tree. */
  readonly selectedNode = signal<ExplorerNode | null>(null);

  /** Flat index of all created nodes by ID (for parent lookups / breadcrumbs). */
  private readonly nodeIndex = new Map<string, ExplorerNode>();

  // -------------------------------------------------------------------------
  // Search — card catalog search + on-demand ancestor resolution
  // -------------------------------------------------------------------------

  /** Whether a search (card query + ancestor loading) is in progress. */
  readonly smartSearchLoading = signal(false);

  /** Error message from search. */
  readonly smartSearchError = signal<string | null>(null);

  /**
   * Keys of the nodes visible for the active search query.
   * `null` means «no active search» — the regular tree is rendered.
   */
  readonly searchVisibleKeys = signal<ReadonlySet<string> | null>(null);

  /**
   * Keys of the nodes that matched the active query themselves (not ancestors).
   *
   * @remarks
   * Matched nodes stay interactive during search: they keep the expand toggle
   * and, when expanded, render ALL their children (not only matching ones).
   */
  readonly searchMatchedKeys = signal<ReadonlySet<string>>(new Set());

  /** Keys of ancestors of matched nodes (auto-expanded context branch). */
  readonly searchAncestorKeys = signal<ReadonlySet<string>>(new Set());

  /**
   * Extra card nodes produced by search, grouped by parent scenario key.
   *
   * @remarks
   * Rendered on top of the regular (lazy) children so matching cards can be
   * shown inside their ancestor chain without mutating the tree.
   */
  readonly searchExtraChildren = signal<ReadonlyMap<string, readonly ExplorerNode[]>>(new Map());

  /** Root nodes to render for the active search query. */
  readonly searchResultRoots = signal<readonly ExplorerNode[]>([]);

  /** Monotonic search sequence — used to drop stale async results. */
  private searchSequence = 0;
  /** Node keys created only for the current search (cleaned up on clear). */
  private readonly searchCreatedNodeKeys = new Set<string>();
  /** In-flight child loads by node key (dedupes concurrent requests). */
  private readonly pendingChildLoads = new Map<string, Promise<void>>();
  /** Virtual root for cards that are not referenced by any scenario. */
  private orphanCardsRoot: ExplorerNode | null = null;
  /** Virtual root for scenarios that are not attached to any lesson. */
  private unattachedScenariosRoot: ExplorerNode | null = null;

  /**
   * Runs a tree search: title matches over loaded nodes + card catalog search.
   *
   * @remarks
   * Card search results carry `courseId` / `lessonId` / `scenarioId`
   * (`CardIndexEntry`), so only the missing ancestor nodes are loaded on demand
   * — no full-tree index and no per-card fan-out. Matching nodes and their
   * ancestor chains are exposed through `searchVisibleKeys` /
   * `searchResultRoots`, so the tree renders them as a filtered tree.
   *
   * @param query - Free-text query matched against node titles (and cards).
   */
  async search(query: string): Promise<void> {
    const normalized = query.trim();
    if (normalized.length === 0) {
      this.clearSearch();
      return;
    }

    const sequence = ++this.searchSequence;
    this.smartSearchLoading.set(true);
    this.smartSearchError.set(null);
    this.resetSearchOverlay();

    try {
      if (this.roots().length === 0) {
        await this.loadRoots();
      }
      if (sequence !== this.searchSequence) {
        return;
      }

      const titleMatches = this.collectTitleMatches(normalized);
      const [cardEntries, scenarioMatches, programMatches, courseMatches] = await Promise.all([
        this.searchCards(normalized),
        this.searchScenarioNodes(normalized),
        this.searchProgramNodes(normalized),
        this.searchCourseNodes(normalized),
      ]);
      if (sequence !== this.searchSequence) {
        return;
      }

      const matches = [...courseMatches, ...programMatches, ...scenarioMatches, ...titleMatches];
      matches.push(...(await this.attachCardMatches(cardEntries)));
      if (sequence !== this.searchSequence) {
        return;
      }

      const uniqueMatches = [...new Map(matches.map((node) => [node.key, node])).values()];
      const matchedKeys = new Set(uniqueMatches.map((node) => node.key));
      const ancestorKeys = this.collectAncestorKeys(uniqueMatches);
      this.expandAncestors(ancestorKeys);

      const visibleKeys = this.buildVisibleKeys(uniqueMatches);
      const resultRoots = this.roots().filter((root) => visibleKeys.has(root.key));
      if (this.orphanCardsRoot) {
        resultRoots.push(this.orphanCardsRoot);
      }
      if (this.unattachedScenariosRoot) {
        resultRoots.push(this.unattachedScenariosRoot);
      }

      this.searchMatchedKeys.set(matchedKeys);
      this.searchAncestorKeys.set(ancestorKeys);
      this.searchVisibleKeys.set(visibleKeys);
      this.searchResultRoots.set(resultRoots);
    } catch (error) {
      this.logger.error('ContentExplorer: search failed', error);
      this.smartSearchError.set('Не удалось выполнить поиск по контенту');
      this.resetSearchOverlay();
    } finally {
      if (sequence === this.searchSequence) {
        this.smartSearchLoading.set(false);
      }
    }
  }

  /** Clears search results and restores the regular tree. */
  clearSearch(): void {
    this.searchSequence += 1;
    this.smartSearchLoading.set(false);
    this.smartSearchError.set(null);
    this.resetSearchOverlay();
  }

  private resetSearchOverlay(): void {
    for (const key of this.searchCreatedNodeKeys) {
      this.nodeIndex.delete(key);
    }
    this.searchCreatedNodeKeys.clear();
    this.orphanCardsRoot = null;
    this.unattachedScenariosRoot = null;
    this.searchMatchedKeys.set(new Set());
    this.searchAncestorKeys.set(new Set());
    this.searchVisibleKeys.set(null);
    this.searchExtraChildren.set(new Map());
    this.searchResultRoots.set([]);
  }

  /** Collects ancestors (context branch) of all matched nodes. */
  private collectAncestorKeys(matches: readonly ExplorerNode[]): ReadonlySet<string> {
    const keys = new Set<string>();
    for (const node of matches) {
      const path = this.pathOf(node);
      for (const ancestor of path.slice(0, -1)) {
        keys.add(ancestor.key);
      }
    }
    return keys;
  }

  /** Auto-expands context ancestors so the matched path is visible. */
  private expandAncestors(keys: ReadonlySet<string>): void {
    for (const key of keys) {
      this.nodeIndex.get(key)?.expanded.set(true);
    }
  }

  private async ensureChildrenLoaded(node: ExplorerNode): Promise<void> {
    if (node.children() === null) {
      await this.loadChildren(node);
    }
  }

  private createScenarioNode(
    lessonNode: ExplorerNode,
    scenarioId: string,
    scenario: Scenario | undefined,
  ): ExplorerNode {
    if (!scenario) {
      return this.createNode({
        kind: 'scenario',
        id: scenarioId,
        parentId: lessonNode.key,
        title: `Сценарий ${scenarioId}`,
        meta: 'Сценарий (не найден в каталоге)',
        editable: false,
      });
    }
    return this.createNode({
      kind: 'scenario',
      id: scenario.id,
      parentId: lessonNode.key,
      title: scenario.title,
      meta: this.scenarioMeta(scenario),
      editable: this.isOwnAuthor(scenario.authorId),
      data: scenario,
    });
  }

  /** Collects all loaded nodes whose title matches the query. */
  private collectTitleMatches(query: string): ExplorerNode[] {
    const normalized = query.toLowerCase();
    const matches: ExplorerNode[] = [];
    const visited = new Set<string>();

    const visit = (nodes: readonly ExplorerNode[]): void => {
      for (const node of nodes) {
        if (visited.has(node.key)) {
          continue;
        }
        visited.add(node.key);
        if (node.title().toLowerCase().includes(normalized)) {
          matches.push(node);
        }
        const children = node.children();
        if (children && children.length > 0) {
          visit(children);
        }
      }
    };

    visit(this.roots());
    return matches;
  }

  /** Runs the card catalog search (one backend request per query). */
  private async searchCards(query: string): Promise<readonly CardIndexEntry[]> {
    try {
      const page = await this.cardSearchService.search({
        query,
        page: { page: 0, pageSize: 100 },
      });
      return page.items;
    } catch (error) {
      this.logger.warn('ContentExplorer: card search failed', error);
      return [];
    }
  }

  /**
   * Attaches matching cards to their scenario ancestors.
   *
   * @remarks
   * Uses the hierarchy IDs from the card search result (`courseId`,
   * `lessonId`, `scenarioId`) to load only the missing ancestor nodes.
   *
   * @returns Card nodes (existing or search-only) that should be visible.
   */
  private async attachCardMatches(entries: readonly CardIndexEntry[]): Promise<ExplorerNode[]> {
    if (entries.length === 0) {
      return [];
    }

    const matches: ExplorerNode[] = [];

    for (const entry of entries) {
      const scenarioNode = await this.resolveScenarioNodeForCard(entry);
      if (!scenarioNode) {
        matches.push(this.createOrphanCardNode(entry));
        continue;
      }

      const existing = (scenarioNode.children() ?? []).find(
        (child) => child.kind === 'card' && child.id === entry.id,
      );
      if (existing) {
        matches.push(existing);
        continue;
      }

      const cardNode = this.createCardNode(scenarioNode, entry.id, entry.title, entry.kind);
      cardNode.data = entry;
      this.searchCreatedNodeKeys.add(cardNode.key);
      this.addSearchExtraChild(scenarioNode.key, cardNode);
      matches.push(cardNode);
    }

    return matches;
  }

  /**
   * Resolves the scenario ancestor for a card search result.
   *
   * @remarks
   * Fast paths use already loaded nodes; otherwise the missing chain is loaded
   * by the card's `courseId` → `lessonId` → `scenarioId` references.
   */
  private async resolveScenarioNodeForCard(entry: CardIndexEntry): Promise<ExplorerNode | null> {
    const loadedScenarios = this.collectNodesByKind('scenario');

    if (entry.scenarioId) {
      const loaded = loadedScenarios.find((node) => node.id === entry.scenarioId);
      if (loaded) {
        return loaded;
      }
    }

    const byCardId = loadedScenarios.find((node) => this.scenarioReferencesCard(node, entry.id));
    if (byCardId) {
      return byCardId;
    }

    const courseNode = this.findCourseNode(entry.courseId);
    if (!courseNode) {
      return null;
    }

    await this.ensureChildrenLoaded(courseNode);
    const lessonNode = await this.findOrLoadLessonNode(
      courseNode,
      entry.lessonId,
      entry.scenarioId,
    );
    if (!lessonNode) {
      return null;
    }

    await this.ensureChildrenLoaded(lessonNode);
    const scenarios = (lessonNode.children() ?? []).filter((node) => node.kind === 'scenario');

    if (entry.scenarioId) {
      const scenarioNode = scenarios.find((node) => node.id === entry.scenarioId);
      if (scenarioNode) {
        return scenarioNode;
      }
    }

    return scenarios.find((node) => this.scenarioReferencesCard(node, entry.id)) ?? null;
  }

  // -------------------------------------------------------------------------
  // Search — entity catalog lookups (courses / programs / scenarios)
  // -------------------------------------------------------------------------

  /**
   * Finds courses by title through `/courses/search` and exposes them as roots.
   *
   * @remarks
   * Roots are loaded page by page (`ROOT_PAGE_SIZE`), so a course beyond the
   * first page would otherwise be invisible to search.
   */
  private async searchCourseNodes(query: string): Promise<ExplorerNode[]> {
    try {
      const page = await this.courseSearchService.search({
        query,
        scope: 'all',
        page: { page: 0, pageSize: ROOT_PAGE_SIZE },
      });

      const known = new Set(this.roots().map((node) => node.id));
      const discovered = page.items
        .filter((entry) => !known.has(entry.id))
        .map((entry) => this.createCourseNode(entry));
      if (discovered.length > 0) {
        this.roots.set([...this.roots(), ...discovered]);
      }

      const roots = this.roots();
      return page.items
        .map((entry) => roots.find((root) => root.id === entry.id) ?? null)
        .filter((node): node is ExplorerNode => node !== null);
    } catch (error) {
      this.logger.warn('ContentExplorer: course search failed', error);
      return [];
    }
  }

  /**
   * Finds programs (tracks) by title and attaches them to their course node.
   *
   * @remarks
   * `ProgramIndexEntry` carries `courseId`, so the ancestor chain is just the
   * course root. Missing program nodes are exposed through
   * `searchExtraChildren` — the lazy tree is not mutated.
   */
  private async searchProgramNodes(query: string): Promise<ExplorerNode[]> {
    try {
      const page = await this.programsApi.search({
        query,
        page: { page: 0, pageSize: SEARCH_PAGE_SIZE },
      });

      const matches: ExplorerNode[] = [];
      for (const entry of page.items) {
        const registered = this.nodeIndex.get(`program:${entry.id}`);
        if (registered) {
          matches.push(registered);
          continue;
        }

        const courseNode = this.findCourseNode(entry.courseId);
        if (!courseNode) {
          continue;
        }
        await this.ensureChildrenLoaded(courseNode);

        const existing = (courseNode.children() ?? []).find(
          (node) => node.kind === 'program' && node.id === entry.id,
        );
        if (existing) {
          matches.push(existing);
          continue;
        }

        const node = this.createNode({
          kind: 'program',
          id: entry.id,
          parentId: courseNode.key,
          title: entry.title,
          meta: `Трек · ${entry.lessonCount} урок(ов)`,
          editable: courseNode.editable,
          // `lessons` отсутствуют — `loadLessonChildren()` доберёт их через getById().
          data: {
            id: entry.id,
            courseId: entry.courseId,
            title: entry.title,
            order: entry.order,
          } satisfies Partial<ProgramIndexEntry>,
        });
        this.searchCreatedNodeKeys.add(node.key);
        this.addSearchExtraChild(courseNode.key, node);
        matches.push(node);
      }
      return matches;
    } catch (error) {
      this.logger.warn('ContentExplorer: program search failed', error);
      return [];
    }
  }

  /**
   * Finds scenarios by title and attaches them to their lesson node.
   *
   * @remarks
   * `ScenarioIndexEntry` has `courseId` but no `lessonId`, so the lesson is
   * resolved through `lesson.scenarioIds` (one `getByCourse` request).
   */
  private async searchScenarioNodes(query: string): Promise<ExplorerNode[]> {
    try {
      const page = await this.scenarioSearchService.search({
        query,
        scope: 'all',
        page: { page: 0, pageSize: SEARCH_PAGE_SIZE },
      });
      if (page.items.length === 0) {
        return [];
      }

      const scenarios = await this.scenarioSearchService.getByIdBatch(
        page.items.map((entry) => entry.id),
      );
      const byId = new Map(scenarios.map((scenario) => [scenario.id, scenario]));

      const matches: ExplorerNode[] = [];
      for (const entry of page.items) {
        const registered = this.nodeIndex.get(`scenario:${entry.id}`);
        if (registered) {
          matches.push(registered);
          continue;
        }

        const courseNode = this.findCourseNode(entry.courseId);
        const lessonNode = courseNode
          ? await this.findLessonNodeByScenarioId(courseNode, entry.id)
          : null;
        if (!lessonNode) {
          matches.push(this.createUnattachedScenarioNode(entry, byId.get(entry.id)));
          continue;
        }

        await this.ensureChildrenLoaded(lessonNode);
        const existing = (lessonNode.children() ?? []).find(
          (node) => node.kind === 'scenario' && node.id === entry.id,
        );
        if (existing) {
          matches.push(existing);
          continue;
        }

        const node = this.createScenarioNode(lessonNode, entry.id, byId.get(entry.id));
        this.searchCreatedNodeKeys.add(node.key);
        this.addSearchExtraChild(lessonNode.key, node);
        matches.push(node);
      }
      return matches;
    } catch (error) {
      this.logger.warn('ContentExplorer: scenario search failed', error);
      return [];
    }
  }

  /** Resolves a lesson containing the scenario (single `getByCourse` request). */
  private async findLessonNodeByScenarioId(
    courseNode: ExplorerNode,
    scenarioId: string,
  ): Promise<ExplorerNode | null> {
    await this.ensureChildrenLoaded(courseNode);

    const programs = await this.programsApi.getByCourse(courseNode.id);
    const program = programs.find((candidate) =>
      candidate.lessons?.some((lesson) => lesson.scenarioIds?.includes(scenarioId)),
    );
    const lessonId = program?.lessons?.find((lesson) =>
      lesson.scenarioIds?.includes(scenarioId),
    )?.id;
    if (!program || !lessonId) {
      return null;
    }

    const programNode = (courseNode.children() ?? []).find(
      (node) => node.kind === 'program' && node.id === program.id,
    );
    if (!programNode) {
      return null;
    }
    await this.ensureChildrenLoaded(programNode);
    return (
      (programNode.children() ?? []).find(
        (node) => node.kind === 'lesson' && node.id === lessonId,
      ) ?? null
    );
  }

  /** Adds a scenario that is not reachable through any lesson (virtual root). */
  private createUnattachedScenarioNode(
    entry: ScenarioIndexEntry,
    scenario: Scenario | undefined,
  ): ExplorerNode {
    if (!this.unattachedScenariosRoot) {
      this.unattachedScenariosRoot = this.createNode({
        kind: 'scenario',
        id: 'search:unattached-scenarios',
        parentId: null,
        title: 'Сценарии вне уроков',
        meta: 'Результаты поиска',
        virtual: true,
        editable: false,
      });
      this.unattachedScenariosRoot.children.set([]);
      this.searchCreatedNodeKeys.add(this.unattachedScenariosRoot.key);
    }

    const node = this.createScenarioNode(this.unattachedScenariosRoot, entry.id, scenario);
    this.searchCreatedNodeKeys.add(node.key);
    this.unattachedScenariosRoot.children.set([
      ...(this.unattachedScenariosRoot.children() ?? []),
      node,
    ]);
    return node;
  }

  /** Appends an extra child rendered on top of the lazy children of `parentKey`. */
  private addSearchExtraChild(parentKey: string, child: ExplorerNode): void {
    this.searchExtraChildren.update((map) => {
      const next = new Map(map);
      next.set(parentKey, [...(next.get(parentKey) ?? []), child]);
      return next;
    });
  }

  private findCourseNode(courseId: string | undefined): ExplorerNode | null {
    if (!courseId) {
      return null;
    }
    return this.roots().find((node) => node.kind === 'course' && node.id === courseId) ?? null;
  }

  /**
   * Finds a lesson inside a course, loading program children only when the
   * lesson cannot be located in the already loaded program metadata.
   */
  private async findOrLoadLessonNode(
    courseNode: ExplorerNode,
    lessonId: string | undefined,
    scenarioId: string | undefined,
  ): Promise<ExplorerNode | null> {
    const programNodes = courseNode.children() ?? [];

    if (lessonId) {
      const matchingProgram = programNodes.find((programNode) => {
        const program = programNode.data as ProgramWithLessons | undefined;
        return program?.lessons?.some((lesson) => lesson.id === lessonId) ?? false;
      });
      const candidates = matchingProgram
        ? [matchingProgram, ...programNodes.filter((node) => node !== matchingProgram)]
        : programNodes;

      for (const programNode of candidates) {
        await this.ensureChildrenLoaded(programNode);
        const lessonNode = (programNode.children() ?? []).find(
          (node) => node.kind === 'lesson' && node.id === lessonId,
        );
        if (lessonNode) {
          return lessonNode;
        }
      }
      return null;
    }

    if (scenarioId) {
      for (const programNode of programNodes) {
        await this.ensureChildrenLoaded(programNode);
        for (const lessonNode of programNode.children() ?? []) {
          const lesson = (lessonNode.data ?? {}) as { scenarioIds?: readonly string[] };
          if (lesson.scenarioIds?.includes(scenarioId)) {
            return lessonNode;
          }
        }
      }
    }

    return null;
  }

  private scenarioReferencesCard(node: ExplorerNode, cardId: string): boolean {
    const scenario = node.data as Scenario | null;
    if (!scenario) {
      return false;
    }
    const source = scenario.cardSource;
    return source.mode !== 'criteria' && source.cardIds.includes(cardId);
  }

  /** Creates a card node for cards not referenced by any scenario. */
  private createOrphanCardNode(entry: CardIndexEntry): ExplorerNode {
    if (!this.orphanCardsRoot) {
      this.orphanCardsRoot = this.createNode({
        kind: 'card',
        id: 'search:orphan-cards',
        parentId: null,
        title: 'Карточки вне сценариев',
        meta: 'Результаты поиска',
        virtual: true,
        editable: false,
      });
      this.orphanCardsRoot.children.set([]);
      this.searchCreatedNodeKeys.add(this.orphanCardsRoot.key);
    }

    const cardNode = this.createNode({
      kind: 'card',
      id: entry.id,
      parentId: this.orphanCardsRoot.key,
      title: entry.title,
      meta: `Карточка · ${entry.kind}`,
      shared: true,
      data: entry,
    });
    this.searchCreatedNodeKeys.add(cardNode.key);
    this.orphanCardsRoot.children.set([...(this.orphanCardsRoot.children() ?? []), cardNode]);
    return cardNode;
  }

  /** Collects all loaded nodes of a given kind. */
  private collectNodesByKind(kind: ExplorerNodeKind): ExplorerNode[] {
    const result: ExplorerNode[] = [];
    const visited = new Set<string>();

    const visit = (nodes: readonly ExplorerNode[]): void => {
      for (const node of nodes) {
        if (visited.has(node.key)) {
          continue;
        }
        visited.add(node.key);
        if (node.kind === kind) {
          result.push(node);
        }
        const children = node.children();
        if (children) {
          visit(children);
        }
      }
    };

    visit(this.roots());
    return result;
  }

  /** Builds the set of visible keys: matches plus all their ancestors. */
  private buildVisibleKeys(matches: readonly ExplorerNode[]): ReadonlySet<string> {
    const keys = new Set<string>();
    for (const node of matches) {
      for (const ancestor of this.pathOf(node)) {
        keys.add(ancestor.key);
      }
    }
    if (this.orphanCardsRoot) {
      keys.add(this.orphanCardsRoot.key);
    }
    if (this.unattachedScenariosRoot) {
      keys.add(this.unattachedScenariosRoot.key);
    }
    return keys;
  }

  // -------------------------------------------------------------------------
  // Roots
  // -------------------------------------------------------------------------

  /** Loads the course catalog as root nodes (scope: all — authors see everything). */
  async loadRoots(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const page = await this.courseSearchService.search({
        scope: 'all',
        page: { page: 0, pageSize: ROOT_PAGE_SIZE },
      });

      const nodes = page.items.map((entry) => this.createCourseNode(entry));
      this.roots.set(nodes);
    } catch (error) {
      this.logger.error('ContentExplorer: failed to load course roots', error);
      this.error.set('Не удалось загрузить каталог курсов');
    } finally {
      this.loading.set(false);
    }
  }

  // -------------------------------------------------------------------------
  // Tree interaction
  // -------------------------------------------------------------------------

  /** Selects a node for the detail panel. */
  selectNode(node: ExplorerNode): void {
    this.selectedId.set(node.id);
    this.selectedNode.set(node);
  }

  /** Clears the detail-panel selection (e.g. after the selected node was deleted). */
  clearSelection(): void {
    this.selectedId.set(null);
    this.selectedNode.set(null);
  }

  /** Expands a node (lazy-loading children) or collapses it. */
  async toggleNode(node: ExplorerNode): Promise<void> {
    if (node.expanded()) {
      node.expanded.set(false);
      return;
    }

    node.expanded.set(true);
    if (node.children() === null) {
      await this.loadChildren(node);
    }
  }

  /**
   * Loads children of a node based on its kind.
   *
   * @remarks
   * Concurrent callers share the same in-flight promise, so search resolvers
   * running in parallel do not observe a half-loaded ancestor chain.
   */
  async loadChildren(node: ExplorerNode): Promise<void> {
    if (node.children() !== null) {
      return;
    }

    const pending = this.pendingChildLoads.get(node.key);
    if (pending) {
      return pending;
    }

    const task = this.loadChildrenInternal(node).finally(() => {
      this.pendingChildLoads.delete(node.key);
    });
    this.pendingChildLoads.set(node.key, task);
    return task;
  }

  private async loadChildrenInternal(node: ExplorerNode): Promise<void> {
    node.loadingChildren.set(true);
    node.childError.set(null);

    try {
      switch (node.kind) {
        case 'course':
          node.children.set(await this.loadProgramChildren(node));
          break;
        case 'program':
          node.children.set(await this.loadLessonChildren(node));
          break;
        case 'lesson':
          node.children.set(await this.loadScenarioChildren(node));
          break;
        case 'scenario':
          node.children.set(await this.loadCardChildren(node));
          break;
        case 'card':
          node.children.set([]);
          break;
      }
    } catch (error) {
      this.logger.error(
        `ContentExplorer: failed to load children of ${node.kind}:${node.id}`,
        error,
      );
      node.childError.set('Не удалось загрузить вложенные элементы');
      node.expanded.set(false);
    } finally {
      node.loadingChildren.set(false);
    }
  }

  /**
   * Reloads a node after an edit: refreshes its title/meta and child list.
   * Keeps the node expanded if it was expanded.
   */
  async refreshNode(node: ExplorerNode): Promise<void> {
    node.children.set(null);
    node.childError.set(null);

    try {
      switch (node.kind) {
        case 'course': {
          const course = await this.courseSearchService.getById(node.id);
          node.title.set(course.title);
          node.data = course;
          node.meta.set(this.courseMeta(course));
          break;
        }
        case 'program': {
          const program = await this.programsApi.getById(node.id);
          node.title.set(program.title);
          node.data = program;
          node.meta.set(
            `Трек · ${program.lessons?.length ?? program.lessonIds?.length ?? 0} урок(ов)`,
          );
          break;
        }
        case 'scenario': {
          const scenario = await this.scenarioSearchService.getById(node.id);
          node.title.set(scenario.title);
          node.data = scenario;
          node.meta.set(this.scenarioMeta(scenario));
          break;
        }
        default:
          break;
      }
    } catch (error) {
      this.logger.error(`ContentExplorer: failed to refresh ${node.kind}:${node.id}`, error);
    }

    if (node.expanded()) {
      await this.loadChildren(node);
    }
  }

  /**
   * Resolves and selects a deep-link target, expanding the chain.
   *
   * @param target - The reveal target (course + optional nested IDs).
   * @returns The deepest resolved node, or `found: false` when the chain broke.
   */
  async reveal(target: ExplorerRevealTarget): Promise<ExplorerRevealResult> {
    if (this.roots().length === 0) {
      await this.loadRoots();
    }

    const root = this.roots().find((candidate) => candidate.id === target.courseId) ?? null;
    if (!root) {
      return { found: false, node: null };
    }

    let node: ExplorerNode = root;
    node.expanded.set(true);
    if (node.children() === null) {
      await this.loadChildren(node);
    }

    const chain: readonly (string | undefined)[] = [
      target.programId,
      target.lessonId,
      target.scenarioId,
      target.cardId,
    ];

    for (const id of chain) {
      if (!id) {
        break;
      }
      const child = node.children()?.find((candidate) => candidate.id === id);
      if (!child) {
        return { found: false, node };
      }
      child.expanded.set(true);
      if (child.children() === null && child.kind !== 'card') {
        await this.loadChildren(child);
      }
      node = child;
    }

    this.selectNode(node);
    return { found: true, node };
  }

  // -------------------------------------------------------------------------
  // Parent lookups
  // -------------------------------------------------------------------------

  /** Returns the node registry entry by its unique key (for breadcrumbs / parent lookups). */
  getByKey(key: string): ExplorerNode | null {
    return this.nodeIndex.get(key) ?? null;
  }

  /** Builds the ancestor path for a node: [course, program, lesson, scenario, card]. */
  pathOf(node: ExplorerNode): readonly ExplorerNode[] {
    const path: ExplorerNode[] = [];
    const visited = new Set<string>();
    let current: ExplorerNode | null = node;
    while (current && !visited.has(current.key)) {
      visited.add(current.key);
      path.unshift(current);
      current = current.parentId ? (this.nodeIndex.get(current.parentId) ?? null) : null;
    }
    return path;
  }

  /** Returns the nearest ancestor course node, if any. */
  parentCourseOf(node: ExplorerNode): ExplorerNode | null {
    const visited = new Set<string>();
    let current: ExplorerNode | null = node;
    while (current && !visited.has(current.key)) {
      visited.add(current.key);
      if (current.kind === 'course') {
        return current;
      }
      current = current.parentId ? (this.nodeIndex.get(current.parentId) ?? null) : null;
    }
    return null;
  }

  // -------------------------------------------------------------------------
  // Child loaders (kind-specific)
  // -------------------------------------------------------------------------

  private async loadProgramChildren(courseNode: ExplorerNode): Promise<readonly ExplorerNode[]> {
    let course: CourseWithPrograms;
    if (courseNode.data && Array.isArray((courseNode.data as CourseWithPrograms).programs)) {
      course = courseNode.data as CourseWithPrograms;
    } else {
      course = await this.courseSearchService.getById(courseNode.id);
      courseNode.title.set(course.title);
      courseNode.meta.set(this.courseMeta(course));
      // Кэшируем загруженный каталог, чтобы повторные раскрытия не ходили в сеть.
      courseNode.data = course;
    }

    // Если `/journey` вернул треки без уроков — добираем одним запросом
    // `/programs/by-course/:id/with-lessons` вместо N запросов `GET /programs/:id`.
    const programsWithLessons = await this.attachLessons(courseNode.id, course.programs);

    const programs = [...programsWithLessons].sort((left, right) => left.order - right.order);
    return programs.map((program) =>
      this.createNode({
        kind: 'program',
        id: program.id,
        parentId: courseNode.key,
        title: program.title,
        meta: `Трек · ${program.lessons?.length ?? program.lessonIds?.length ?? 0} урок(ов)`,
        editable: courseNode.editable,
        data: program,
      }),
    );
  }

  /**
   * Гарантирует, что у каждого трека есть `lessons[]`.
   *
   * @remarks
   * Journey-эндпоинт может вернуть программы без уроков; в этом случае уроки
   * добираются одним батч-запросом `getByCourse` (with-lessons) и мержатся по
   * `programId`. Это избавляет от вечных по-трековых `GET /programs/:id`.
   */
  private async attachLessons(
    courseId: string,
    programs: readonly ProgramWithLessons[],
  ): Promise<readonly ProgramWithLessons[]> {
    const missing = programs.filter(
      (program) => !Array.isArray(program.lessons) || program.lessons.length === 0,
    );
    if (missing.length === 0) {
      return programs;
    }

    try {
      const withLessons = await this.programsApi.getByCourse(courseId);
      const lessonsByProgram = new Map(
        withLessons.map((program) => [program.id, program.lessons ?? []]),
      );
      return programs.map((program) => ({
        ...program,
        lessons:
          Array.isArray(program.lessons) && program.lessons.length > 0
            ? program.lessons
            : (lessonsByProgram.get(program.id) ?? []),
      }));
    } catch (error) {
      this.logger.warn(`ContentExplorer: getByCourse(${courseId}) failed`, error);
      return programs;
    }
  }

  private async loadLessonChildren(programNode: ExplorerNode): Promise<readonly ExplorerNode[]> {
    let program: ProgramWithLessons;
    if (programNode.data && Array.isArray((programNode.data as ProgramWithLessons).lessons)) {
      program = programNode.data as ProgramWithLessons;
    } else {
      // Уроки добираются батч-запросом по родительскому курсу (см. attachLessons),
      // либо — как последний вариант — по самому треку.
      const courseNode = programNode.parentId ? this.getByKey(programNode.parentId) : null;
      const courseData = courseNode?.data as CourseWithPrograms | undefined;
      let lessons: readonly import('../../../entities/course/model').Lesson[] | undefined;
      if (courseNode && courseData && Array.isArray(courseData.programs)) {
        const enriched = await this.attachLessons(
          courseNode.id,
          courseData.programs as readonly ProgramWithLessons[],
        );
        lessons = enriched.find((candidate) => candidate.id === programNode.id)?.lessons;
        courseNode.data = { ...courseData, programs: enriched };
      }
      if (lessons) {
        program = { ...(programNode.data as ProgramWithLessons), lessons };
      } else {
        program = await this.programsApi.getById(programNode.id);
        programNode.title.set(program.title);
        programNode.meta.set(
          `Трек · ${program.lessons?.length ?? program.lessonIds?.length ?? 0} урок(ов)`,
        );
      }
    }

    const lessons = [...(program.lessons ?? [])].sort((left, right) => left.order - right.order);
    return lessons.map((lesson) =>
      this.createNode({
        kind: 'lesson',
        id: lesson.id,
        parentId: programNode.key,
        title: lesson.title,
        meta: `Урок · ${lesson.scenarioIds.length} сценарий(ев)`,
        editable: programNode.editable,
        data: lesson,
      }),
    );
  }

  private async loadScenarioChildren(lessonNode: ExplorerNode): Promise<readonly ExplorerNode[]> {
    const lesson = (lessonNode.data ?? {}) as { scenarioIds?: readonly string[] };
    const scenarioIds = lesson.scenarioIds ?? [];
    if (scenarioIds.length === 0) {
      return [];
    }

    const scenarios = await this.scenarioSearchService.getByIdBatch(scenarioIds);
    const byId = new Map(scenarios.map((scenario) => [scenario.id, scenario]));

    return scenarioIds.map((scenarioId) =>
      this.createScenarioNode(lessonNode, scenarioId, byId.get(scenarioId)),
    );
  }

  private async loadCardChildren(scenarioNode: ExplorerNode): Promise<readonly ExplorerNode[]> {
    const scenario = (scenarioNode.data ?? null) as Scenario | null;
    if (!scenario) {
      return [];
    }

    const source: ScenarioCardSource = scenario.cardSource;
    if (source.mode === 'criteria') {
      const limit = source.limit ? ` · лимит ${source.limit}` : '';
      return [
        this.createNode({
          kind: 'card',
          id: `${scenarioNode.id}::criteria`,
          parentId: scenarioNode.key,
          title: 'Набор по критериям каталога',
          meta: `criteria${limit}`,
          virtual: true,
          editable: false,
        }),
      ];
    }

    // fixed / snapshot: resolve card titles through the catalog index.
    const cardIds = [...source.cardIds];
    const resolved = new Map<string, CardIndexEntry>();

    try {
      await this.cardSearchService.ensureIndexLoaded();
      for (const entry of this.cardSearchService.indexEntries()) {
        resolved.set(entry.id, entry);
      }
    } catch (error) {
      this.logger.warn?.(
        'ContentExplorer: card index load failed, falling back to per-card lookups',
        error,
      );
    }

    let fallbackUsed = 0;
    const cards: ExplorerNode[] = [];
    for (const cardId of cardIds) {
      const entry = resolved.get(cardId) ?? null;
      if (entry) {
        cards.push(this.createCardNode(scenarioNode, entry.id, entry.title, entry.kind));
        continue;
      }
      if (fallbackUsed >= MAX_CARD_FALLBACK_LOOKUPS) {
        cards.push(
          this.createNode({
            kind: 'card',
            id: cardId,
            parentId: scenarioNode.key,
            title: `Карточка ${cardId}`,
            shared: true,
          }),
        );
        continue;
      }
      fallbackUsed += 1;
      try {
        const card = await this.cardSearchService.getCardById(cardId);
        const cardTitle =
          typeof card.title === 'string' && card.title.length > 0
            ? card.title
            : `Карточка ${cardId}`;
        cards.push(this.createCardNode(scenarioNode, card.id, cardTitle, card.kind));
      } catch {
        cards.push(
          this.createNode({
            kind: 'card',
            id: cardId,
            parentId: scenarioNode.key,
            title: `Карточка ${cardId}`,
            meta: 'Не найдена в каталоге',
          }),
        );
      }
    }

    return cards;
  }

  // -------------------------------------------------------------------------
  // Node factories
  // -------------------------------------------------------------------------

  private createNode(params: {
    kind: ExplorerNodeKind;
    id: string;
    parentId: string | null;
    title: string;
    meta?: string;
    editable?: boolean;
    shared?: boolean;
    virtual?: boolean;
    data?: unknown;
  }): ExplorerNode {
    const node = new ExplorerNode(params);
    this.nodeIndex.set(node.key, node);
    return node;
  }

  private createCourseNode(entry: CourseIndexEntry): ExplorerNode {
    const node = this.createNode({
      kind: 'course',
      id: entry.id,
      parentId: null,
      title: entry.title,
      meta: this.courseMetaFromEntry(entry),
      editable: this.isOwnAuthor(entry.authorId),
      data: entry,
    });
    return node;
  }

  private createCardNode(
    scenarioNode: ExplorerNode,
    cardId: string,
    cardTitle: string,
    cardKind: string,
  ): ExplorerNode {
    return this.createNode({
      kind: 'card',
      id: cardId,
      parentId: scenarioNode.key,
      title: cardTitle,
      meta: `Карточка · ${cardKind}`,
      shared: true,
    });
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private isOwnAuthor(authorId: string): boolean {
    const user = this.authStore.user();
    if (!user) {
      return false;
    }
    return isEditableContentAuthor(authorId, user.id, user.roles);
  }

  private courseMeta(course: CourseWithPrograms): string {
    const pair = course.languagePair;
    const status = course.published ? 'опубликован' : 'черновик';
    return `Каталог · ${pair?.known ?? '?'}→${pair?.learning ?? '?'} · ${status}`;
  }

  private courseMetaFromEntry(entry: CourseIndexEntry): string {
    const status = entry.published ? 'опубликован' : 'черновик';
    return `Каталог · ${entry.languagePairSummary} · ${status}`;
  }

  private scenarioMeta(scenario: Scenario): string {
    const count = scenario.cardCount ?? this.cardCountOf(scenario.cardSource);
    return `Сценарий · ${count} карточек · ${scenario.published ? 'опубликован' : 'черновик'}`;
  }

  private cardCountOf(source: ScenarioCardSource): number {
    if (source.mode === 'criteria') {
      return source.limit ?? 0;
    }
    return source.cardIds.length;
  }
}
