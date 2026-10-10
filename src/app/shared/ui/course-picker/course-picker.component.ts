import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { PageEvent } from '@angular/material/paginator';

import { CourseSearchService } from '../../../core/data';
import { activeLanguagePairCriteria } from '../../../core/data/language-pair/language-pair-scope.utils';
import type { CourseIndexEntry, CourseListScope } from '../../../core/models';
import { UserStore } from '../../../core/state';
import { UiPaginationComponent } from '../../utils/pagination';

let lastKnownCoursePickerActiveLanguagePairId: string | null = null;

/**
 * Course picker component. Provides a searchable, paginated list of courses
 * with scope filtering and compact display mode.
 *
 * @remarks
 * Loads courses from `CourseSearchService`, filtered by the active language pair.
 * Supports expanding to a full list and clearing selection.
 */
@Component({
  selector: 'app-course-picker',
  imports: [
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    UiPaginationComponent,
  ],
  templateUrl: './course-picker.component.html',
  styleUrl: './course-picker.component.scss',
})
export class CoursePickerComponent implements OnInit {
  private readonly courseSearchService = inject(CourseSearchService);
  private readonly userStore = inject(UserStore);

  /**
   * ID of the currently selected course.
   * @remarks This is a required input that drives the course search query.
   */
  readonly selectedCourseId = input.required<string>();

  /**
   * Display label for the currently selected course.
   * @remarks Updated via `courseLabelChange` output when the user picks a course.
   */
  readonly selectedCourseLabel = input<string>('');

  /**
   * Default scope for course search (e.g. 'published', 'all').
   * @remarks
   * Applied on initialization via `ngOnInit`. Can be changed dynamically.
   */
  readonly defaultScope = input<CourseListScope>('published');

  /**
   * Render in compact mode (smaller padding, no search bar).
   * @remarks
   * When true, hides the search input and collapses the full list on selection.
   */
  readonly compact = input(false);

  /**
   * Emits when the selected course ID changes.
   * @remarks Payload is the new course ID string.
   */
  readonly selectedCourseIdChange = output<string>();

  /**
   * Emits when the selected course label changes.
   * @remarks Payload is the formatted label string.
   */
  readonly courseLabelChange = output<string>();

  /**
   * Current search query text.
   * @remarks
   * Updates trigger a reload of the course list with the new filter.
   */
  readonly query = signal('');

  /**
   * Current search scope.
   * @remarks
   * Defaults to 'published'. Updates trigger a reload of the course list.
   */
  readonly scope = signal<CourseListScope>('published');

  /**
   * Paginated list of matching course entries.
   * @remarks
   * Populated by `load()` after a successful search request.
   */
  readonly items = signal<readonly CourseIndexEntry[]>([]);

  /**
   * Total number of matching courses (for pagination).
   * @remarks
   * Used to calculate the total number of pages.
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
   * Defaults to 10. Can be adjusted via pagination controls.
   */
  readonly pageSize = signal(10);

  /**
   * Whether a course search request is in progress.
   * @remarks
   * Set to true at the start of `load()` and reset in the finally block.
   */
  readonly loading = signal(false);

  /**
   * Whether the full (unpaginated) course list is displayed.
   * @remarks
   * When true, overrides pagination and shows all matching results.
   */
  readonly showFullList = signal(false);

  private readonly reloadOnActivePairChange = effect(() => {
    const activeId = this.userStore.activeLanguagePairId();

    if (
      lastKnownCoursePickerActiveLanguagePairId !== null &&
      lastKnownCoursePickerActiveLanguagePairId !== activeId
    ) {
      void this.load();
    }

    lastKnownCoursePickerActiveLanguagePairId = activeId;
  });

  ngOnInit(): void {
    this.scope.set(this.defaultScope());
    void this.load();
  }

  /**
   * Loads courses from `CourseSearchService` based on current signals.
   *
   * @remarks
   * Applies the current query, scope, active language pair criteria, and pagination
   * parameters. Updates `items`, `totalItems`, and `loading` signals.
   */
  async load(): Promise<void> {
    this.loading.set(true);

    try {
      const pair = this.userStore.languagePair();
      const page = await this.courseSearchService.search({
        query: this.query().trim() || undefined,
        scope: this.scope(),
        ...activeLanguagePairCriteria(pair),
        page: { page: this.pageIndex(), pageSize: this.pageSize() },
      });

      this.items.set(page.items);
      this.totalItems.set(page.totalItems);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Picks a course and emits selection events.
   *
   * @param entry - The course index entry to pick.
   * @remarks Collapses the full list if in compact mode.
   */
  pick(entry: CourseIndexEntry): void {
    this.selectedCourseIdChange.emit(entry.id);
    this.courseLabelChange.emit(this.formatLabel(entry));

    if (this.compact()) {
      this.showFullList.set(false);
    }
  }

  /**
   * Clears the current course selection.
   * @remarks Emits empty values and collapses the full list.
   */
  clearSelection(): void {
    this.selectedCourseIdChange.emit('');
    this.courseLabelChange.emit('');
    this.showFullList.set(false);
  }

  /**
   * Expands the course list to show all results.
   */
  expandList(): void {
    this.showFullList.set(true);
  }

  /**
   * Collapses the course list to paginated view.
   */
  collapseList(): void {
    this.showFullList.set(false);
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
  onScopeChange(scope: CourseListScope): void {
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
   * Formats a course entry into a display label.
   *
   * @param entry - The course index entry.
   * @returns A formatted string with title, lesson count, and language pair.
   */
  formatLabel(entry: CourseIndexEntry): string {
    return `${entry.title} · ${entry.lessonCount} уроков · ${entry.languagePairSummary}`;
  }
}
