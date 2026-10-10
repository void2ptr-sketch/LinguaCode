import { Component, computed, input } from '@angular/core';

/**
 * UI component for displaying IPA (International Phonetic Alphabet) transcriptions.
 *
 * @remarks
 * Wraps the transcription in square brackets or slashes if not already present.
 * Supports inline and block rendering modes.
 *
 * @example
 * ```html
 * <app-phonetic-ipa [transcription]="niHaoIpa"></app-phonetic-ipa>
 * <app-phonetic-ipa [transcription]="ipa" [inline]="true"></app-phonetic-ipa>
 * ```
 */
@Component({
  selector: 'app-phonetic-ipa',
  templateUrl: './phonetic-ipa.component.html',
  styleUrl: './phonetic-ipa.component.scss',
})
export class PhoneticIpaComponent {
  /**
   * The IPA transcription string to display (e.g. "/ni hao/").
   * @remarks
   * Automatically wraps the transcription in square brackets `[...]` if not
   * already wrapped in brackets or slashes.
   */
  readonly transcription = input.required<string>();

  /**
   * Render inline (single-line) instead of block (multi-line).
   * @remarks When true, applies inline CSS class for single-line display.
   */
  readonly inline = input(false);

  /**
   * The display-ready IPA string with proper bracket wrapping.
   * @remarks
   * Wraps the trimmed transcription in `[...]` if it does not already start
   * with `[` or `/`. Returns an empty string for empty input.
   */
  readonly display = computed(() => {
    const value = this.transcription().trim();
    if (!value) {
      return '';
    }

    if (value.startsWith('[') || value.startsWith('/')) {
      return value;
    }

    return `[${value}]`;
  });
}
