import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CardAppearanceDraft } from '../../types';

@Component({
  selector: 'app-card-appearance-fields',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './card-appearance-fields.component.html',
  styleUrl: './card-appearance-fields.component.scss',
})
export class CardAppearanceFieldsComponent {
  readonly appearance = input.required<CardAppearanceDraft>();

  readonly appearanceChange = output<CardAppearanceDraft>();

  updateTheme(theme: string): void {
    this.appearanceChange.emit({ ...this.appearance(), theme });
  }

  updateFontSize(fontSize: 'sm' | 'md' | 'lg'): void {
    this.appearanceChange.emit({ ...this.appearance(), fontSize });
  }
}
