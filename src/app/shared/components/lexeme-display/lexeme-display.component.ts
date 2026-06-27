import { Component, computed, inject, input } from '@angular/core';

import {
  resolveRomanizationsForSurface,
  resolveShowIpaForSurface,
  type LexemeDisplaySurface,
} from '../../../core/data/phonetic-preferences.utils';
import {
  resolveIpaString,
  resolveVisibleRomanizationReadings,
  hasLexemePhoneticLayers,
} from '../../../core/data/phonetic-lexeme.utils';
import type {
  PhoneticLexeme,
  RomanizationSystem,
} from '../../../core/models/phonetic-content.types';
import { UserStore } from '../../../core/state';
import { PhoneticIpaComponent } from '../phonetic-ipa/phonetic-ipa.component';
import { ToneColoredTextComponent } from '../tone-colored-text/tone-colored-text.component';

export type { LexemeDisplaySurface };

const ROMANIZATION_LABELS: Record<RomanizationSystem, string> = {
  pinyin: '拼音',
  zhuyin: '注音',
  palladius: 'Pal.',
};

@Component({
  selector: 'app-lexeme-display',
  imports: [PhoneticIpaComponent, ToneColoredTextComponent],
  host: {
    class: 'lexeme-display-host',
    '[class.lexeme-display-host--inline]': 'inline()',
    '[class.lexeme-display-host--stacked-readings]': 'stackedReadings()',
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
  readonly toneColorEnabled = input<boolean | null>(null);
  /** Скрыть основной текст (иероглиф / слово); оставить романизацию и IPA. */
  readonly primaryVisible = input(true);
  /** Подписи систем (拼音 / IPA …). */
  readonly labelsVisible = input(true);
  /** Каждая система на отдельной строке (без колонки label + text). */
  readonly stackedReadings = input(false);
  /** Переопределяет размер строк романизации / IPA (например `1.75em`). */
  readonly readingSize = input<string | null>(null);

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
    if (lexeme && (lexeme.primary.trim() || hasLexemePhoneticLayers(lexeme))) {
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

  readonly effectiveToneColorEnabled = computed(() => {
    const override = this.toneColorEnabled();
    if (override !== null) {
      return override;
    }

    return this.userStore.cjkLearning().showTones;
  });

  readonly ipaText = computed(() => {
    const lexeme = this.displayLexeme();
    if (!lexeme || !this.effectiveShowIpa()) {
      return null;
    }

    const label = this.ipaVariantLabel() ?? this.userStore.phonetic().ipaVariantLabel;
    return resolveIpaString(lexeme.ipa, label);
  });

  phoneticToneLexeme(lexeme: PhoneticLexeme, reading: string): PhoneticLexeme {
    return {
      ...lexeme,
      primary: '',
      script: 'latn',
      pinyin: reading,
    };
  }
}
