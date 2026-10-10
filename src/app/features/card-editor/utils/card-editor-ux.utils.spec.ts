import {
  defaultScriptForLanguages,
  isEnLearningPair,
  isRuZhPair,
  syncLexemePrimaryFromText,
} from './card-editor-ux.utils';
import { emptyLexemeDraftFields } from '../../../core/domain/chinese/phonetics/lexeme-draft.utils';

describe('card-editor-ux.utils', () => {
  it('should pick script from learning language', () => {
    expect(defaultScriptForLanguages('ru', 'zh')).toBe('hani');
    expect(defaultScriptForLanguages('ru', 'en')).toBe('latn');
  });

  it('should detect ru→zh and en learning pairs', () => {
    expect(isRuZhPair('ru', 'zh')).toBe(true);
    expect(isRuZhPair('ru', 'en')).toBe(false);
    expect(isEnLearningPair('ru', 'en')).toBe(true);
  });

  it('should sync lexeme primary from option text', () => {
    const fields = emptyLexemeDraftFields();
    const next = syncLexemePrimaryFromText(fields, '你好', 'ru', 'zh');

    expect(next.primary).toBe('你好');
    expect(next.script).toBe('hani');
  });
});
