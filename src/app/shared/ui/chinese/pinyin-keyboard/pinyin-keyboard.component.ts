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
} from '../../../../core/repositories/chinese/pinyin-keyboard.utils';
import type { ToneMark } from '../../../../core/models/phonetic-content.types';
import { ToneColoredTextComponent } from '../../chinese/tone-colored-text/tone-colored-text.component';

/**
 * Pinyin keyboard component. Provides an on-screen keyboard for typing Pinyin with tone marks.
 * @remarks Supports committed syllables, pending syllables, tone marks, and tone preview.
 */
@Component({
  selector: 'app-pinyin-keyboard',
  imports: [MatButtonModule, MatIconModule, ToneColoredTextComponent],
  templateUrl: './pinyin-keyboard.component.html',
  styleUrl: './pinyin-keyboard.component.scss',
})
export class PinyinKeyboardComponent {
  /**
   * The current Pinyin input value.
   * @remarks
   * Updated via `valueChange` output on each key press. Used for two-way binding.
   */
  readonly value = input('');

  /**
   * Whether the keyboard is disabled.
   * @remarks
   * When true, all keys are non-interactive.
   */
  readonly disabled = input(false);

  /**
   * Emits the current Pinyin value on each key press.
   * @remarks
   * Used for two-way binding with `[(value)]`. Emits the formatted Pinyin string.
   */
  readonly valueChange = output<string>();

  /**
   * Predefined letter key rows for the keyboard layout.
   * @remarks
   * Imported from `pinyin-keyboard.utils` as a constant.
   */
  readonly letterRows = PINYIN_KEYBOARD_LETTER_ROWS;

  /**
   * Predefined utility keys (backspace, space, etc.).
   * @remarks
   * Imported from `pinyin-keyboard.utils` as a constant.
   */
  readonly utilityKeys = PINYIN_KEYBOARD_UTILITY_KEYS;

  /**
   * Available tone marks for tone key buttons.
   * @remarks
   * Imported from `pinyin-keyboard.utils` as a constant.
   */
  readonly toneMarks = PINYIN_TONE_MARKS;

  /**
   * Key label resolver function.
   * @remarks
   * Maps keyboard keys to their display labels. Imported from `pinyin-keyboard.utils`.
   */
  readonly keyLabel = pinyinKeyboardKeyLabel;

  /**
   * Key ARIA label resolver function.
   * @remarks
   * Maps keyboard keys to their accessible labels. Imported from `pinyin-keyboard.utils`.
   */
  readonly keyAriaLabel = pinyinKeyboardKeyAriaLabel;

  /**
   * Internal keyboard state signal.
   * @remarks
   * Tracks committed text, pending syllable, and tone selection.
   * Synced with the external `value` input via an effect.
   */
  private readonly state = signal<PinyinKeyboardState>(createPinyinKeyboardState());
  private lastEmitted = '';

  /**
   * Whether the tone row should be displayed.
   * @remarks
   * True when there is a pending syllable that can receive a tone mark.
   */
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

  /**
   * Returns the tone preview syllable for a given tone mark.
   *
   * @param tone - The tone mark to preview.
   * @returns The syllable with the tone mark applied for preview display.
   */
  tonePreview(tone: ToneMark): string {
    return pendingSyllableTonePreview(this.state(), tone);
  }

  /**
   * Returns the ARIA label for a tone key.
   *
   * @param tone - The tone mark.
   * @returns An accessible label describing the tone key's effect.
   */
  toneAriaLabel(tone: ToneMark): string {
    return pinyinKeyboardToneKeyAriaLabel(this.state(), tone);
  }

  /**
   * Checks if the tone row keys are disabled.
   *
   * @returns `true` if the keyboard is disabled or the tone row is not visible.
   */
  isToneKeyDisabled(): boolean {
    return this.disabled() || !this.showToneRow();
  }

  /**
   * Checks if a specific key is disabled.
   *
   * @param key - The keyboard key to check.
   * @returns `true` if the key should be non-interactive.
   * @remarks
   * Space key is disabled when there is no pending syllable or the committed text ends with a space.
   * Backspace key is disabled when there is no pending syllable and no committed text.
   */
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

  /**
   * Presses a tone key.
   *
   * @param tone - The tone mark to apply.
   */
  pressTone(tone: ToneMark): void {
    this.pressKey({ kind: 'tone', tone });
  }

  /**
   * Presses a keyboard key and emits the updated value.
   *
   * @param key - The keyboard key to press.
   * @remarks No-op if the key is disabled. Emits the formatted Pinyin value.
   */
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
