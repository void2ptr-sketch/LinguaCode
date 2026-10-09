import { Component, computed, input } from '@angular/core';

import type { RomanizationSystem } from '../../../core/models/phonetic-content.types';

@Component({
  selector: 'app-cjk-ruby',
  templateUrl: './cjk-ruby.component.html',
  styleUrl: './cjk-ruby.component.scss',
})
export class CjkRubyComponent {
  readonly base = input.required<string>();
  readonly reading = input<string | null>(null);
  readonly romanization = input<RomanizationSystem>('pinyin');

  readonly hasReading = computed(() => Boolean(this.reading()?.trim()));
}
