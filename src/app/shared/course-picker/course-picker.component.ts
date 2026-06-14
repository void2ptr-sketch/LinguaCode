import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { PageEvent } from '@angular/material/paginator';

import { CourseSearchService } from '../../core/data';
import { activeLanguagePairCriteria } from '../../core/data/language-pair-scope.utils';
import type { CourseIndexEntry, CourseListScope } from '../../core/models';
import { UserStore } from '../../core/state';
import { UiPaginationComponent } from '../pagination';

let lastKnownCoursePickerActiveLanguagePairId: string | null = null;

@Component({
  selector: 'app-course-picker',
  imports: [
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
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

  readonly selectedCourseId = input.required<string>();
  readonly defaultScope = input<CourseListScope>('published');

  readonly selectedCourseIdChange = output<string>();
  readonly courseLabelChange = output<string>();

  readonly query = signal('');
  readonly scope = signal<CourseListScope>('published');
  readonly items = signal<readonly CourseIndexEntry[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly loading = signal(false);

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

  pick(entry: CourseIndexEntry): void {
    this.selectedCourseIdChange.emit(entry.id);
    this.courseLabelChange.emit(this.formatLabel(entry));
  }

  clearSelection(): void {
    this.selectedCourseIdChange.emit('');
    this.courseLabelChange.emit('');
  }

  onQueryChange(value: string): void {
    this.query.set(value);
    this.pageIndex.set(0);
    void this.load();
  }

  onScopeChange(scope: CourseListScope): void {
    this.scope.set(scope);
    this.pageIndex.set(0);
    void this.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    void this.load();
  }

  formatLabel(entry: CourseIndexEntry): string {
    return `${entry.title} · ${entry.lessonCount} уроков · ${entry.languagePairSummary}`;
  }
}
