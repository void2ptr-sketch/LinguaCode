import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CourseBuilderStore } from '../../services/course-builder.store';
import {
  courseToFormDraft,
  emptyCourseFormDraft,
  serializeCourseFormDraft,
} from '../../utils/course-form-draft.utils';
import { CourseFormComponent } from '../course-form/course-form.component';
import type {
  CourseBuilderDialogData,
  CourseBuilderDialogResult,
} from './course-builder-dialog.types';
import type { CourseFormDraft } from '../../types';

@Component({
  selector: 'app-course-builder-dialog',
  imports: [MatButtonModule, MatDialogModule, MatProgressSpinnerModule, CourseFormComponent],
  templateUrl: './course-builder-dialog.component.html',
  styleUrl: './course-builder-dialog.component.scss',
})
export class CourseBuilderDialogComponent implements OnInit {
  private readonly dialogRef =
    inject<MatDialogRef<CourseBuilderDialogComponent, CourseBuilderDialogResult>>(MatDialogRef);
  readonly data = inject<CourseBuilderDialogData>(MAT_DIALOG_DATA);
  readonly store = inject(CourseBuilderStore);

  readonly draft = signal<CourseFormDraft>(emptyCourseFormDraft());
  private readonly initialSnapshot = signal('');

  readonly dirty = computed(
    () => serializeCourseFormDraft(this.draft()) !== this.initialSnapshot(),
  );

  readonly title = computed(() => {
    if (this.data.mode === 'create') {
      return 'Новый курс';
    }

    return this.store.isReadOnly() ? 'Просмотр курса' : 'Редактирование курса';
  });

  async ngOnInit(): Promise<void> {
    if (this.data.mode === 'create') {
      this.store.startCreate();
      const nextDraft = emptyCourseFormDraft();
      this.draft.set(nextDraft);
      this.initialSnapshot.set(serializeCourseFormDraft(nextDraft));
      return;
    }

    await this.store.startEdit(this.data.courseId);
    const course = this.store.editingCourse();
    if (!course) {
      this.dialogRef.close(undefined);
      return;
    }

    const nextDraft = courseToFormDraft(course);
    this.draft.set(nextDraft);
    this.initialSnapshot.set(serializeCourseFormDraft(nextDraft));
  }

  updateDraft(nextDraft: CourseFormDraft): void {
    this.draft.set(nextDraft);
  }

  async saveCourse(): Promise<void> {
    const saved =
      this.data.mode === 'create'
        ? await this.store.createCourse(this.draft())
        : await this.store.updateCourse(this.data.courseId, this.draft());

    if (saved) {
      this.dialogRef.close({ saved: true });
    }
  }

  close(): void {
    this.dialogRef.close(undefined);
  }
}
