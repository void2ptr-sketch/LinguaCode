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

  /** ID of the currently selected scenario. */
  readonly selectedScenarioId = input.required<string>();

  /**
   * Optional filter: only these scenario IDs are selectable.
   *
   * @remarks
   * When null, all scenarios in the selected scope are available.
   */
  readonly allowedScenarioIds = input<readonly string[] | null>(null);

  /** Automatically select the first scenario when the list loads. */
  readonly autoSelectFirst = input(true);

  /** Emits when the selected scenario ID changes. */
  readonly selectedScenarioIdChange = output<string>();

  /** Emits when the selected scenario label changes. */
  readonly scenarioLabelChange = output<string>();

  readonly query = signal('');
  readonly scope = signal<ScenarioListScope>('published');
  readonly items = signal<readonly ScenarioIndexEntry[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
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
