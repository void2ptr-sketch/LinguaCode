import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

/** Data for {@link ProgramDeleteConfirmDialogComponent}. */
export type ProgramDeleteConfirmDialogData = {
  /** Title of the program that is about to be deleted. */
  programTitle: string;
};

/**
 * Confirmation dialog for deleting a program from the content explorer.
 * @remarks Returns `true` to confirm deletion, `false`/`undefined` to cancel.
 */
@Component({
  standalone: true,
  selector: 'app-program-delete-confirm-dialog',
  imports: [MatButtonModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Удалить программу?</h2>
    <mat-dialog-content>
      Программа «{{ data.programTitle }}» и все связанные с ней данные (уроки, сценарии, карточки)
      будут помечены как удалённые и скроются из каталога.
      <p class="hint">Контент можно восстановить через API.</p>
    </mat-dialog-content>
    <style>
      .hint {
        margin-top: 0.75rem;
        font-size: 0.875rem;
        color: var(--mat-sys-on-surface-variant);
      }
    </style>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Отмена</button>
      <button mat-flat-button type="button" color="warn" [mat-dialog-close]="true">Удалить</button>
    </mat-dialog-actions>
  `,
})
export class ProgramDeleteConfirmDialogComponent {
  readonly data = inject<ProgramDeleteConfirmDialogData>(MAT_DIALOG_DATA);
}
