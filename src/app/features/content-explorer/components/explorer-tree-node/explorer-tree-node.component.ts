/**
 * Recursive tree node for the content explorer.
 *
 * @remarks
 * Renders a single node row (icon, title, meta, badges) and its loaded
 * children via self-recursion. Selection and expansion are delegated to
 * `ContentExplorerStore`.
 */
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ContentExplorerStore, ExplorerNode } from '../../services/content-explorer.store';
import { EXPLORER_KIND_ICONS, EXPLORER_KIND_LABELS } from '../../types/content-explorer.types';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-explorer-tree-node',
  imports: [MatIconModule, MatTooltipModule, ExplorerTreeNodeComponent],
  templateUrl: './explorer-tree-node.component.html',
  styleUrl: './explorer-tree-node.component.scss',
})
export class ExplorerTreeNodeComponent {
  /** Node rendered by this component. */
  readonly node = input.required<ExplorerNode>();
  /** Depth level (for indentation). */
  readonly depth = input<number>(0);
  /** Whether the node is inside the expanded subtree of a search match. */
  readonly searchSubtree = input<boolean>(false);

  protected readonly store = inject(ContentExplorerStore);
  protected readonly kindIcon = computed(() => EXPLORER_KIND_ICONS[this.node().kind]);
  protected readonly kindLabel = computed(() => EXPLORER_KIND_LABELS[this.node().kind]);

  /** Whether a search filter is currently active. */
  protected readonly searchActive = computed(() => this.store.searchVisibleKeys() !== null);

  /** Whether this node itself matched the active search query. */
  protected readonly isSearchMatch = computed(() =>
    this.store.searchMatchedKeys().has(this.node().key),
  );

  /**
   * Search mode where the branch is trimmed to the path of matches.
   *
   * @remarks
   * Applies to context ancestors only: matched nodes (and their subtrees) keep
   * the regular interactive behaviour.
   */
  protected readonly filteredSearchMode = computed(
    () => this.searchActive() && !this.isSearchMatch() && !this.searchSubtree(),
  );

  /** Search-only children attached to this node by the store. */
  protected readonly searchExtras = computed(
    () => this.store.searchExtraChildren().get(this.node().key) ?? [],
  );

  /**
   * Children to render: regular lazy children plus search-only nodes.
   *
   * @remarks
   * Only context ancestors are filtered down to the matched path; matched
   * nodes and their subtrees render all children so they stay explorable.
   */
  protected readonly visibleChildren = computed(() => {
    const node = this.node();
    const base = node.children() ?? [];
    const extra = this.searchExtras();
    const all = extra.length > 0 ? [...base, ...extra] : base;

    if (!this.searchActive() || this.isSearchMatch() || this.searchSubtree()) {
      return all;
    }
    const visibleKeys = this.store.searchVisibleKeys();
    return visibleKeys ? all.filter((child) => visibleKeys.has(child.key)) : all;
  });

  /** Whether the node row has children (and therefore an expand toggle). */
  protected readonly hasChildren = computed(() => {
    const node = this.node();
    if (this.filteredSearchMode()) {
      return this.visibleChildren().length > 0;
    }
    if (node.kind !== 'card') {
      const children = node.children();
      return children === null || children.length > 0;
    }
    return node.virtual && (node.children()?.length ?? 0) > 0;
  });

  /** Whether children should be rendered below the row. */
  protected readonly showChildren = computed(() => {
    if (this.filteredSearchMode()) {
      return this.visibleChildren().length > 0;
    }
    const node = this.node();
    if (node.expanded()) {
      return node.children() !== null || this.searchExtras().length > 0;
    }
    // Matched nodes keep their search-only children visible even when collapsed.
    return this.searchActive() && this.isSearchMatch() && this.searchExtras().length > 0;
  });

  protected onSelect(event: Event): void {
    event.stopPropagation();
    this.store.selectNode(this.node());
  }

  protected async onToggle(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    this.store.selectNode(this.node());
    await this.store.toggleNode(this.node());
  }
}
