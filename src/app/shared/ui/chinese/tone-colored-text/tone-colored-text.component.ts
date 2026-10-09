import { Component, computed, inject, input } from '@angular/core';

import {
  resolveToneColorPalette,
  segmentToneText,
  type ToneTextSegment,
} from '../../../../core/data/chinese/tone-color.utils';
import type { PhoneticLexeme, ToneMark } from '../../../../core/models/phonetic-content.types';
import type { ToneColorPalette } from '../../../../core/models/tone-color.types';
import { UserStore } from '../../../../core/state';

/**
 * Tone-colored text component. Displays text (Chinese characters or Pinyin syllables)
 * with color coding based on tone marks.
 * @remarks Supports auto-detection of tones from lexeme metadata, fixed tone override,
 * and configurable color palettes from user preferences.
 */
@Component({
  selector: 'app-tone-colored-text',
  host: {
    class: 'tone-colored-text',
    '[class.tone-colored-text--inline]': 'inline()',
  },
  templateUrl: './tone-colored-text.component.html',
  styleUrl: './tone-colored-text.component.scss',
})
export class ToneColoredTextComponent {
  private readonly userStore = inject(UserStore);

  /** The text to display with tone coloring applied. */
  readonly text = input.required<string>();

  /** Text mode: 'han' for Chinese characters, 'pinyin' for Pinyin syllables. */
  readonly mode = input<'han' | 'pinyin'>('pinyin');

  /** Optional lexeme with tone metadata (tones, pinyin) for accurate segmentation. */
  readonly lexeme = input<PhoneticLexeme | null | undefined>(null);

  /** Overrides tone detection with a fixed tone mark. */
  readonly fixedTone = input<ToneMark | null>(null);

  /** Overrides tone coloring from user profile. */
  readonly enabled = input<boolean | null>(null);

  /** Overrides the tone color palette. */
  readonly palette = input<ToneColorPalette | null>(null);

  /** Render inline (single-line) instead of block (multi-line). */
  readonly inline = input(false);

  readonly toneColorEnabled = computed(() => {
    const override = this.enabled();
    if (override !== null) {
      return override;
    }

    return this.userStore.cjkLearning().showTones;
  });

  readonly effectivePalette = computed(() => {
    return this.palette() ?? resolveToneColorPalette(this.userStore.cjkLearning().toneColorScheme);
  });

  readonly segments = computed((): readonly ToneTextSegment[] => {
    if (!this.toneColorEnabled()) {
      return [{ text: this.text(), tone: 5 }];
    }

    const lexeme = this.lexeme();
    return segmentToneText(this.text(), this.mode(), {
      pinyin: lexeme?.pinyin,
      tones: lexeme?.tones,
      fixedTone: this.fixedTone(),
    });
  });

  segmentColor(tone: ToneMark): string {
    return this.effectivePalette()[tone];
  }
}
