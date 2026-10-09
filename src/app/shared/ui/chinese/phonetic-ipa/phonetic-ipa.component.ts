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
  /** The IPA transcription string to display (e.g. "/ni hao/"). */
  readonly transcription = input.required<string>();

  /** Render inline (single-line) instead of block (multi-line). */
  readonly inline = input(false);

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
