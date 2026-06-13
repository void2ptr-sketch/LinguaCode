import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { pinyinToPalladius } from '../../../../core/data/cjk-romanization.utils';
import type { LexemeDraftFields } from '../../../../core/data/lexeme-draft.utils';
import type { ScriptCode } from '../../../../core/models/phonetic-content.types';

@Component({
  selector: 'app-lexeme-fields',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './lexeme-fields.component.html',
  styleUrl: './lexeme-fields.component.scss',
})
export class LexemeFieldsComponent {
  readonly fields = input.required<LexemeDraftFields>();
  readonly label = input('Лексема');
  readonly compact = input(false);

  readonly fieldsChange = output<LexemeDraftFields>();

  readonly scriptOptions: readonly { value: ScriptCode; label: string }[] = [
    { value: 'latn', label: 'Латиница' },
    { value: 'hani', label: 'Иероглифы (Han)' },
  ];

  updateField<K extends keyof LexemeDraftFields>(key: K, value: LexemeDraftFields[K]): void {
    this.fieldsChange.emit({ ...this.fields(), [key]: value });
  }

  fillPalladiusFromPinyin(): void {
    const pinyin = this.fields().pinyin.trim();
    if (!pinyin) {
      return;
    }

    this.fieldsChange.emit({
      ...this.fields(),
      palladius: pinyinToPalladius(pinyin),
    });
  }
}
