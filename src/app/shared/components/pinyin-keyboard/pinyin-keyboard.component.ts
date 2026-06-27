import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  applyPinyinKeyboardKey,
  createPinyinKeyboardState,
  formatPinyinKeyboardValue,
  PINYIN_KEYBOARD_LETTER_ROWS,
  PINYIN_KEYBOARD_UTILITY_KEYS,
  PINYIN_TONE_MARKS,
  pendingSyllableTonePreview,
  pinyinKeyboardKeyAriaLabel,
  pinyinKeyboardKeyLabel,
  pinyinKeyboardToneKeyAriaLabel,
  shouldShowPinyinToneRow,
  type PinyinKeyboardKey,
  type PinyinKeyboardState,
} from '../../../core/data/pinyin-keyboard.utils';
import type { ToneMark } from '../../../core/models/phonetic-content.types';
import { ToneColoredTextComponent } from '../tone-colored-text/tone-colored-text.component';

@Component({
  selector: 'app-pinyin-keyboard',
  imports: [MatButtonModule, MatIconModule, ToneColoredTextComponent],
  templateUrl: './pinyin-keyboard.component.html',
  styleUrl: './pinyin-keyboard.component.scss',
})
export class PinyinKeyboardComponent {
  readonly value = input('');
  readonly disabled = input(false);

  readonly valueChange = output<string>();

  readonly letterRows = PINYIN_KEYBOARD_LETTER_ROWS;
  readonly utilityKeys = PINYIN_KEYBOARD_UTILITY_KEYS;
  readonly toneMarks = PINYIN_TONE_MARKS;
  readonly keyLabel = pinyinKeyboardKeyLabel;
  readonly keyAriaLabel = pinyinKeyboardKeyAriaLabel;

  private readonly state = signal<PinyinKeyboardState>(createPinyinKeyboardState());
  private lastEmitted = '';

  readonly showToneRow = computed(() => shouldShowPinyinToneRow(this.state()));

  constructor() {
    effect(() => {
      const external = this.value();
      if (external === this.lastEmitted) {
        return;
      }

      untracked(() => {
        this.state.set(createPinyinKeyboardState(external));
        this.lastEmitted = external;
      });
    });
  }

  tonePreview(tone: ToneMark): string {
    return pendingSyllableTonePreview(this.state(), tone);
  }

  toneAriaLabel(tone: ToneMark): string {
    return pinyinKeyboardToneKeyAriaLabel(this.state(), tone);
  }

  isToneKeyDisabled(): boolean {
    return this.disabled() || !this.showToneRow();
  }

  isKeyDisabled(key: PinyinKeyboardKey): boolean {
    if (this.disabled()) {
      return true;
    }

    if (key.kind === 'space') {
      const current = this.state();
      return !current.pendingSyllable && (!current.committed || current.committed.endsWith(' '));
    }

    if (key.kind === 'backspace') {
      const current = this.state();
      return !current.pendingSyllable && !current.committed;
    }

    return false;
  }

  pressTone(tone: ToneMark): void {
    this.pressKey({ kind: 'tone', tone });
  }

  pressKey(key: PinyinKeyboardKey): void {
    if (this.isKeyDisabled(key)) {
      return;
    }

    const nextState = applyPinyinKeyboardKey(this.state(), key);
    const nextValue = formatPinyinKeyboardValue(nextState);
    this.state.set(nextState);
    this.lastEmitted = nextValue;
    this.valueChange.emit(nextValue);
  }
}
