import { Component, effect, input, output, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  applyPinyinKeyboardKey,
  canApplyPinyinTone,
  createPinyinKeyboardState,
  formatPinyinKeyboardValue,
  PINYIN_KEYBOARD_LAYOUT,
  pinyinKeyboardKeyAriaLabel,
  pinyinKeyboardKeyLabel,
  type PinyinKeyboardKey,
  type PinyinKeyboardState,
} from '../../../core/data/pinyin-keyboard.utils';

@Component({
  selector: 'app-pinyin-keyboard',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './pinyin-keyboard.component.html',
  styleUrl: './pinyin-keyboard.component.scss',
})
export class PinyinKeyboardComponent {
  readonly value = input('');
  readonly disabled = input(false);

  readonly valueChange = output<string>();

  readonly layout = PINYIN_KEYBOARD_LAYOUT;
  readonly keyLabel = pinyinKeyboardKeyLabel;
  readonly keyAriaLabel = pinyinKeyboardKeyAriaLabel;
  readonly canApplyTone = canApplyPinyinTone;

  private readonly state = signal<PinyinKeyboardState>(createPinyinKeyboardState());
  private lastEmitted = '';

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

  isKeyDisabled(key: PinyinKeyboardKey): boolean {
    if (this.disabled()) {
      return true;
    }

    if (key.kind === 'tone') {
      return !this.canApplyTone(this.state());
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
