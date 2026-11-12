import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

/** Data for {@link ScenarioDeleteConfirmDialogComponent}. */
export type ScenarioDeleteConfirmDialogData = {
  /** Title of the scenario that is about to be deleted. */
  scenarioTitle: string;
};

/**
 * Confirmation dialog for deleting a scenario from the content explorer.
 * @remarks Returns `true` to confirm deletion, `false`/`undefined` to cancel.
 */
@Component({
  standalone: true,
  selector: 'app-scenario-delete-confirm-dialog',
  imports: [MatButtonModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Удалить сценарий?</h2>
    <mat-dialog-content>
      Сценарий «{{ data.scenarioTitle }}» будет удалён безвозвратно.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Отмена</button>
      <button mat-flat-button type="button" color="warn" [mat-dialog-close]="true">Удалить</button>
    </mat-dialog-actions>
  `,
})
export class ScenarioDeleteConfirmDialogComponent {
  readonly data = inject<ScenarioDeleteConfirmDialogData>(MAT_DIALOG_DATA);
}
