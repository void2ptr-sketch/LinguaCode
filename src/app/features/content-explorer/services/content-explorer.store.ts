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
import { ScenarioSearchService } from '../../../entities/scenario/search/scenario-search.service';
import type { Scenario } from '../../../entities/scenario/model/scenario.types';
import type {
  ScenarioCardSource,
} from '../../../entities/scenario/model/scenario-card-source.types';
import { CardSearchService } from '../../../entities/card/search/card-search.service';
import type { CardIndexEntry } from '../../../entities/card/model/card-index.types';
import { AuthStore } from '../../../entities/auth/services/auth.store';
import { isEditableContentAuthor } from '../../../entities/user/lib/system-author.constants';
import { AppLoggerService } from '../../../shared/logger/app-logger.service';

import type { ExplorerNodeKind, ExplorerRevealTarget } from '../types/content-explorer.types';

const ROOT_PAGE_SIZE = 100;
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

  /** Loads children of a node based on its kind. */
  async loadChildren(node: ExplorerNode): Promise<void> {
    if (node.loadingChildren() || node.children() !== null) {
      return;
    }

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
      this.logger.error(`ContentExplorer: failed to load children of ${node.kind}:${node.id}`, error);
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
          node.meta.set(`Трек · ${program.lessons?.length ?? program.lessonIds?.length ?? 0} урок(ов)`);
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

    return scenarioIds
      .map((scenarioId) => {
        const scenario = byId.get(scenarioId);
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
      });
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
      this.logger.warn?.('ContentExplorer: card index load failed, falling back to per-card lookups', error);
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
        const cardTitle = typeof card.title === 'string' && card.title.length > 0
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
