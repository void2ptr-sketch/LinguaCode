import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { pinyinToPalladius } from '../../../../core/data/chinese/cjk-romanization.utils';
import { lookupEnglishIpa } from '../../../../core/data/ipa/ipa-en-lookup.utils';
import { pinyinToIpa } from '../../../../core/data/chinese/pinyin-to-ipa.utils';
import type { LexemeDraftFields } from '../../../../core/data/chinese/lexeme-draft.utils';
import type { ContentLanguage } from '../../../../core/models';
import type { ScriptCode } from '../../../../core/models/phonetic-content.types';
import {
  defaultScriptForLanguages,
  isEnLearningPair,
  isRuZhPair,
} from '../../utils/card-editor-ux.utils';

@Component({
  selector: 'app-lexeme-fields',
  imports: [
    FormsModule,
    MatButtonModule,
    MatExpansionModule,
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
  readonly knownLanguage = input<ContentLanguage | null>(null);
  readonly learningLanguage = input<ContentLanguage | null>(null);

  readonly fieldsChange = output<LexemeDraftFields>();

  readonly advancedExpanded = signal(false);

  readonly scriptOptions: readonly { value: ScriptCode; label: string }[] = [
    { value: 'latn', label: 'Латиница' },
    { value: 'hani', label: 'Иероглифы (Han)' },
  ];

  readonly pairScoped = computed(
    () => this.knownLanguage() !== null && this.learningLanguage() !== null,
  );

  readonly ruZhPair = computed(() => {
    const known = this.knownLanguage();
    const learning = this.learningLanguage();
    return known !== null && learning !== null && isRuZhPair(known, learning);
  });

  readonly enLearningPair = computed(() => {
    const known = this.knownLanguage();
    const learning = this.learningLanguage();
    return known !== null && learning !== null && isEnLearningPair(known, learning);
  });

  readonly showLegacyLayout = computed(() => !this.pairScoped());

  readonly showPinyin = computed(() => this.showLegacyLayout() || this.ruZhPair());
  readonly showPalladius = computed(() => this.showLegacyLayout() || this.ruZhPair());
  readonly showIpa = computed(() => this.showLegacyLayout() || this.enLearningPair());
  readonly showScript = computed(() => this.showLegacyLayout());
  readonly showAdvancedPanel = computed(() => this.pairScoped() && !this.showLegacyLayout());

  updateField<K extends keyof LexemeDraftFields>(key: K, value: LexemeDraftFields[K]): void {
    this.fieldsChange.emit({ ...this.fields(), [key]: value });
  }

  updatePrimary(value: string): void {
    const known = this.knownLanguage();
    const learning = this.learningLanguage();
    const next: LexemeDraftFields = { ...this.fields(), primary: value };

    if (known !== null && learning !== null && !next.script) {
      next.script = defaultScriptForLanguages(known, learning);
    }

    this.fieldsChange.emit(next);
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

  fillIpaFromEnglish(): void {
    const word = this.fields().primary.trim();
    if (!word) {
      return;
    }

    const ipa = lookupEnglishIpa(word);
    if (!ipa) {
      return;
    }

    this.fieldsChange.emit({
      ...this.fields(),
      ipa,
    });
  }

  fillIpaFromPinyin(): void {
    const pinyin = this.fields().pinyin.trim();
    if (!pinyin) {
      return;
    }

    this.fieldsChange.emit({
      ...this.fields(),
      ipa: pinyinToIpa(pinyin),
    });
  }
}
