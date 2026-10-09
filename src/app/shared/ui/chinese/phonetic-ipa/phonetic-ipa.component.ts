import { Component, computed, input } from '@angular/core';

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
