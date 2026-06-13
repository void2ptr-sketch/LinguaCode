import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { PageEvent } from '@angular/material/paginator';

import { ScenarioSearchService } from '../../core/data';
import { formatLanguagePair } from '../../core/data/language-pair.utils';
import type { ScenarioIndexEntry, ScenarioListScope } from '../../core/models';
import { UserStore } from '../../core/state';
import { UiPaginationComponent } from '../pagination';

@Component({
  selector: 'app-scenario-picker',
  imports: [
    FormsModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
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

  readonly selectedScenarioIdChange = output<string>();
  readonly scenarioLabelChange = output<string>();

  readonly query = signal('');
  readonly scope = signal<ScenarioListScope>('published');
  readonly items = signal<readonly ScenarioIndexEntry[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly loading = signal(false);

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);

    try {
      const page = await this.scenarioSearchService.search({
        query: this.query().trim() || undefined,
        scope: this.scope(),
        page: { page: this.pageIndex(), pageSize: this.pageSize() },
      });
      const pairLabel = formatLanguagePair(this.userStore.languagePair());
      const filtered = page.items.filter(
        (entry) => !entry.languagePairSummary || entry.languagePairSummary === pairLabel,
      );
      this.items.set(filtered);
      this.totalItems.set(filtered.length);

      const current = this.selectedScenarioId();
      const hasCurrent = page.items.some((item) => item.id === current);
      if (!hasCurrent && page.items.length > 0) {
        this.pick(page.items[0]);
      } else if (hasCurrent) {
        const entry = page.items.find((item) => item.id === current);
        if (entry) {
          this.scenarioLabelChange.emit(this.formatLabel(entry));
        }
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
