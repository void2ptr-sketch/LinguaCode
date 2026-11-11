import {
  Component,
  ChangeDetectionStrategy,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
  DestroyRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { PageEvent } from '@angular/material/paginator';

import { ScenarioSearchService } from '../..';
import { activeLanguagePairCriteria } from '../../../language-pair/utils/language-pair-scope.utils';
import { scenarioToIndexEntry } from '../../mapping/scenario-index.mapper';
import type { ScenarioIndexEntry, ScenarioListScope } from '../../model';
import { UserStore } from '../../../user/model/user.store';
import { UiPaginationComponent } from '../../../../shared/utils/pagination';

let lastKnownScenarioPickerActiveLanguagePairId: string | null | undefined = null;

/**
 * Scenario picker component. Provides a searchable, paginated list of scenarios
 * with scope filtering and optional ID-based allowlisting.
 *
 * @remarks
 * Loads scenarios from `ScenarioSearchService`, filtered by the active language pair.
 * Supports auto-selecting the first scenario and limiting results via `allowedScenarioIds`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-scenario-picker',
  imports: [
    FormsModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    UiPaginationComponent,
  ],
  templateUrl: './scenario-picker.component.html',
  styleUrl: './scenario-picker.component.scss',
})
export class ScenarioPickerComponent implements OnInit {
  private readonly scenarioSearchService = inject(ScenarioSearchService);
  private readonly userStore = inject(UserStore);
  private readonly destroyRef = inject(DestroyRef);

  /** Tracks component destruction to guard async emits (NG0953). */
  private readonly destroyed = signal(false);

  constructor() {
    this.destroyRef.onDestroy(() => this.destroyed.set(true));
  }

  /**
   * ID of the currently selected scenario.
   * @remarks
   * Required input that drives the scenario search and selection state.
   */
  readonly selectedScenarioId = input.required<string>();

  /**
   * Optional filter: only these scenario IDs are selectable.
   *
   * @remarks
   * When null, all scenarios in the selected scope are available.
   * When set, limits results to only the specified IDs and resets pagination.
   */
  readonly allowedScenarioIds = input<readonly string[] | null>(null);

  /**
   * Automatically select the first scenario when the list loads.
   * @remarks
   * When true and no scenario is currently selected, picks the first available scenario.
   */
  readonly autoSelectFirst = input(true);

  /**
   * Emits when the selected scenario ID changes.
   * @remarks Payload is the new scenario ID string.
   */
  readonly selectedScenarioIdChange = output<string>();

  /**
   * Emits when the selected scenario label changes.
   * @remarks Payload is the formatted label string.
   */
  readonly scenarioLabelChange = output<string>();

  /**
   * Current search query text.
   * @remarks
   * Updates trigger a reload of the scenario list with the new filter.
   */
  readonly query = signal('');

  /**
   * Current search scope.
   * @remarks
   * Defaults to 'published'. Updates trigger a reload of the scenario list.
   */
  readonly scope = signal<ScenarioListScope>('published');

  /**
   * Paginated list of matching scenario entries.
   * @remarks
   * Populated by `load()` after a successful search request.
   * Filtered by `allowedScenarioIds` when set.
   */
  readonly items = signal<readonly ScenarioIndexEntry[]>([]);

  /**
   * Total number of matching scenarios (for pagination).
   * @remarks
   * Used to calculate the total number of pages. Reflects the filtered count.
   */
  readonly totalItems = signal(0);

  /**
   * Current zero-based page index.
   * @remarks
   * Resets to 0 on query or scope changes.
   */
  readonly pageIndex = signal(0);

  /**
   * Number of items per page.
   * @remarks
   * Defaults to 10. When `allowedScenarioIds` is set, uses 100.
   */
  readonly pageSize = signal(10);

  /**
   * Whether a scenario search request is in progress.
   * @remarks
   * Set to true at the start of `load()` and reset in the finally block.
   */
  readonly loading = signal(false);

  /**
   * Safe accessor for items (defensive against early template rendering).
   */
  protected getItems(): readonly ScenarioIndexEntry[] {
    return this.items() ?? [];
  }

  private readonly reloadOnActivePairChange = effect(() => {
    const activeId = this.userStore.activeLanguagePairId();

    if (
      lastKnownScenarioPickerActiveLanguagePairId !== null &&
      lastKnownScenarioPickerActiveLanguagePairId !== activeId
    ) {
      void this.load();
    }

    lastKnownScenarioPickerActiveLanguagePairId = activeId;
  });

  private readonly reloadOnAllowedIdsChange = effect(() => {
    this.allowedScenarioIds();
    void this.load();
  });

  ngOnInit(): void {
    void this.load();
  }

  /**
   * Loads scenarios from `ScenarioSearchService` based on current signals.
   *
   * @remarks
   * Applies the current query, scope, active language pair criteria, and pagination
   * parameters. Filters results by `allowedScenarioIds` when set. Updates `items`,
   * `totalItems`, and `loading` signals. Auto-selects the first scenario if enabled.
   */
  async load(): Promise<void> {
    this.loading.set(true);

    try {
      const allowed = this.allowedScenarioIds();
      const isScopedByIds = allowed !== null && allowed.length > 0;

      // When the result set is explicitly limited by `allowedScenarioIds`
      // (lesson/course scope), the scenarios are fetched by their exact IDs:
      // the backend list endpoint applies pair filters and caps the page size,
      // so a broad search can miss the lesson's scenarios entirely.
      // In the unscoped mode the regular search is used with the active
      // language-pair criteria applied.
      let filtered: readonly ScenarioIndexEntry[];
      if (isScopedByIds) {
        const scenarios = await this.scenarioSearchService.getByIdBatch(allowed);
        const query = this.query().trim().toLowerCase();
        filtered = scenarios
          .map(scenarioToIndexEntry)
          .filter((entry) => !query || entry.title.toLowerCase().includes(query));
      } else {
        const pair = this.userStore.languagePair();
        const page = await this.scenarioSearchService.search({
          query: this.query().trim() || undefined,
          scope: this.scope(),
          ...activeLanguagePairCriteria(pair),
          page: {
            page: this.pageIndex(),
            pageSize: this.pageSize(),
          },
        });
        filtered = page.items ?? [];
      }

      this.items.set(filtered);
      this.totalItems.set(filtered.length);

      const current = this.selectedScenarioId();
      const hasCurrent = filtered.some((item: ScenarioIndexEntry) => item.id === current);
      if (!hasCurrent && filtered.length > 0 && this.autoSelectFirst()) {
        this.pick(filtered[0]);
      } else if (hasCurrent) {
        const entry = filtered.find((item: ScenarioIndexEntry) => item.id === current);
        if (entry) {
          this.safeEmit(this.scenarioLabelChange, this.formatLabel(entry));
        }
      }
      // Note: an empty filtered list must NOT clear the current selection —
      // clearing is owned by the parent flow (lesson/difficulty change
      // handlers) and by explicit user actions in the picker.
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Picks a scenario and emits selection events.
   *
   * @param entry - The scenario index entry to pick.
   */
  pick(entry: ScenarioIndexEntry): void {
    this.safeEmit(this.selectedScenarioIdChange, entry.id);
    this.safeEmit(this.scenarioLabelChange, this.formatLabel(entry));
  }

  /**
   * Handles query text changes.
   *
   * @param value - The new query string.
   * @remarks Resets page index and reloads the list.
   */
  onQueryChange(value: string): void {
    this.query.set(value);
    this.pageIndex.set(0);
    void this.load();
  }

  /**
   * Handles scope changes.
   *
   * @param scope - The new scope value.
   * @remarks Resets page index and reloads the list.
   */
  onScopeChange(scope: ScenarioListScope): void {
    this.scope.set(scope);
    this.pageIndex.set(0);
    void this.load();
  }

  /**
   * Handles pagination changes.
   *
   * @param event - The page event containing the new page index and page size.
   * @remarks Updates the page index and page size signals, then reloads the list.
   */
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    void this.load();
  }

  /**
   * Safely emits an output — no-op if the component is destroyed.
   * Prevents NG0953 "Unexpected emit for destroyed OutputRef".
   */
  private safeEmit<T>(emitter: { emit(value: T): void }, value: T): void {
    if (!this.destroyed()) {
      emitter.emit(value);
    }
  }

  /**
   * Formats a scenario entry into a display label.
   *
   * @param entry - The scenario index entry.
   * @returns A formatted string with title, card source summary, and language pair.
   */
  formatLabel(entry: ScenarioIndexEntry): string {
    const pairBadge = entry.languagePairSummary ? ` · ${entry.languagePairSummary}` : '';
    return `${entry.title} · ${entry.cardSourceSummary}${pairBadge}`;
  }
}
