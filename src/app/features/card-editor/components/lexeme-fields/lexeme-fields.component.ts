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

/**
 * Lexeme fields component. Provides editable fields for lexeme data (primary, pinyin, IPA, palladius, script).
 * @remarks Supports language-pair-aware layouts with auto-fill helpers for Palladius, IPA from English, and IPA from Pinyin.
 */
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
  /** Required lexeme draft fields being edited. */
  readonly fields = input.required<LexemeDraftFields>();
  /** Display label for the lexeme section (default: 'Лексема'). */
  readonly label = input('Лексема');
  /** Whether to render in compact mode (fewer fields visible). */
  readonly compact = input(false);
  /** Known (source) language for language-pair-aware layout. */
  readonly knownLanguage = input<ContentLanguage | null>(null);
  /** Learning (target) language for language-pair-aware layout. */
  readonly learningLanguage = input<ContentLanguage | null>(null);

  /** Emits the updated lexeme fields when any field changes. */
  readonly fieldsChange = output<LexemeDraftFields>();

  /** Whether the advanced lexeme panel is expanded. */
  readonly advancedExpanded = signal(false);

  /** Available script options for lexeme display. */
  readonly scriptOptions: readonly { value: ScriptCode; label: string }[] = [
    { value: 'latn', label: 'Латиница' },
    { value: 'hani', label: 'Иероглифы (Han)' },
  ];

  /** Whether both known and learning languages are set (enables pair-scoped layout). */
  readonly pairScoped = computed(
    () => this.knownLanguage() !== null && this.learningLanguage() !== null,
  );

  /** Whether the language pair is Russian-Chinese. */
  readonly ruZhPair = computed(() => {
    const known = this.knownLanguage();
    const learning = this.learningLanguage();
    return known !== null && learning !== null && isRuZhPair(known, learning);
  });

  /** Whether the learning language is English. */
  readonly enLearningPair = computed(() => {
    const known = this.knownLanguage();
    const learning = this.learningLanguage();
    return known !== null && learning !== null && isEnLearningPair(known, learning);
  });

  /** Whether to show the legacy (non-pair-scoped) layout. */
  readonly showLegacyLayout = computed(() => !this.pairScoped());

  /** Whether to show the pinyin field. */
  readonly showPinyin = computed(() => this.showLegacyLayout() || this.ruZhPair());
  /** Whether to show the Palladius field. */
  readonly showPalladius = computed(() => this.showLegacyLayout() || this.ruZhPair());
  /** Whether to show the IPA field. */
  readonly showIpa = computed(() => this.showLegacyLayout() || this.enLearningPair());
  /** Whether to show the script selector. */
  readonly showScript = computed(() => this.showLegacyLayout());
  /** Whether to show the advanced panel (pair-scoped and not legacy). */
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
