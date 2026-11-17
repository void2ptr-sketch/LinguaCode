import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

/** Data for {@link CardDeleteConfirmDialogComponent}. */
export type CardDeleteConfirmDialogData = {
  /** Title of the card that is about to be deleted. */
  cardTitle: string;
};

/**
 * Confirmation dialog for deleting a card from the content explorer.
 * @remarks Returns `true` to confirm deletion, `false`/`undefined` to cancel.
 */
@Component({
  standalone: true,
  selector: 'app-card-delete-confirm-dialog',
  imports: [MatButtonModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Удалить карточку?</h2>
    <mat-dialog-content>
      Карточка «{{ data.cardTitle }}» будет помечена как удалённая и скроется из каталога.
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
export class CardDeleteConfirmDialogComponent {
  readonly data = inject<CardDeleteConfirmDialogData>(MAT_DIALOG_DATA);
}
