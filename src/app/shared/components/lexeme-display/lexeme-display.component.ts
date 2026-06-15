import { Component, computed, inject, input } from '@angular/core';

import {
  resolveRomanizationsForSurface,
  resolveShowIpaForSurface,
  type LexemeDisplaySurface,
} from '../../../core/data/phonetic-preferences.utils';
import { resolveIpaString, resolveVisibleRomanizationReadings } from '../../../core/data/phonetic-lexeme.utils';
import type { PhoneticLexeme, RomanizationSystem } from '../../../core/models/phonetic-content.types';
import { UserStore } from '../../../core/state';
import { PhoneticIpaComponent } from '../phonetic-ipa/phonetic-ipa.component';

export type { LexemeDisplaySurface };

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
  readonly surface = input<LexemeDisplaySurface>('prompt');
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

    return resolveRomanizationsForSurface(
      this.surface(),
      this.userStore.cjkLearning(),
      this.userStore.phonetic(),
    );
  });

  readonly effectiveShowIpa = computed(() => {
    const override = this.showIpa();
    if (override !== null) {
      return override;
    }

    return resolveShowIpaForSurface(this.surface(), this.userStore.phonetic());
  });

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
