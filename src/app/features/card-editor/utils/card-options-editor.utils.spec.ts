import { emptyLexemeDraftFields } from '../../../core/data/lexeme-draft.utils';
import {
  addOption,
  createEmptyOptionsState,
  optionTextReadonly,
  removeOption,
  syncOptionLexemes,
  updateOptionLexeme,
  updateOptionText,
} from './card-options-editor.utils';

describe('card-options-editor.utils', () => {
  it('creates empty options state', () => {
    const state = createEmptyOptionsState();
    expect(state.options).toEqual(['', '']);
    expect(state.lexemes.length).toBe(2);
    expect(state.correctIndex).toBe(0);
  });

  it('updates option text and syncs lexeme in basic mode', () => {
    const state = createEmptyOptionsState();
    const next = updateOptionText(state, 0, 'hello', 'ru', 'en', false);

    expect(next.options[0]).toBe('hello');
    expect(next.lexemes[0]?.primary).toBe('hello');
  });

  it('marks option readonly when advanced and lexeme has primary', () => {
    const lexeme = { ...emptyLexemeDraftFields(), primary: 'test' };
    expect(optionTextReadonly(true, lexeme)).toBe(true);
    expect(optionTextReadonly(false, lexeme)).toBe(false);
  });

  it('adds and removes options', () => {
    const added = addOption(createEmptyOptionsState());
    expect(added?.options.length).toBe(3);

    const removed = removeOption(added!, 1);
    expect(removed?.options).toEqual(['', '']);
    expect(removed?.correctIndex).toBe(0);
  });

  it('adjusts correct index when removing earlier option', () => {
    const state = {
      options: ['a', 'b', 'c'],
      lexemes: [emptyLexemeDraftFields(), emptyLexemeDraftFields(), emptyLexemeDraftFields()],
      correctIndex: 2,
    };

    const removed = removeOption(state, 0);
    expect(removed?.correctIndex).toBe(1);
  });

  it('syncs lexeme from text when primary empty in advanced mode', () => {
    const lexemes = [emptyLexemeDraftFields('latn')];
    const next = syncOptionLexemes(lexemes, ['word'], 0, 'word', 'ru', 'en', true);
    expect(next[0]?.primary).toBe('word');
  });

  it('updates lexeme and mirrors primary into option text', () => {
    const state = createEmptyOptionsState();
    const lexeme = { ...emptyLexemeDraftFields(), primary: '你好' };
    const next = updateOptionLexeme(state, 0, lexeme);

    expect(next.options[0]).toBe('你好');
    expect(next.lexemes[0]?.primary).toBe('你好');
  });
});
