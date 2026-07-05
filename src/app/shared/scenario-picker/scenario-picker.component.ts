import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { PageEvent } from '@angular/material/paginator';

import { ScenarioSearchService } from '../../core/data';
import { activeLanguagePairCriteria } from '../../core/data/language-pair/language-pair-scope.utils';
import type { ScenarioIndexEntry, ScenarioListScope } from '../../core/models';
import { UserStore } from '../../core/state';
import { UiPaginationComponent } from '../pagination';

let lastKnownScenarioPickerActiveLanguagePairId: string | null = null;

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

  readonly selectedScenarioId = input.required<string>();
  readonly allowedScenarioIds = input<readonly string[] | null>(null);
  readonly autoSelectFirst = input(true);

  readonly selectedScenarioIdChange = output<string>();
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
          ? page.items.filter((item) => allowed.includes(item.id))
          : page.items;

      this.items.set(filtered);
      this.totalItems.set(filtered.length);

      const current = this.selectedScenarioId();
      const hasCurrent = filtered.some((item) => item.id === current);
      if (!hasCurrent && filtered.length > 0 && this.autoSelectFirst()) {
        this.pick(filtered[0]);
      } else if (hasCurrent) {
        const entry = filtered.find((item) => item.id === current);
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

  pick(entry: ScenarioIndexEntry): void {
    this.selectedScenarioIdChange.emit(entry.id);
    this.scenarioLabelChange.emit(this.formatLabel(entry));
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    this.pageIndex.set(0);
    void this.load();
  }

  onScopeChange(scope: ScenarioListScope): void {
    this.scope.set(scope);
    this.pageIndex.set(0);
    void this.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    void this.load();
  }

  formatLabel(entry: ScenarioIndexEntry): string {
    const pairBadge = entry.languagePairSummary ? ` · ${entry.languagePairSummary}` : '';
    return `${entry.title} · ${entry.cardSourceSummary}${pairBadge}`;
  }
}
