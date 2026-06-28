import { Component, effect, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { PageEvent } from '@angular/material/paginator';

import type { ScenarioListScope } from '../../../../core/models';
import { UiPaginationComponent } from '../../../../shared/pagination';
import { UserStore } from '../../../../core/state';
import { ScenarioBuilderDialogService } from '../scenario-builder-dialog/scenario-builder-dialog.service';
import { ScenarioBuilderStore } from '../../services/scenario-builder.store';

let lastKnownScenarioBuilderActiveLanguagePairId: string | null = null;

@Component({
  selector: 'app-scenario-builder-page',
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    UiPaginationComponent,
  ],
  templateUrl: './scenario-builder-page.component.html',
  styleUrl: './scenario-builder-page.component.scss',
})
export class ScenarioBuilderPageComponent implements OnInit {
  readonly store = inject(ScenarioBuilderStore);
  readonly userStore = inject(UserStore);
  private readonly scenarioBuilderDialog = inject(ScenarioBuilderDialogService);

  private readonly reloadOnActivePairChange = effect(() => {
    const activeId = this.userStore.activeLanguagePairId();

    if (
      lastKnownScenarioBuilderActiveLanguagePairId !== null &&
      lastKnownScenarioBuilderActiveLanguagePairId !== activeId
    ) {
      void this.store.loadList();
    }

    lastKnownScenarioBuilderActiveLanguagePairId = activeId;
  });

  async ngOnInit(): Promise<void> {
    await this.store.load();
  }

  async startCreate(): Promise<void> {
    const result = await this.scenarioBuilderDialog.openCreate();
    if (result?.saved) {
      await this.store.loadList();
    }
  }

  async startEdit(scenarioId: string): Promise<void> {
    const result = await this.scenarioBuilderDialog.openEdit(scenarioId);
    if (result?.saved) {
      await this.store.loadList();
    }
  }

  async deleteScenario(scenarioId: string): Promise<void> {
    await this.store.deleteScenario(scenarioId);
  }

  onListQueryChange(value: string): void {
    this.store.setListQuery(value);
    void this.store.loadList();
  }

  onListScopeChange(scope: ScenarioListScope): void {
    this.store.setListScope(scope);
    void this.store.loadList();
  }

  async onCourseFilterChange(courseId: string | null): Promise<void> {
    await this.store.setListCourseId(courseId);
  }

  onListPageChange(event: PageEvent): void {
    this.store.setPage(event.pageIndex, event.pageSize);
    void this.store.loadList();
  }

  isOwnScenario(authorId: string): boolean {
    return authorId === this.userStore.user().id;
  }

  courseTitle(courseId: string | undefined): string | null {
    if (!courseId) {
      return null;
    }

    const course = this.store.courses().find((c) => c.id === courseId);
    return course?.title ?? null;
  }
}
