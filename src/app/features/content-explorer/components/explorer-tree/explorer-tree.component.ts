/**
 * Left panel of the content explorer: search filter + root course list
 * with lazy-loading recursive tree nodes.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
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
  private readonly destroyRef = inject(DestroyRef);
  protected readonly filterQuery = signal('');
  /** Toggled language-pair keys (e.g. "ru→en"). Empty = show all. */
  protected readonly selectedPairKeys = signal<Set<string>>(new Set());

  /** Debounce timer for the search. */
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.cancelPendingSearch());

    // Debounced tree search on query change. Cards are searched with one
    // `/cards/search` request; their hierarchy IDs load only missing ancestors.
    effect(() => {
      const query = this.filterQuery();
      this.cancelPendingSearch();

      if (query.trim().length === 0) {
        this.store.clearSearch();
        return;
      }

      this.searchDebounceTimer = setTimeout(() => {
        this.searchDebounceTimer = null;
        void this.store.search(query);
      }, 300);
    });
  }

  private cancelPendingSearch(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
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

  /** Whether search is active (non-empty query). */
  protected readonly isSmartSearchActive = computed(() => this.filterQuery().trim().length > 0);

  /** Whether a search query or ancestor resolution is in progress. */
  protected readonly searchBusy = computed(() => this.store.smartSearchLoading());

  /** Roots visible after applying search + language pair filters. */
  protected readonly visibleRoots = computed(() => {
    // Search results are already a filtered tree (matches + ancestors).
    if (this.isSmartSearchActive()) {
      return this.store.searchResultRoots();
    }

    const roots = this.store.roots();
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
    if (this.filterQuery().trim().length > 0) {
      await this.store.search(this.filterQuery());
    }
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
