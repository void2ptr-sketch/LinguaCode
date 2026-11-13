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

  /** Whether the node can have children (cards and virtual nodes are leaves). */
  protected readonly hasChildren = computed(
    () => this.node().kind !== 'card' && !this.node().virtual,
  );

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
