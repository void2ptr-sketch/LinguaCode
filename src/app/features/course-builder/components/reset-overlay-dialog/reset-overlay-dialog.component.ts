/**
 * Диалоговое окно сброса пользовательских данных (overlay).
 *
 * Используется при добавлении новых карточек/сценариев из файлов,
 * если они не отображаются в интерфейсе из-за конфликта с localStorage.
 *
 * Сценарий использования:
 * 1. Пользователь добавляет новые карточки в public/data/*.json
 * 2. Открывает курс в конструкторе
 * 3. Нажимает "Сбросить overlay"
 * 4. Подтверждает действие
 * 5. localStorage очищается, страница перезагружается
 * 6. Данные загружаются из файлов (seed)
 */
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

/**
 * Диалоговое окно подтверждения сброса overlay.
 *
 * Отображает предупреждение о том, что все пользовательские данные
 * будут удалены, а seed-данные из файлов будут загружены заново.
 *
 * Пример использования:
 * ```typescript
 * const dialogRef = this.dialog.open(ResetOverlayDialogComponent);
 * dialogRef.afterClosed().subscribe((confirmed) => {
 *   if (confirmed) {
 *     localStorage.removeItem('lingua-code.user-content-overlay');
 *     location.reload();
 *   }
 * });
 * ```
 */
@Component({
  selector: 'app-reset-overlay-dialog',
  template: `
    <h2 mat-dialog-title>Сбросить пользовательские данные?</h2>
    <mat-dialog-content>
      <p>Это действие удалит все пользовательские карточки, сценарии и курсы, созданные в интерфейсе.</p>
      <p><strong>Seed-данные из файлов (public/data/) будут загружены заново.</strong></p>
      <p>После сброса нужно перезагрузить страницу.</p>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button mat-dialog-close>Отмена</button>
      <button mat-flat-button color="warn" (click)="dialogRef.close(true)">Сбросить</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      margin: 20px 0;
    }
    mat-dialog-actions {
      justify-content: flex-end;
    }
  `],
  imports: [MatButtonModule, MatDialogModule],
  standalone: true,
})
export class ResetOverlayDialogComponent {
  /**
   * Ссылка на диалоговое окно для управления закрытием.
   * Вызывает dialogRef.close(true) при подтверждении сброса.
   */
  readonly dialogRef = inject(MatDialogRef<ResetOverlayDialogComponent>);
}
