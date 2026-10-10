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

  /**
   * Available script options for lexeme display.
   * @remarks
   * Used in the script selector dropdown: Latin (latn) and Han (hani) characters.
   */
  readonly scriptOptions: readonly { value: ScriptCode; label: string }[] = [
    { value: 'latn', label: 'Латиница' },
    { value: 'hani', label: 'Иероглифы (Han)' },
  ];

  /**
   * Whether both known and learning languages are set (enables pair-scoped layout).
   * @remarks
   * When true, shows the advanced panel with language-pair-aware fields.
   */
  readonly pairScoped = computed(
    () => this.knownLanguage() !== null && this.learningLanguage() !== null,
  );

  /**
   * Whether the language pair is Russian-Chinese.
   * @remarks
   * When true, shows Pinyin and Palladius fields.
   */
  readonly ruZhPair = computed(() => {
    const known = this.knownLanguage();
    const learning = this.learningLanguage();
    return known !== null && learning !== null && isRuZhPair(known, learning);
  });

  /**
   * Whether the learning language is English.
   * @remarks
   * When true, shows the IPA field (English IPA lookup).
   */
  readonly enLearningPair = computed(() => {
    const known = this.knownLanguage();
    const learning = this.learningLanguage();
    return known !== null && learning !== null && isEnLearningPair(known, learning);
  });

  /**
   * Whether to show the legacy (non-pair-scoped) layout.
   * @remarks
   * When true, shows all fields unconditionally regardless of language pair.
   */
  readonly showLegacyLayout = computed(() => !this.pairScoped());

  /**
   * Whether to show the Pinyin field.
   * @remarks
   * Shown in legacy layout or for Russian-Chinese pairs.
   */
  readonly showPinyin = computed(() => this.showLegacyLayout() || this.ruZhPair());

  /**
   * Whether to show the Palladius field.
   * @remarks
   * Shown in legacy layout or for Russian-Chinese pairs.
   */
  readonly showPalladius = computed(() => this.showLegacyLayout() || this.ruZhPair());

  /**
   * Whether to show the IPA field.
   * @remarks
   * Shown in legacy layout or for English-learning pairs.
   */
  readonly showIpa = computed(() => this.showLegacyLayout() || this.enLearningPair());

  /**
   * Whether to show the script selector.
   * @remarks
   * Only shown in legacy layout (not in pair-scoped mode).
   */
  readonly showScript = computed(() => this.showLegacyLayout());

  /**
   * Whether to show the advanced panel (pair-scoped and not legacy).
   * @remarks
   * The advanced panel contains Pinyin, IPA, Palladius, and Script fields.
   */
  readonly showAdvancedPanel = computed(() => this.pairScoped() && !this.showLegacyLayout());

  /**
   * Updates a single lexeme field and emits the updated fields.
   *
   * @param key - The field key to update.
   * @param value - The new value for the field.
   */
  updateField<K extends keyof LexemeDraftFields>(key: K, value: LexemeDraftFields[K]): void {
    this.fieldsChange.emit({ ...this.fields(), [key]: value });
  }

  /**
   * Updates the primary lexeme field and auto-detects the script.
   *
   * @param value - The new primary text.
   * @remarks
   * Auto-detects the script based on known and learning languages
   * when the script is not already set.
   */
  updatePrimary(value: string): void {
    const known = this.knownLanguage();
    const learning = this.learningLanguage();
    const next: LexemeDraftFields = { ...this.fields(), primary: value };

    if (known !== null && learning !== null && !next.script) {
      next.script = defaultScriptForLanguages(known, learning);
    }

    this.fieldsChange.emit(next);
  }

  /**
   * Fills the Palladius field from the Pinyin field.
   * @remarks
   * Uses `pinyinToPalladius()` utility. No-op if Pinyin is empty.
   */
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

  /**
   * Fills the IPA field from the primary field using English IPA lookup.
   * @remarks
   * Uses `lookupEnglishIpa()` utility. No-op if primary is empty or not found.
   */
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

  /**
   * Fills the IPA field from the Pinyin field.
   * @remarks
   * Uses `pinyinToIpa()` utility. No-op if Pinyin is empty.
   */
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
