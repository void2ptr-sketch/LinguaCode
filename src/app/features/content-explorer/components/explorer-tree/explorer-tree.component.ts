/**
 * Left panel of the content explorer: search filter + root course list
 * with lazy-loading recursive tree nodes.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UserStore } from '../../../../entities/user/model/user.store';
import { ContentExplorerStore } from '../../services/content-explorer.store';
import { filterExplorerNodes } from '../../types/content-explorer.types';
import { ExplorerTreeNodeComponent } from '../explorer-tree-node/explorer-tree-node.component';
import { AppLoggerService } from '../../../../shared/logger/app-logger.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-explorer-tree',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ExplorerTreeNodeComponent,
  ],
  templateUrl: './explorer-tree.component.html',
  styleUrl: './explorer-tree.component.scss',
})
export class ExplorerTreeComponent {
  protected readonly store = inject(ContentExplorerStore);
  protected readonly userStore = inject(UserStore);
  protected readonly logger = inject(AppLoggerService);
  protected readonly filterQuery = signal('');
  /** Toggled language-pair keys (e.g. "ru→en"). Empty = show all. */
  protected readonly selectedPairKeys = signal<Set<string>>(new Set());
  /** Results from smart card search (paths to matching cards). */
  protected readonly smartSearchResults = signal<readonly import('../../services/content-explorer.store').ExplorerNode[]>([]);

  /** Debounce timer for smart search. */
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Debounced smart search on query change
    effect(() => {
      const query = this.filterQuery();
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
      }
      this.searchDebounceTimer = setTimeout(async () => {
        if (query.trim().length > 0) {
          try {
            const results = await this.store.searchCardsAndBuildPaths(query);
            this.smartSearchResults.set(results);
          } catch (error) {
            this.logger.error?.('Smart search failed:', error);
            this.smartSearchResults.set([]);
          }
        } else {
          this.smartSearchResults.set([]);
        }
      }, 300);
    });
  }

  /** Unique language pairs present in the loaded roots. */
  protected readonly availablePairKeys = computed(() => {
    const roots = this.store.roots();
    const keys = new Set<string>();
    for (const root of roots) {
      const pair = (root.data as { languagePair?: { known: string; learning: string } })
        ?.languagePair;
      if (pair) {
        keys.add(`${pair.known}→${pair.learning}`);
      }
    }
    return keys;
  });

  /** Show language filter only when there are enough distinct pairs. */
  protected readonly showLanguageFilter = computed(() => this.availablePairKeys().size > 2);

  /** UserStore.active pair key used for auto-selection and visual hint. */
  protected readonly activePairKey = computed(() => {
    const lp = this.userStore.languagePair();
    return `${lp.known}→${lp.learning}`;
  });

  /** Whether smart search is active (non-empty query). */
  protected readonly isSmartSearchActive = computed(() => this.filterQuery().trim().length > 0);

  /** Roots visible after applying search + language pair filters to loaded nodes. */
  protected readonly visibleRoots = computed(() => {
    // If smart search is active, use its results
    if (this.isSmartSearchActive()) {
      return this.smartSearchResults();
    }

    // Otherwise use regular tree filtering
    const roots = filterExplorerNodes(this.store.roots(), this.filterQuery());
    const selected = this.selectedPairKeys();
    if (selected.size === 0) {
      return roots;
    }
    return roots.filter((node) => {
      const pair = (node.data as { languagePair?: { known: string; learning: string } })
        ?.languagePair;
      if (!pair) {
        return true;
      }
      const key = `${pair.known}→${pair.learning}`;
      return selected.has(key);
    });
  });

  protected setFilter(query: string): void {
    this.filterQuery.set(query);
  }

  protected async onRefresh(): Promise<void> {
    await this.store.loadRoots();
  }

  /** Toggle a language-pair chip. If all are toggled off → reset to show all. */
  protected togglePair(key: string): void {
    this.selectedPairKeys.update((set) => {
      const next = new Set(set);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  /** Check if a pair key is currently selected. */
  protected isPairSelected(key: string): boolean {
    return this.selectedPairKeys().has(key);
  }
}
