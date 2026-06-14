import { Component, computed, inject, input } from '@angular/core';

import { resolveIpaString, resolveVisibleRomanizationReadings } from '../../../core/data/phonetic-lexeme.utils';
import type { PhoneticLexeme, RomanizationSystem } from '../../../core/models/phonetic-content.types';
import { UserStore } from '../../../core/state';
import { PhoneticIpaComponent } from '../phonetic-ipa/phonetic-ipa.component';

const ROMANIZATION_LABELS: Record<RomanizationSystem, string> = {
  pinyin: '拼音',
  zhuyin: '注音',
  palladius: 'Pal.',
};

@Component({
  selector: 'app-lexeme-display',
  imports: [PhoneticIpaComponent],
  host: {
    class: 'lexeme-display-host',
    '[class.lexeme-display-host--inline]': 'inline()',
  },
  templateUrl: './lexeme-display.component.html',
  styleUrl: './lexeme-display.component.scss',
})
export class LexemeDisplayComponent {
  private readonly userStore = inject(UserStore);

  readonly lexeme = input<PhoneticLexeme | null | undefined>(null);
  readonly fallbackText = input('');
  /** Переопределяет набор романизаций из профиля (для превью редактора). */
  readonly romanizations = input<readonly RomanizationSystem[] | null>(null);
  readonly showIpa = input<boolean | null>(null);
  readonly ipaVariantLabel = input<string | undefined>(undefined);
  readonly inline = input(false);

  readonly romanizationLabel = (system: RomanizationSystem): string => ROMANIZATION_LABELS[system];

  readonly effectiveRomanizations = computed<readonly RomanizationSystem[]>(() => {
    const override = this.romanizations();
    if (override) {
      return override;
    }

    return this.userStore.cjkLearning().displayRomanizations;
  });

  readonly effectiveShowIpa = computed(() => this.showIpa() ?? this.userStore.phonetic().showIpa);

  readonly displayLexeme = computed(() => {
    const lexeme = this.lexeme();
    if (lexeme?.primary.trim()) {
      return lexeme;
    }

    const fallback = this.fallbackText().trim();
    if (!fallback) {
      return null;
    }

    return { primary: fallback, script: 'latn' as const };
  });

  readonly visibleRomanizations = computed(() => {
    const lexeme = this.displayLexeme();
    if (!lexeme) {
      return [];
    }

    return resolveVisibleRomanizationReadings(lexeme, this.effectiveRomanizations());
  });

  readonly ipaText = computed(() => {
    const lexeme = this.displayLexeme();
    if (!lexeme || !this.effectiveShowIpa()) {
      return null;
    }

    const label = this.ipaVariantLabel() ?? this.userStore.phonetic().ipaVariantLabel;
    return resolveIpaString(lexeme.ipa, label);
  });
}
