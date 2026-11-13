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

  protected readonly store = inject(ContentExplorerStore);
  protected readonly kindIcon = computed(() => EXPLORER_KIND_ICONS[this.node().kind]);
  protected readonly kindLabel = computed(() => EXPLORER_KIND_LABELS[this.node().kind]);

  /** Whether a search filter is currently active. */
  protected readonly searchActive = computed(() => this.store.searchVisibleKeys() !== null);

  /**
   * Children to render: regular lazy children plus search-only card nodes,
   * filtered down to the keys matched by the active search.
   */
  protected readonly visibleChildren = computed(() => {
    const node = this.node();
    const base = node.children() ?? [];
    const extra = this.store.searchExtraChildren().get(node.key) ?? [];
    const all = extra.length > 0 ? [...base, ...extra] : base;
    const visibleKeys = this.store.searchVisibleKeys();
    return visibleKeys ? all.filter((child) => visibleKeys.has(child.key)) : base;
  });

  /** Whether the node row has children (and therefore an expand toggle). */
  protected readonly hasChildren = computed(() => {
    const node = this.node();
    if (this.searchActive()) {
      return this.visibleChildren().length > 0;
    }
    if (node.kind !== 'card') {
      return true;
    }
    return node.virtual && (node.children()?.length ?? 0) > 0;
  });

  /** Whether children should be rendered below the row. */
  protected readonly showChildren = computed(() => {
    if (this.searchActive()) {
      return this.visibleChildren().length > 0;
    }
    return this.node().expanded() && this.node().children() !== null;
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
