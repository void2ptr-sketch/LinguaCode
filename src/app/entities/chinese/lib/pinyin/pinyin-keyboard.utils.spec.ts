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

    expect(formatPinyinKeyboardValue(state)).toBe('nǐ haǒ');
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
    expect(toneKeyPreview(3, 'hao')).toBe('ǒ');
  });

  it('should detect when pending syllable supports tone marks', () => {
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
    expect(state.pendingSyllable).toBe('nih');
  });

  it('should ignore duplicate vowel presses while tone row is open', () => {
    let state = createPinyinKeyboardState();
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'h' });
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'o' });
    expect(state.pendingSyllable).toBe('ho');
    expect(shouldShowPinyinToneRow(state)).toBe(true);

    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'o' });
    expect(state.pendingSyllable).toBe('ho');
    expect(shouldShowPinyinToneRow(state)).toBe(true);
  });

  it('should allow tone selection only while tone row is open', () => {
    let state = createPinyinKeyboardState();
    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'n' });
    expect(canApplyPinyinTone(state)).toBe(false);

    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'i' });
    expect(canApplyPinyinTone(state)).toBe(true);
  });

  it('should preview only the last vowel in tone row', () => {
    let state = createPinyinKeyboardState();
    for (const char of ['o', 'i', 'o', 'i']) {
      state = applyPinyinKeyboardKey(state, { kind: 'letter', char });
    }

    expect(state.pendingSyllable).toBe('oioi');
    expect(pendingSyllableTonePreview(state, 1)).toBe('ī');
    expect(pendingSyllableTonePreview(state, 4)).toBe('ì');
    expect(pendingSyllableTonePreview(state, 5)).toBe('i');
  });

  it('should auto-commit an overfull pending syllable and keep accepting letters', () => {
    let state = createPinyinKeyboardState();
    for (const char of 'nihaom') {
      state = applyPinyinKeyboardKey(state, { kind: 'letter', char });
    }

    expect(state.pendingSyllable).toBe('nihaom');
    expect(shouldShowPinyinToneRow(state)).toBe(false);

    state = applyPinyinKeyboardKey(state, { kind: 'letter', char: 'a' });
    expect(state.committed).toBe('nihaom');
    expect(state.pendingSyllable).toBe('a');
    expect(shouldShowPinyinToneRow(state)).toBe(true);
    expect(formatPinyinKeyboardValue(state)).toBe('nihaom a');
  });

  it('should restore committed and pending parts from external value', () => {
    expect(createPinyinKeyboardState('nǐ')).toEqual({
      committed: 'nǐ',
      pendingSyllable: '',
      toneRowOpen: false,
    });
    expect(createPinyinKeyboardState('nǐ hao')).toEqual({
      committed: 'nǐ ',
      pendingSyllable: 'hao',
      toneRowOpen: false,
    });
    expect(createPinyinKeyboardState('nihao')).toEqual({
      committed: '',
      pendingSyllable: 'nihao',
      toneRowOpen: false,
    });
  });

  it('should classify keyboard vowels', () => {
    expect(isPinyinKeyboardVowel('a')).toBe(true);
    expect(isPinyinKeyboardVowel('v')).toBe(true);
    expect(isPinyinKeyboardVowel('h')).toBe(false);
  });
});
