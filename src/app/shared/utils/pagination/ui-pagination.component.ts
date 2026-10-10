import { Component, input, output } from '@angular/core';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';

/**
 * UI component for pagination controls.
 *
 * @remarks
 * Standalone wrapper around Angular Material's MatPaginator.
 * Provides a simple interface for pagination state and events.
 *
 * @example
 * ```html
 * <app-pagination
 *   [length]="totalItems"
 *   [pageIndex]="currentPage"
 *   [pageSize]="itemsPerPage"
 *   (pageChange)="handlePageChange($event)">
 * </app-pagination>
 * ```
 */
@Component({
  standalone: true,
  selector: 'app-pagination',
  imports: [MatPaginatorModule],
  templateUrl: './ui-pagination.component.html',
  styleUrl: './ui-pagination.component.scss',
})
export class UiPaginationComponent {
  /** Total number of items to paginate. */
  readonly length = input.required<number>();

  /** Current zero-based page index. */
  readonly pageIndex = input.required<number>();

  /** Number of items per page. */
  readonly pageSize = input.required<number>();

  /** Available page size options. Defaults to [5, 10, 25]. */
  readonly pageSizeOptions = input<readonly number[]>([5, 10, 25]);

  /** Emits when the page changes (index, size, or both). */
  readonly pageChange = output<PageEvent>();
}
