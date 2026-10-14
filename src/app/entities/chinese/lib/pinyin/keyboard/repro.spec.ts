import {
  applyPinyinKeyboardKey,
  createPinyinKeyboardState,
  formatPinyinKeyboardValue,
} from './pinyin-keyboard.utils';

function typeSequence(keys: string[]): string {
  let state = createPinyinKeyboardState();
  for (const key of keys) {
    if (key === 't3') {
      state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 3 });
    } else if (key === 't4') {
      state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 4 });
    } else if (key === ' ') {
      state = applyPinyinKeyboardKey(state, { kind: 'space' });
    } else {
      state = applyPinyinKeyboardKey(state, { kind: 'letter', char: key });
    }
  }
  return formatPinyinKeyboardValue(state);
}

describe('repro', () => {
  it('nǐ hǎo by toning the vowel as it is typed: n i t3 SP h a t3 o', () => {
    expect(typeSequence(['n', 'i', 't3', ' ', 'h', 'a', 't3', 'o'])).toBe('nǐ hǎo');
  });

  it('no extra spaces are inserted for manual input', () => {
    expect(typeSequence(['n', 'i', 't3', 'h', 'a', 't3', 'o'])).toBe('nǐhǎo');
  });

  it('tones the last typed vowel of a compound final', () => {
    expect(typeSequence(['h', 'a', 'o', 't3'])).toBe('haǒ');
    expect(typeSequence(['n', 'i', 't3', ' ', 'a', 'i', 't4'])).toBe('nǐ aì');
  });

  it('repeated tone presses edit the same (last) vowel', () => {
    expect(typeSequence(['h', 'a', 'o', 't3', 't4'])).toBe('haò');
  });
});
