import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-card-editor-discard-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Закрыть без сохранения?</h2>
    <mat-dialog-content>Несохранённые изменения будут потеряны.</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Остаться</button>
      <button mat-flat-button type="button" color="warn" [mat-dialog-close]="true">Закрыть</button>
    </mat-dialog-actions>
  `,
})
export class CardEditorDiscardDialogComponent {}
