import {
  applyPinyinKeyboardKey,
  createPinyinKeyboardState,
  formatPinyinKeyboardValue,
  toneKeyPreview,
} from './pinyin-keyboard.utils';

describe('pinyin-keyboard.utils', () => {
  it('should compose toned syllables into committed value', () => {
    let state = createPinyinKeyboardState();

    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'n' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'i' });
    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 3 });

    expect(state.committed).toBe('nǐ');
    expect(formatPinyinKeyboardValue(state)).toBe('nǐ');
  });

  it('should build multi-syllable pinyin phrases', () => {
    let state = createPinyinKeyboardState();

    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'n' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'i' });
    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 3 });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'h' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'a' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'o' });
    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 3 });

    expect(formatPinyinKeyboardValue(state)).toBe('nǐ hǎo');
  });

  it('should show pending syllable in display value', () => {
    let state = createPinyinKeyboardState('nǐ');
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'h' });

    expect(formatPinyinKeyboardValue(state)).toBe('nǐ h');
  });

  it('should support ü via v key and tone marks', () => {
    let state = createPinyinKeyboardState();
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'l' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'v' });
    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 2 });

    expect(formatPinyinKeyboardValue(state)).toBe('lǘ');
  });

  it('should handle backspace on pending and committed parts', () => {
    let state = createPinyinKeyboardState();
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'n' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'i' });
    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 3 });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'h' });
    expect(formatPinyinKeyboardValue(state)).toBe('nǐ h');

    state = applyPinyinKeyboardKey(state, { kind: 'backspace' });
    expect(formatPinyinKeyboardValue(state)).toBe('nǐ');

    state = applyPinyinKeyboardKey(state, { kind: 'backspace' });
    expect(formatPinyinKeyboardValue(state)).toBe('n');
  });

  it('should expose tone previews for keyboard labels', () => {
    expect(toneKeyPreview(1)).toBe('ā');
    expect(toneKeyPreview(5)).toBe('a');
  });
});
