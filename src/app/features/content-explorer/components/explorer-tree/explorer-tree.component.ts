/**
 * Left panel of the content explorer: search filter + root course list
 * with lazy-loading recursive tree nodes.
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ContentExplorerStore } from '../../services/content-explorer.store';
import { filterExplorerNodes } from '../../types/content-explorer.types';
import { ExplorerTreeNodeComponent } from '../explorer-tree-node/explorer-tree-node.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-explorer-tree',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ExplorerTreeNodeComponent,
  ],
  templateUrl: './explorer-tree.component.html',
  styleUrl: './explorer-tree.component.scss',
})
export class ExplorerTreeComponent {
  protected readonly store = inject(ContentExplorerStore);
  protected readonly filterQuery = signal('');

  /** Roots visible after applying the search filter to loaded nodes. */
  protected readonly visibleRoots = computed(() =>
    filterExplorerNodes(this.store.roots(), this.filterQuery()),
  );

  protected setFilter(query: string): void {
    this.filterQuery.set(query);
  }

  protected async onRefresh(): Promise<void> {
    await this.store.loadRoots();
  }
}
