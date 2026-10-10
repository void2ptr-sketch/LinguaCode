import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CardAppearanceDraft } from '../../types';

/**
 * Form fields component for card appearance settings (theme, font size).
 * @remarks Binds to `CardAppearanceDraft` via two-way binding pattern using `input()` and `output()`.
 */
@Component({
  selector: 'app-card-appearance-fields',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './card-appearance-fields.component.html',
  styleUrl: './card-appearance-fields.component.scss',
})
export class CardAppearanceFieldsComponent {
  /**
   * Required card appearance draft data (theme, font size).
   * @remarks
   * Bound with two-way binding (`[(appearance)]`) in parent templates.
   */
  readonly appearance = input.required<CardAppearanceDraft>();

  /**
   * Emits updated appearance data when the user changes theme or font size.
   * @remarks
   * Used with two-way binding: `(appearanceChange)="onAppearanceChange($event)"`.
   */
  readonly appearanceChange = output<CardAppearanceDraft>();

  /**
   * Updates the theme and emits the change.
   *
   * @param theme - The new theme string.
   */
  updateTheme(theme: string): void {
    this.appearanceChange.emit({ ...this.appearance(), theme });
  }

  /**
   * Updates the font size and emits the change.
   *
   * @param fontSize - The new font size ('sm', 'md', or 'lg').
   */
  updateFontSize(fontSize: 'sm' | 'md' | 'lg'): void {
    this.appearanceChange.emit({ ...this.appearance(), fontSize });
  }
}
