import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-phonetic-ipa',
  templateUrl: './phonetic-ipa.component.html',
  styleUrl: './phonetic-ipa.component.scss',
})
export class PhoneticIpaComponent {
  readonly transcription = input.required<string>();
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
