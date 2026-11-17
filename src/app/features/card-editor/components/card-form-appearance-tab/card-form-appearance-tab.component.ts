import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { CardDraft } from '../../types';
import { CardAppearanceFieldsComponent } from '../card-appearance-fields/card-appearance-fields.component';

/**
 * Appearance tab component for the card form.
 *
 * @remarks
 * Wraps the shared appearance fields (theme and font size). The future
 * `direction` field intentionally stays unexposed in this task.
 */
@Component({
  selector: 'app-card-form-appearance-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardAppearanceFieldsComponent],
  templateUrl: './card-form-appearance-tab.component.html',
  styleUrl: './card-form-appearance-tab.component.scss',
})
export class CardFormAppearanceTabComponent {
  /** Required card draft being edited. */
  readonly draft = input.required<CardDraft>();

  /** Emits the updated card draft when appearance changes. */
  readonly draftChange = output<CardDraft>();

  /**
   * Updates the card appearance and emits the updated draft.
   *
   * @param appearance - The new appearance configuration.
   */
  updateAppearance(appearance: CardDraft['appearance']): void {
    this.draftChange.emit({ ...this.draft(), appearance });
  }
}
