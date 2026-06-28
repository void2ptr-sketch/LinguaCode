import { Component, effect, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { PageEvent } from '@angular/material/paginator';

import type { CourseListScope } from '../../../../core/models';
import { UiPaginationComponent } from '../../../../shared/pagination';
import { UserStore } from '../../../../core/state';
import { CourseBuilderDialogService } from '../course-builder-dialog/course-builder-dialog.service';
import { CourseBuilderStore } from '../../services/course-builder.store';

let lastKnownCourseBuilderActiveLanguagePairId: string | null = null;

@Component({
  selector: 'app-course-builder-page',
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    UiPaginationComponent,
  ],
  templateUrl: './course-builder-page.component.html',
  styleUrl: './course-builder-page.component.scss',
})
export class CourseBuilderPageComponent implements OnInit {
  readonly store = inject(CourseBuilderStore);
  readonly userStore = inject(UserStore);
  private readonly courseBuilderDialog = inject(CourseBuilderDialogService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly reloadOnActivePairChange = effect(() => {
    const activeId = this.userStore.activeLanguagePairId();

    if (
      lastKnownCourseBuilderActiveLanguagePairId !== null &&
      lastKnownCourseBuilderActiveLanguagePairId !== activeId
    ) {
      void this.store.loadList();
    }

    lastKnownCourseBuilderActiveLanguagePairId = activeId;
  });

  async ngOnInit(): Promise<void> {
    await this.store.load();
  }

  async startCreate(): Promise<void> {
    const result = await this.courseBuilderDialog.openCreate();
    if (result?.saved) {
      await this.store.loadList();
    }
  }

  async startEdit(courseId: string): Promise<void> {
    const result = await this.courseBuilderDialog.openEdit(courseId);
    if (result?.saved) {
      await this.store.loadList();
    }
  }

  async deleteCourse(courseId: string): Promise<void> {
    await this.store.deleteCourse(courseId);
  }

  onListQueryChange(value: string): void {
    this.store.setListQuery(value);
    void this.store.loadList();
  }

  onListScopeChange(scope: CourseListScope): void {
    this.store.setListScope(scope);
    void this.store.loadList();
  }

  onListPageChange(event: PageEvent): void {
    this.store.setPage(event.pageIndex, event.pageSize);
    void this.store.loadList();
  }

  isOwnCourse(authorId: string): boolean {
    return authorId === this.userStore.user().id;
  }

  async exportCourse(courseId: string): Promise<void> {
    const json = await this.store.exportCourseBundle(courseId);
    if (!json) {
      const error = this.store.exportError();
      if (error) {
        this.snackBar.open(error, 'Закрыть', { duration: 8000 });
      }
      return;
    }

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${courseId}.linguacode-course.json`;
    anchor.click();
    URL.revokeObjectURL(url);

    this.snackBar.open(
      'Файл экспортирован. Передайте его maintainer’у для добавления в общий каталог.',
      'Закрыть',
      { duration: 10000 },
    );
  }
}
