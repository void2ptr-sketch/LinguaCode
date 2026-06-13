import { Component, input, output } from '@angular/core';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-pagination',
  imports: [MatPaginatorModule],
  templateUrl: './ui-pagination.component.html',
  styleUrl: './ui-pagination.component.scss',
})
export class UiPaginationComponent {
  readonly length = input.required<number>();
  readonly pageIndex = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly pageSizeOptions = input<readonly number[]>([5, 10, 25]);
  readonly pageChange = output<PageEvent>();
}
