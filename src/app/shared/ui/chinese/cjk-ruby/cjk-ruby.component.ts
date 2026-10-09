import { Component, computed, input } from '@angular/core';

import type { RomanizationSystem } from '../../../../core/models/phonetic-content.types';

@Component({
  selector: 'app-cjk-ruby',
  templateUrl: './cjk-ruby.component.html',
  styleUrl: './cjk-ruby.component.scss',
})
export class CjkRubyComponent {
  /** The base text (e.g. a Chinese character like "你"). */
  readonly base = input.required<string>();

  /** The reading/phonetic text displayed as ruby annotation (e.g. "nǐ"). */
  readonly reading = input<string | null>(null);

  /** The romanization system used for the reading (defaults to 'pinyin'). */
  readonly romanization = input<RomanizationSystem>('pinyin');

  readonly hasReading = computed(() => Boolean(this.reading()?.trim()));
}
