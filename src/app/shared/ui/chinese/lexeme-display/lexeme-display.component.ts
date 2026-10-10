import { Component, computed, inject, input } from '@angular/core';

import {
  resolveRomanizationsForSurface,
  resolveShowIpaForSurface,
  type LexemeDisplaySurface,
} from '../../../../core/repositories/phonetic/phonetic-preferences.utils';
import {
  resolveIpaString,
  resolveVisibleRomanizationReadings,
  hasLexemePhoneticLayers,
} from '../../../../core/repositories/phonetic/phonetic-lexeme.utils';
import type {
  PhoneticLexeme,
  RomanizationSystem,
} from '../../../../core/models/phonetic-content.types';
import { UserStore } from '../../../../core/state';
import { PhoneticIpaComponent } from '../phonetic-ipa/phonetic-ipa.component';
import { ToneColoredTextComponent } from '../tone-colored-text/tone-colored-text.component';

export type { LexemeDisplaySurface };

/**
 * Displays a phonetic lexeme with optional romanizations (Pinyin, Zhuyin, Palladius) and IPA transcription.
 *
 * @remarks
 * Resolves romanization systems and IPA visibility from user profile preferences,
 * with optional overrides via `romanizations` and `showIpa` inputs.
 * Supports tone coloring for CJK characters and stacked romanization layout.
 *
 * @example
 * ```html
 * <app-lexeme-display
 *   [lexeme]="lexeme"
 *   [romanizations]="['pinyin', 'palladius']"
 *   [showIpa]="true"
 *   [toneColorEnabled]="true">
 * </app-lexeme-display>
 * ```
 */

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

  /** The phonetic lexeme to display (null/undefined shows fallback text). */
  readonly lexeme = input<PhoneticLexeme | null | undefined>(null);

  /** Fallback text displayed when `lexeme` is null/undefined or has no primary text. */
  readonly fallbackText = input('');

  /** Display surface context: determines which romanizations and IPA to show. */
  readonly surface = input<LexemeDisplaySurface>('prompt');

  /**
   * Overrides the romanization systems from user profile (for editor preview).
   *
   * @remarks
   * When null, uses `userStore.cjkLearning().displayRomanizations` for the given surface.
   */
  readonly romanizations = input<readonly RomanizationSystem[] | null>(null);

  /**
   * Overrides the IPA visibility from user profile.
   *
   * @remarks
   * When null, uses `userStore.phonetic().showIpa` for the given surface.
   */
  readonly showIpa = input<boolean | null>(null);

  /**
   * IPA variant label filter.
   *
   * @remarks
   * When set, only shows IPA transcriptions matching this label.
   */
  readonly ipaVariantLabel = input<string | undefined>(undefined);

  /** Render inline (single-line) instead of block (multi-line). */
  readonly inline = input(false);

  /**
   * Overrides tone coloring from user profile.
   *
   * @remarks
   * When null, uses `userStore.cjkLearning().showTones`.
   */
  readonly toneColorEnabled = input<boolean | null>(null);

  /**
   * Hide the primary text (character/word); show only romanizations and IPA.
   *
   * @remarks
   * Useful for answer zones where only phonetic content is displayed.
   */
  readonly primaryVisible = input(true);

  /** Show labels next to romanization systems (e.g. "拼音", "IPA"). */
  readonly labelsVisible = input(true);

  /**
   * Each romanization system on a separate line (without label + text columns).
   *
   * @remarks
   * When true, renders each system as a full-width row instead of a two-column layout.
   */
  readonly stackedReadings = input(false);

  /**
   * Overrides the font size for romanization / IPA lines.
   *
   * @remarks
   * Accepts any CSS font-size value (e.g. "1.75em"). When null, uses default sizing.
   */
  readonly readingSize = input<string | null>(null);

  /**
   * Returns the display label for a romanization system.
   *
   * @param system - The romanization system identifier.
   * @returns The localized label (e.g. '拼音', '注音', 'Pal.').
   */
  readonly romanizationLabel = (system: RomanizationSystem): string => ROMANIZATION_LABELS[system];

  /**
   * Computed romanization systems to display.
   *
   * @remarks
   * Uses the `romanizations` input override when set; otherwise resolves from
   * user profile preferences via `resolveRomanizationsForSurface`.
   */
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

  /**
   * Computed flag for whether IPA should be displayed.
   *
   * @remarks
   * Uses the `showIpa` input override when set; otherwise resolves from
   * user profile preferences via `resolveShowIpaForSurface`.
   */
  readonly effectiveShowIpa = computed(() => {
    const override = this.showIpa();
    if (override !== null) {
      return override;
    }

    return resolveShowIpaForSurface(this.surface(), this.userStore.phonetic());
  });

  /**
   * Computed lexeme to display, falling back to `fallbackText` when lexeme is empty.
   *
   * @remarks
   * Returns the input `lexeme` if it has primary text or phonetic layers;
   * otherwise constructs a lexeme from `fallbackText` with Latin script.
   */
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

  /**
   * Computed visible romanization readings for the current lexeme.
   *
   * @remarks
   * Resolves actual reading strings from `displayLexeme` and `effectiveRomanizations`.
   */
  readonly visibleRomanizations = computed(() => {
    const lexeme = this.displayLexeme();
    if (!lexeme) {
      return [];
    }

    return resolveVisibleRomanizationReadings(lexeme, this.effectiveRomanizations());
  });

  /**
   * Computed flag for whether tone coloring is enabled.
   *
   * @remarks
   * Uses the `toneColorEnabled` input override when set; otherwise uses
   * `userStore.cjkLearning().showTones`.
   */
  readonly effectiveToneColorEnabled = computed(() => {
    const override = this.toneColorEnabled();
    if (override !== null) {
      return override;
    }

    return this.userStore.cjkLearning().showTones;
  });

  /**
   * Computed IPA text for the current lexeme.
   *
   * @remarks
   * Returns `null` when IPA is disabled or the lexeme has no IPA data.
   * Applies `ipaVariantLabel` filter when set.
   */
  readonly ipaText = computed(() => {
    const lexeme = this.displayLexeme();
    if (!lexeme || !this.effectiveShowIpa()) {
      return null;
    }

    const label = this.ipaVariantLabel() ?? this.userStore.phonetic().ipaVariantLabel;
    return resolveIpaString(lexeme.ipa, label);
  });

  /**
   * Creates a phonetic lexeme for tone coloring from a reading string.
   *
   * @param lexeme - The source lexeme.
   * @param reading - The reading text (e.g. Pinyin syllable).
   * @returns A new lexeme with empty primary text and the given reading as Pinyin.
   */
  phoneticToneLexeme(lexeme: PhoneticLexeme, reading: string): PhoneticLexeme {
    return {
      ...lexeme,
      primary: '',
      script: 'latn',
      pinyin: reading,
    };
  }
}
