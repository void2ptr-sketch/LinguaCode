import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { PageEvent } from '@angular/material/paginator';

import { ScenarioSearchService } from '../../../core/data';
import { activeLanguagePairCriteria } from '../../../core/data/language-pair/language-pair-scope.utils';
import type { ScenarioIndexEntry, ScenarioListScope } from '../../../core/models';
import { UserStore } from '../../../core/state';
import { UiPaginationComponent } from '../../utils/pagination';

let lastKnownScenarioPickerActiveLanguagePairId: string | null = null;

/**
 * Scenario picker component. Provides a searchable, paginated list of scenarios
 * with scope filtering and optional ID-based allowlisting.
 *
 * @remarks
 * Loads scenarios from `ScenarioSearchService`, filtered by the active language pair.
 * Supports auto-selecting the first scenario and limiting results via `allowedScenarioIds`.
 */
@Component({
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
      const pair = this.userStore.languagePair();
      const allowed = this.allowedScenarioIds();
      const page = await this.scenarioSearchService.search({
        query: this.query().trim() || undefined,
        scope: this.scope(),
        ...activeLanguagePairCriteria(pair),
        page: {
          page: allowed && allowed.length > 0 ? 0 : this.pageIndex(),
          pageSize: allowed && allowed.length > 0 ? 100 : this.pageSize(),
        },
      });

      const filtered =
        allowed && allowed.length > 0
          ? page.items.filter((item: ScenarioIndexEntry) => allowed.includes(item.id))
          : page.items;

      this.items.set(filtered);
      this.totalItems.set(filtered.length);

      const current = this.selectedScenarioId();
      const hasCurrent = filtered.some((item: ScenarioIndexEntry) => item.id === current);
      if (!hasCurrent && filtered.length > 0 && this.autoSelectFirst()) {
        this.pick(filtered[0]);
      } else if (hasCurrent) {
        const entry = filtered.find((item: ScenarioIndexEntry) => item.id === current);
        if (entry) {
          this.scenarioLabelChange.emit(this.formatLabel(entry));
        }
      } else if (filtered.length === 0) {
        this.selectedScenarioIdChange.emit('');
        this.scenarioLabelChange.emit('');
      }
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
    this.selectedScenarioIdChange.emit(entry.id);
    this.scenarioLabelChange.emit(this.formatLabel(entry));
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
