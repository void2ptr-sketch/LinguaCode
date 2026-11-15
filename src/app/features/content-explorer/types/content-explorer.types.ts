/**
 * Types for the content explorer feature — the unified GUI explorer that
 * connects the full content hierarchy: Course → Program → Lesson → Scenario → Card.
 *
 * @remarks
 * See docs/ARCHITECTURE/ARCHITECTURE.content-explorer.md (этап 1 — MVP).
 */
import type { CardKind } from '../../../entities/card/model';

/** Kind of a node in the content explorer tree. */
export type ExplorerNodeKind = 'course' | 'program' | 'lesson' | 'scenario' | 'card';

/**
 * Sentinel order for siblings without an explicit `<entity>_order` value.
 *
 * @remarks
 * Nodes without an order keep their source order (stable sort) and are placed
 * after explicitly ordered siblings.
 */
export const EXPLORER_ORDER_FALLBACK = Number.MAX_SAFE_INTEGER;

/**
 * Normalizes an entity order value for tree sorting.
 *
 * @remarks
 * Used by levels where `0` is a valid position (programs, lessons).
 * Missing or non-finite values fall back to {@link EXPLORER_ORDER_FALLBACK}.
 *
 * @param order - Raw order from the entity (`program_order` / `lesson_order`).
 * @returns A finite order value or the fallback sentinel.
 */
export function normalizeExplorerOrder(order: number | null | undefined): number {
  return order != null && Number.isFinite(order) ? order : EXPLORER_ORDER_FALLBACK;
}

/**
 * Normalizes an order value where `0` means «not set» (scenarios, cards).
 *
 * @remarks
 * The API contract defines scenario order as `>= 1` (default `0`), and card
 * order is optional. Such entities are placed after explicitly ordered
 * siblings while preserving their source order (`lesson.scenarioIds` /
 * `cardSource.cardIds`).
 *
 * @param order - Raw order from the entity (`scenario_order` / `card_order`).
 * @returns A positive order value or the fallback sentinel.
 */
export function normalizeExplicitOrder(order: number | null | undefined): number {
  return order != null && Number.isFinite(order) && order > 0 ? order : EXPLORER_ORDER_FALLBACK;
}

/**
 * Stable comparator for tree siblings (ascending `order`).
 *
 * @param left - Left node.
 * @param right - Right node.
 * @returns Negative when `left` goes first, positive when `right` goes first.
 */
export function compareExplorerOrder(left: { order: number }, right: { order: number }): number {
  return left.order - right.order;
}

/**
 * Comparator for raw entities carrying an optional `order` field.
 *
 * @param left - Left entity.
 * @param right - Right entity.
 * @returns Negative when `left` goes first, positive when `right` goes first.
 */
export function compareEntityOrder<T extends { order?: number | null }>(left: T, right: T): number {
  return normalizeExplorerOrder(left.order) - normalizeExplorerOrder(right.order);
}

/**
 * Deep-link reveal target for `/tools/content`.
 *
 * @remarks
 * All fields except `courseId` are optional; the explorer auto-expands
 * the chain down to the deepest provided ID and selects that node.
 */
export type ExplorerRevealTarget = {
  courseId: string;
  programId?: string;
  lessonId?: string;
  scenarioId?: string;
  cardId?: string;
};

/** UI labels for node kinds (per DOMAIN.md terminology). */
export const EXPLORER_KIND_LABELS: Readonly<Record<ExplorerNodeKind, string>> = {
  course: 'Каталог программ',
  program: 'Трек',
  lesson: 'Урок',
  scenario: 'Сценарий',
  card: 'Карточка',
};

/** Material icon per node kind. */
export const EXPLORER_KIND_ICONS: Readonly<Record<ExplorerNodeKind, string>> = {
  course: 'menu_book',
  program: 'account_tree',
  lesson: 'lesson',
  scenario: 'view_list',
  card: 'style',
};

/** Option of the scenario «Добавить карточку» menu. */
export type ExplorerCardKindOption = {
  code: CardKind;
  label: string;
};

/**
 * Card kinds offered when creating a card from a scenario node.
 *
 * @remarks
 * The content explorer has to pick a concrete `CardKind` before opening the
 * card editor dialog (`CardEditorDialogData` create mode requires `kind`, and
 * the dialog has no kind selector). Labels mirror
 * `docs/COMMON/CARD-FIELD-GUIDE.md`; the backend catalog
 * (`CatalogService.cardKinds()`) can override this list via the
 * `cardKinds` input of `ExplorerDetailComponent` once it is loaded.
 */
export const EXPLORER_CARD_KIND_OPTIONS: readonly ExplorerCardKindOption[] = [
  { code: 'select', label: 'Выбор ответа' },
  { code: 'code-select', label: 'Код: выбор ответа' },
  { code: 'memory', label: 'Запоминание' },
  { code: 'symbol', label: 'Символы' },
  { code: 'sound', label: 'Звук' },
  { code: 'timed', label: 'На время' },
  { code: 'keyboard', label: 'Клавиатура' },
  { code: 'draw', label: 'Рисование' },
  { code: 'tone', label: 'Тон' },
  { code: 'reading', label: 'Чтение' },
  { code: 'flip', label: 'Переворот' },
  { code: 'cloze', label: 'Пропуск в тексте' },
  { code: 'code-trace', label: 'Код: что выведет?' },
];

/** Minimal structural contract for nodes filterable by title/children. */
export type ExplorerFilterableNode = {
  title: () => string;
  children: () => readonly ExplorerFilterableNode[] | null;
};

/**
 * Filters a loaded node tree by a free-text query (case-insensitive substring
 * match on title). A node is kept when its own title matches or any of its
 * loaded descendants match.
 *
 * @param nodes - Currently rendered (loaded) child nodes.
 * @param query - Filter query; empty string disables filtering.
 * @returns Filtered node list preserving order.
 */
export function filterExplorerNodes<T extends ExplorerFilterableNode>(
  nodes: readonly T[],
  query: string,
): readonly T[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return nodes;
  }

  const result: T[] = [];
  for (const node of nodes) {
    const children = node.children();
    if (node.title().toLowerCase().includes(normalized)) {
      result.push(node);
      continue;
    }
    if (children && children.length > 0) {
      const kept = filterExplorerNodes(children, normalized);
      if (kept.length > 0) {
        result.push(node);
      }
    }
  }
  return result;
}

/**
 * Builds a path of nodes from root to a target node by following parent references.
 *
 * @param node - The target node.
 * @param nodeIndex - Flat index of all nodes by key.
 * @returns Array of nodes from root to target (inclusive).
 */
export function buildPathToNode(
  node: ExplorerFilterableNode & { key: string; parentId: string | null },
  nodeIndex: Map<string, ExplorerFilterableNode & { key: string; parentId: string | null }>,
): (ExplorerFilterableNode & { key: string; parentId: string | null })[] {
  const path: (ExplorerFilterableNode & { key: string; parentId: string | null })[] = [];
  let current: (ExplorerFilterableNode & { key: string; parentId: string | null }) | null = node;
  const visited = new Set<string>();

  while (current && !visited.has(current.key)) {
    visited.add(current.key);
    path.unshift(current);
    current = current.parentId ? (nodeIndex.get(current.parentId) ?? null) : null;
  }

  return path;
}
