/**
 * Types for the content explorer feature — the unified GUI explorer that
 * connects the full content hierarchy: Course → Program → Lesson → Scenario → Card.
 *
 * @remarks
 * See docs/ARCHITECTURE/ARCHITECTURE.content-explorer.md (этап 1 — MVP).
 */

/** Kind of a node in the content explorer tree. */
export type ExplorerNodeKind = 'course' | 'program' | 'lesson' | 'scenario' | 'card';

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
