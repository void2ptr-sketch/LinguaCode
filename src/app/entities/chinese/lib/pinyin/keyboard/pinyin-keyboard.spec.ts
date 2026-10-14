import {
  applyPinyinKeyboardKey,
  canApplyPinyinTone,
  createPinyinKeyboardState,
  formatPinyinKeyboardValue,
  isPinyinKeyboardVowel,
  pendingSyllableTonePreview,
  shouldShowPinyinToneRow,
  syllableSupportsToneMarking,
  toneKeyPreview,
} from './pinyin-keyboard.utils';

describe('pinyin-keyboard.utils', () => {
  it('should append letters and apply tone to the last vowel', () => {
    let state = createPinyinKeyboardState();
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'n' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'i' });
    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 3 });

    expect(state.value).toBe('nǐ');
    expect(formatPinyinKeyboardValue(state)).toBe('nǐ');
  });

  it('should build multi-syllable pinyin with manual spaces', () => {
    let state = createPinyinKeyboardState();

    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'n' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'i' });
    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 3 });
    state = applyPinyinKeyboardKey(state, { kind: 'space' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'h' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'a' });
    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 3 });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'o' });

    expect(formatPinyinKeyboardValue(state)).toBe('nǐ hǎo');
  });

  it('should not auto-insert spaces between syllables', () => {
    let state = createPinyinKeyboardState('nǐ');
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'h' });

    expect(formatPinyinKeyboardValue(state)).toBe('nǐh');
  });

  it('should continue an unfinished toned syllable without extra spaces', () => {
    let state = createPinyinKeyboardState('nǐ ');
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'h' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'a' });
    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 3 });

    expect(formatPinyinKeyboardValue(state)).toBe('nǐ hǎ');

    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'o' });
    expect(formatPinyinKeyboardValue(state)).toBe('nǐ hǎo');
  });

  it('should keep earlier tone marks when applying a tone without spaces', () => {
    let state = createPinyinKeyboardState();
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'n' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'i' });
    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 3 });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'h' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'a' });
    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 3 });

    expect(formatPinyinKeyboardValue(state)).toBe('nǐhǎ');
  });

  it('should tone the last typed vowel of a compound final', () => {
    let state = createPinyinKeyboardState();
    for (const char of 'hao') {
      state = applyPinyinKeyboardKey(state, { kind: 'letter', char });
    }
    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 3 });
    expect(formatPinyinKeyboardValue(state)).toBe('haǒ');

    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 2 });
    expect(formatPinyinKeyboardValue(state)).toBe('haó');
  });

  it('should support ü via v key and tone marks', () => {
    let state = createPinyinKeyboardState();
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'l' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'v' });
    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 2 });

    expect(formatPinyinKeyboardValue(state)).toBe('lǘ');
  });

  it('should handle backspace on the free-input value', () => {
    let state = createPinyinKeyboardState();
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'n' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'i' });
    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 3 });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'h' });
    expect(formatPinyinKeyboardValue(state)).toBe('nǐh');

    state = applyPinyinKeyboardKey(state, { kind: 'backspace' });
    expect(formatPinyinKeyboardValue(state)).toBe('nǐ');

    state = applyPinyinKeyboardKey(state, { kind: 'backspace' });
    expect(formatPinyinKeyboardValue(state)).toBe('n');
  });

  it('should expose tone previews for keyboard labels', () => {
    expect(toneKeyPreview(1)).toBe('ā');
    expect(toneKeyPreview(5)).toBe('a');
    expect(toneKeyPreview(3, 'hao')).toBe('ǒ');
  });

  it('should detect when a syllable supports tone marks', () => {
    expect(syllableSupportsToneMarking('')).toBe(false);
    expect(syllableSupportsToneMarking('n')).toBe(false);
    expect(syllableSupportsToneMarking('ni')).toBe(true);
    expect(syllableSupportsToneMarking('hao')).toBe(true);
  });

  it('should show tone row only after a vowel key press', () => {
    expect(shouldShowPinyinToneRow(createPinyinKeyboardState())).toBe(false);

    let state = createPinyinKeyboardState();
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'n' });
    expect(shouldShowPinyinToneRow(state)).toBe(false);

    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'i' });
    expect(shouldShowPinyinToneRow(state)).toBe(true);
    expect(pendingSyllableTonePreview(state, 3)).toBe('ǐ');

    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'h' });
    expect(shouldShowPinyinToneRow(state)).toBe(false);
    expect(state.value).toBe('nih');
  });

  it('should keep the tone row open while vowels are typed', () => {
    const state = applyPinyinKeyboardKey(
      applyPinyinKeyboardKey(createPinyinKeyboardState(), { kind: 'letter', char: 'h' }),
      { kind: 'letter', char: 'o' },
    );
    expect(state.value).toBe('ho');
    expect(shouldShowPinyinToneRow(state)).toBe(true);
  });

  it('should allow tone selection only while tone row is open', () => {
    let state = createPinyinKeyboardState();
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'n' });
    expect(canApplyPinyinTone(state)).toBe(false);

    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'i' });
    expect(canApplyPinyinTone(state)).toBe(true);
  });

  it('should preview the last typed vowel in the tone row', () => {
    let state = createPinyinKeyboardState();
    for (const char of 'hao') {
      state = applyPinyinKeyboardKey(state, { kind: 'letter', char });
    }

    expect(state.value).toBe('hao');
    expect(pendingSyllableTonePreview(state, 3)).toBe('ǒ');
    expect(pendingSyllableTonePreview(state, 5)).toBe('o');
  });

  it('should switch the tone row to the newly typed vowel', () => {
    let state = createPinyinKeyboardState();
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'a' });
    expect(pendingSyllableTonePreview(state, 1)).toBe('ā');

    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'e' });
    expect(state.value).toBe('ae');
    expect(pendingSyllableTonePreview(state, 1)).toBe('ē');
    expect(pendingSyllableTonePreview(state, 5)).toBe('e');
  });

  it('should re-apply a tone to the last syllable only', () => {
    let state = createPinyinKeyboardState('nǐ ');
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'h' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'a' });
    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 3 });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'o' });
    expect(formatPinyinKeyboardValue(state)).toBe('nǐ hǎo');

    state = applyPinyinKeyboardKey(state, { kind: 'tone', tone: 4 });
    expect(formatPinyinKeyboardValue(state)).toBe('nǐ hǎò');
  });

  it('should restore value from external string with closed tone row', () => {
    expect(createPinyinKeyboardState('nǐ')).toEqual({ value: 'nǐ', toneRowOpen: false });
    expect(createPinyinKeyboardState('nǐ hao')).toEqual({ value: 'nǐ hao', toneRowOpen: false });
    expect(createPinyinKeyboardState('')).toEqual({ value: '', toneRowOpen: false });
  });

  it('should not add leading or trailing double spaces', () => {
    let state = createPinyinKeyboardState();
    state = applyPinyinKeyboardKey(state, { kind: 'space' });
    expect(state.value).toBe('');

    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'n' });
    state = applyPinyinKeyboardKey(state, { kind: 'space' });
    expect(state.value).toBe('n ');

    state = applyPinyinKeyboardKey(state, { kind: 'space' });
    expect(state.value).toBe('n ');
  });

  it('should classify keyboard vowels', () => {
    expect(isPinyinKeyboardVowel('a')).toBe(true);
    expect(isPinyinKeyboardVowel('v')).toBe(true);
    expect(isPinyinKeyboardVowel('h')).toBe(false);
  });
});
