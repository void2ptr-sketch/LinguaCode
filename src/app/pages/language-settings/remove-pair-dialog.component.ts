import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

import { buildLanguageLabels } from '../../entities/language-pair/lib/language-pair.utils';
import { LanguageService } from '../../entities/language-pair/lib/language.service';
import type { DirectionCardEvent } from './direction-card/direction-card.component';

/**
 * Confirmation dialog for removing a language pair direction.
 *
 * @remarks
 * Shows the pair identity (e.g. "RU → English") and asks for confirmation.
 * Returns `true` to confirm removal, `false` to cancel.
 */
@Component({
  standalone: true,
  selector: 'app-remove-pair-dialog',
  imports: [MatButtonModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Удалить направление?</h2>
    <mat-dialog-content>
      <p>Вы собираетесь удалить направление:</p>
      <p class="remove-pair-dialog__pair">
        <strong>{{ labelKnown() }}</strong>
        <span class="remove-pair-dialog__arrow">→</span>
        <strong>{{ labelLearning() }}</strong>
      </p>
      <p class="remove-pair-dialog__hint">Это действие нельзя отменить.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Отмена</button>
      <button mat-flat-button type="button" color="warn" [mat-dialog-close]="true">Удалить</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .remove-pair-dialog__pair {
        font-size: 1.25rem;
        margin: 0.5rem 0;
        text-align: center;
      }
      .remove-pair-dialog__arrow {
        margin: 0 0.5rem;
        color: var(--mat-sys-outline);
      }
      .remove-pair-dialog__hint {
        margin: 0.5rem 0 0;
        color: var(--mat-sys-on-surface-variant);
        font-size: 0.875rem;
      }
    `,
  ],
})
export class RemovePairDialogComponent {
  private readonly data = inject<DirectionCardEvent>(MAT_DIALOG_DATA);
  private readonly languageService = inject(LanguageService);

  protected readonly labelKnown = computed(() => {
    const labels = buildLanguageLabels(this.languageService.languages());
    return labels[this.data.known] ?? this.data.known;
  });
  protected readonly labelLearning = computed(() => {
    const labels = buildLanguageLabels(this.languageService.languages());
    return labels[this.data.learning] ?? this.data.learning;
  });
}
