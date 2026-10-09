import { Component, computed, inject, input } from '@angular/core';

import {
  resolveToneColorPalette,
  segmentToneText,
  type ToneTextSegment,
} from '../../../../core/data/chinese/tone-color.utils';
import type { PhoneticLexeme, ToneMark } from '../../../../core/models/phonetic-content.types';
import type { ToneColorPalette } from '../../../../core/models/tone-color.types';
import { UserStore } from '../../../../core/state';

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

  /**
   * Overrides tone detection with a fixed tone mark.
   *
   * @remarks
   * When set, all characters are colored with this tone instead of auto-detecting.
   */
  readonly fixedTone = input<ToneMark | null>(null);

  /**
   * Overrides tone coloring from user profile.
   *
   * @remarks
   * When null, uses `userStore.cjkLearning().showTones`.
   */
  readonly enabled = input<boolean | null>(null);

  /**
   * Overrides the tone color palette.
   *
   * @remarks
   * When null, uses the palette from `userStore.cjkLearning().toneColorScheme`.
   */
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
