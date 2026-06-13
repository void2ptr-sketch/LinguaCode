import { Component, computed, inject, input } from '@angular/core';

import { resolveIpaString, resolveLexemeRubyAnnotation } from '../../../core/data/phonetic-lexeme.utils';
import { shouldShowPalladius } from '../../../core/data/phonetic-preferences.utils';
import type { PhoneticLexeme, RomanizationSystem } from '../../../core/models/phonetic-content.types';
import { UserStore } from '../../../core/state';
import { CjkRubyComponent } from '../cjk-ruby/cjk-ruby.component';
import { PhoneticIpaComponent } from '../phonetic-ipa/phonetic-ipa.component';

@Component({
  selector: 'app-lexeme-display',
  imports: [CjkRubyComponent, PhoneticIpaComponent],
  templateUrl: './lexeme-display.component.html',
  styleUrl: './lexeme-display.component.scss',
})
export class LexemeDisplayComponent {
  private readonly userStore = inject(UserStore);

  readonly lexeme = input<PhoneticLexeme | null | undefined>(null);
  readonly fallbackText = input('');
  readonly romanization = input<RomanizationSystem | null>(null);
  readonly showIpa = input<boolean | null>(null);
  readonly ipaVariantLabel = input<string | undefined>(undefined);
  readonly inline = input(false);

  readonly effectiveRomanization = computed<RomanizationSystem>(() => {
    const override = this.romanization();
    if (override) {
      return override;
    }

    const prefs = this.userStore.cjkLearning();
    const pair = this.userStore.languagePair();
    if (shouldShowPalladius(pair.known, pair.learning) && prefs.displayRomanization === 'palladius') {
      return 'palladius';
    }

    return prefs.displayRomanization;
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

  readonly rubyReading = computed(() => {
    const lexeme = this.displayLexeme();
    if (!lexeme) {
      return null;
    }

    return resolveLexemeRubyAnnotation(lexeme, this.effectiveRomanization());
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
