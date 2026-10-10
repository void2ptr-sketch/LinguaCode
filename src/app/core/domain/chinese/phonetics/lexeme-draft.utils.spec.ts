import {
  emptyLexemeDraftFields,
  normalizePhoneticLexemeDraft,
  collectLexemeAcceptedAnswers,
} from './lexeme-draft.utils';

describe('lexeme-draft.utils', () => {
  it('should auto-fill palladius from pinyin when palladius empty', () => {
    const lexeme = normalizePhoneticLexemeDraft({
      primary: '你好',
      script: 'hani',
      pinyin: 'nǐ hǎo',
      zhuyin: '',
      palladius: '',
      ipa: '',
      audioUrl: '',
      acceptedReadings: '',
    });

    expect(lexeme?.palladius).toBe('ни хао');
  });

  it('should keep manual palladius override', () => {
    const lexeme = normalizePhoneticLexemeDraft({
      primary: '北京',
      script: 'hani',
      pinyin: 'běi jīng',
      zhuyin: '',
      palladius: 'Пекин',
      ipa: '',
      audioUrl: '',
      acceptedReadings: '',
    });

    expect(lexeme?.palladius).toBe('Пекин');
  });

  it('should collect accepted readings from lexeme fields', () => {
    const answers = collectLexemeAcceptedAnswers({
      primary: 'Hello',
      script: 'latn',
      ipa: 'həˈləʊ',
      acceptedReadings: ['hello'],
    });

    expect(answers).toContain('həˈləʊ');
    expect(answers).toContain('hello');
  });

  it('should reject invalid IPA input', () => {
    const lexeme = normalizePhoneticLexemeDraft({
      ...emptyLexemeDraftFields(),
      primary: 'test',
      ipa: 'not-ipa-xyz123',
    });

    expect(lexeme).toBeUndefined();
  });
});
