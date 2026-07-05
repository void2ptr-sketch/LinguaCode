import { Component, computed, inject, input } from '@angular/core';

import {
  resolveToneColorPalette,
  segmentToneText,
  type ToneTextSegment,
} from '../../../core/data/chinese/tone-color.utils';
import type { PhoneticLexeme, ToneMark } from '../../../core/models/phonetic-content.types';
import type { ToneColorPalette } from '../../../core/models/tone-color.types';
import { UserStore } from '../../../core/state';

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

  readonly text = input.required<string>();
  readonly mode = input<'han' | 'pinyin'>('pinyin');
  readonly lexeme = input<PhoneticLexeme | null | undefined>(null);
  readonly fixedTone = input<ToneMark | null>(null);
  readonly enabled = input<boolean | null>(null);
  readonly palette = input<ToneColorPalette | null>(null);
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
