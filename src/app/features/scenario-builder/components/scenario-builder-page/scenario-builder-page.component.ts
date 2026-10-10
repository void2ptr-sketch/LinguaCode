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
import { UiPaginationComponent } from '../../../../shared/utils/pagination';
import { UserStore } from '../../../../core/state';
import { ScenarioBuilderDialogService } from '../scenario-builder-dialog/scenario-builder-dialog.service';
import { ScenarioBuilderStore } from '../../services/scenario-builder.store';

let lastKnownScenarioBuilderActiveLanguagePairId: string | null = null;

/**
 * Scenario builder page component. Displays a paginated list of scenarios with search,
 * filtering (my/published/all), and CRUD operations.
 * @remarks Reloads automatically when the active language pair changes.
 */
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
  /** Scenario builder state store. */
  readonly store = inject(ScenarioBuilderStore);
  /** User store for authentication and language pair data. */
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

  /**
   * Opens the scenario creation dialog.
   *
   * Reloads the scenario list if the scenario was successfully saved.
   */
  async startCreate(): Promise<void> {
    const result = await this.scenarioBuilderDialog.openCreate();
    if (result?.saved) {
      await this.store.loadList();
    }
  }

  /**
   * Opens the scenario edit dialog for an existing scenario.
   *
   * @param scenarioId - The ID of the scenario to edit.
   * @remarks Reloads the scenario list if the edit was saved.
   */
  async startEdit(scenarioId: string): Promise<void> {
    const result = await this.scenarioBuilderDialog.openEdit(scenarioId);
    if (result?.saved) {
      await this.store.loadList();
    }
  }

  /**
   * Deletes a scenario by its ID.
   *
   * @param scenarioId - The ID of the scenario to delete.
   * @remarks Reloads the scenario list after deletion.
   */
  async deleteScenario(scenarioId: string): Promise<void> {
    await this.store.deleteScenario(scenarioId);
  }

  /**
   * Handles search query changes from the input field.
   *
   * @param value - The new search query string.
   */
  onListQueryChange(value: string): void {
    this.store.setListQuery(value);
    void this.store.loadList();
  }

  /**
   * Handles list scope changes (my / published / all).
   *
   * @param scope - The new list scope.
   */
  onListScopeChange(scope: ScenarioListScope): void {
    this.store.setListScope(scope);
    void this.store.loadList();
  }

  /**
   * Handles course filter changes.
   *
   * @param courseId - The selected course ID, or `null` to clear the filter.
   */
  async onCourseFilterChange(courseId: string | null): Promise<void> {
    await this.store.setListCourseId(courseId);
  }

  /**
   * Handles pagination events from the UI paginator.
   *
   * @param event - The `PageEvent` containing the new page index and page size.
   */
  onListPageChange(event: PageEvent): void {
    this.store.setPage(event.pageIndex, event.pageSize);
    void this.store.loadList();
  }

  /**
   * Checks whether a scenario is owned by the current user.
   *
   * @param authorId - The scenario author's user ID.
   * @returns `true` if the author matches the current user.
   */
  isOwnScenario(authorId: string): boolean {
    return authorId === this.userStore.user().id;
  }

  /**
   * Returns the title of a course by its ID.
   *
   * @param courseId - The course identifier.
   * @returns The course title, or `null` if not found or ID is empty.
   */
  courseTitle(courseId: string | undefined): string | null {
    if (!courseId) {
      return null;
    }

    const course = this.store.courses().find((c) => c.id === courseId);
    return course?.title ?? null;
  }
}
