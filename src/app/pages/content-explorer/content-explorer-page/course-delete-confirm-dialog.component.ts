import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

/** Data for {@link CourseDeleteConfirmDialogComponent}. */
export type CourseDeleteConfirmDialogData = {
  /** Title of the course that is about to be deleted. */
  courseTitle: string;
};

/**
 * Confirmation dialog for deleting a course from the content explorer.
 * @remarks Returns `true` to confirm deletion, `false`/`undefined` to cancel.
 */
@Component({
  standalone: true,
  selector: 'app-course-delete-confirm-dialog',
  imports: [MatButtonModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Удалить курс?</h2>
    <mat-dialog-content>
      Курс «{{ data.courseTitle }}» и все связанные с ним данные будут удалены безвозвратно.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Отмена</button>
      <button mat-flat-button type="button" color="warn" [mat-dialog-close]="true">Удалить</button>
    </mat-dialog-actions>
  `,
})
export class CourseDeleteConfirmDialogComponent {
  readonly data = inject<CourseDeleteConfirmDialogData>(MAT_DIALOG_DATA);
}
