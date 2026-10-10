import { Component, computed, input } from '@angular/core';

import type { RomanizationSystem } from '../../../../core/models';
/**
 * Renders CJK text with ruby annotations (furigana/zhuyin readings).
 *
 * @remarks
 * Uses HTML `<ruby>` element to display phonetic readings above or to the right of base characters.
 * The reading text is tone-colored when the user has tone coloring enabled.
 *
 * @example
 * ```html
 * <app-cjk-ruby base="你" reading="nǐ" [romanization]="'pinyin'"></app-cjk-ruby>
 * ```
 */
@Component({
  selector: 'app-cjk-ruby',
  templateUrl: './cjk-ruby.component.html',
  styleUrl: './cjk-ruby.component.scss',
})
export class CjkRubyComponent {
  /**
   * The base text (e.g. a Chinese character like "你").
   * @remarks This is required and displayed as the main content.
   */
  readonly base = input.required<string>();

  /**
   * The reading/phonetic text displayed as ruby annotation (e.g. "nǐ").
   * @remarks When null or empty, no ruby annotation is rendered.
   */
  readonly reading = input<string | null>(null);

  /**
   * The romanization system used for the reading (defaults to 'pinyin').
   * @remarks Determines how tone coloring is applied to the reading text.
   */
  readonly romanization = input<RomanizationSystem>('pinyin');

  /**
   * Whether a reading is present and non-empty.
   * @remarks Used to conditionally render the ruby annotation element.
   */
  readonly hasReading = computed(() => Boolean(this.reading()?.trim()));
}
