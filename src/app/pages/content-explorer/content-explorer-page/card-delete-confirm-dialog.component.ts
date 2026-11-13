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
      Карточка «{{ data.cardTitle }}» будет удалена безвозвратно. Убедитесь, что карточка не
      используется в других сценариях.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Отмена</button>
      <button mat-flat-button type="button" color="warn" [mat-dialog-close]="true">Удалить</button>
    </mat-dialog-actions>
  `,
})
export class CardDeleteConfirmDialogComponent {
  readonly data = inject<CardDeleteConfirmDialogData>(MAT_DIALOG_DATA);
}
