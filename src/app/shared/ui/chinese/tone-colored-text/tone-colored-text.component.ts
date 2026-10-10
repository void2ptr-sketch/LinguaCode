import { Component, computed, inject, input } from '@angular/core';

import {
  resolveToneColorPalette,
  segmentToneText,
  type ToneTextSegment,
} from '../../../../core/repositories/chinese/tones/tone-color.utils';
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

  /**
   * The text to display with tone coloring applied.
   * @remarks Can be Chinese characters (han mode) or Pinyin syllables (pinyin mode).
   */
  readonly text = input.required<string>();

  /**
   * Text mode: 'han' for Chinese characters, 'pinyin' for Pinyin syllables.
   * @remarks Affects how tone segmentation is performed.
   */
  readonly mode = input<'han' | 'pinyin'>('pinyin');

  /**
   * Optional lexeme with tone metadata (tones, pinyin) for accurate segmentation.
   * @remarks
   * When provided, uses the lexeme's pinyin and tones for precise tone-based
   * text splitting instead of heuristic detection.
   */
  readonly lexeme = input<PhoneticLexeme | null | undefined>(null);

  /**
   * Overrides tone detection with a fixed tone mark.
   * @remarks
   * When set, applies the same color to all text segments regardless of actual tones.
   * Useful for uniform coloring or testing.
   */
  readonly fixedTone = input<ToneMark | null>(null);

  /**
   * Overrides tone coloring from user profile.
   * @remarks
   * When null, defers to `userStore.cjkLearning().showTones`.
   * When true/false, forces tone coloring on or off.
   */
  readonly enabled = input<boolean | null>(null);

  /**
   * Overrides the tone color palette.
   * @remarks
   * When null, uses the user's configured `toneColorScheme` from preferences.
   */
  readonly palette = input<ToneColorPalette | null>(null);

  /**
   * Render inline (single-line) instead of block (multi-line).
   * @remarks When true, applies inline CSS class for single-line display.
   */
  readonly inline = input(false);

  /**
   * Whether tone coloring is enabled for this component.
   * @remarks
   * Resolves from the `enabled` input override first, falling back to
   * `userStore.cjkLearning().showTones` user preference.
   */
  readonly toneColorEnabled = computed(() => {
    const override = this.enabled();
    if (override !== null) {
      return override;
    }

    return this.userStore.cjkLearning().showTones;
  });

  /**
   * The effective tone color palette to use.
   * @remarks
   * Resolves from the `palette` input override first, falling back to
   * the user's configured `toneColorScheme` from preferences.
   */
  readonly effectivePalette = computed(() => {
    return this.palette() ?? resolveToneColorPalette(this.userStore.cjkLearning().toneColorScheme);
  });

  /**
   * Segments of text grouped by tone for color rendering.
   * @remarks
   * Each segment contains the text and its corresponding tone mark.
   * Returns a single neutral segment (tone 5) when tone coloring is disabled.
   */
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

  /**
   * Returns the color for a given tone mark.
   *
   * @param tone - The tone mark.
   * @returns The color string from the effective palette.
   */
  segmentColor(tone: ToneMark): string {
    return this.effectivePalette()[tone];
  }
}
