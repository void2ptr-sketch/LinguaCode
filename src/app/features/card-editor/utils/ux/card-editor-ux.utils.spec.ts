import {
  defaultScriptForLanguages,
  isEnLearningPair,
  isRuZhPair,
  loadEditorUxMode,
  saveEditorUxMode,
  syncLexemePrimaryFromText,
} from './card-editor-ux.utils';
import { emptyLexemeDraftFields } from '../../../../entities/chinese/lib/phonetics/lexeme-draft.utils';
import { EDITOR_UX_MODE_STORAGE_KEY } from './card-editor-ux.utils';

describe('card-editor-ux.utils', () => {
  describe('loadEditorUxMode', () => {
    let savedSessionStorage: Storage | undefined;

    beforeEach(() => {
      savedSessionStorage = globalThis.sessionStorage;
      Object.defineProperty(globalThis, 'sessionStorage', {
        value: {
          getItem: vi.fn(),
          setItem: vi.fn(),
          length: 0,
          clear: vi.fn(),
          key: vi.fn(),
          removeItem: vi.fn(),
        },
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(globalThis, 'sessionStorage', {
        value: savedSessionStorage,
        writable: true,
      });
    });

    it('should return basic when sessionStorage is unavailable', () => {
      Object.defineProperty(globalThis, 'sessionStorage', {
        value: undefined,
        writable: true,
      });
      expect(loadEditorUxMode()).toBe('basic');
    });

    it('should return advanced when stored value is advanced', () => {
      (globalThis.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('advanced');
      expect(loadEditorUxMode()).toBe('advanced');
    });

    it('should return basic when stored value is basic', () => {
      (globalThis.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('basic');
      expect(loadEditorUxMode()).toBe('basic');
    });

    it('should return basic when stored value is unknown', () => {
      (globalThis.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('unknown');
      expect(loadEditorUxMode()).toBe('basic');
    });

    it('should return basic when no value stored', () => {
      (globalThis.sessionStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
      expect(loadEditorUxMode()).toBe('basic');
    });
  });

  describe('saveEditorUxMode', () => {
    let savedSessionStorage: Storage | undefined;

    beforeEach(() => {
      savedSessionStorage = globalThis.sessionStorage;
      Object.defineProperty(globalThis, 'sessionStorage', {
        value: {
          getItem: vi.fn(),
          setItem: vi.fn(),
          length: 0,
          clear: vi.fn(),
          key: vi.fn(),
          removeItem: vi.fn(),
        },
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(globalThis, 'sessionStorage', {
        value: savedSessionStorage,
        writable: true,
      });
    });

    it('should save advanced mode to sessionStorage', () => {
      saveEditorUxMode('advanced');
      expect(globalThis.sessionStorage.setItem).toHaveBeenCalledWith(
        EDITOR_UX_MODE_STORAGE_KEY,
        'advanced',
      );
    });

    it('should save basic mode to sessionStorage', () => {
      saveEditorUxMode('basic');
      expect(globalThis.sessionStorage.setItem).toHaveBeenCalledWith(
        EDITOR_UX_MODE_STORAGE_KEY,
        'basic',
      );
    });

    it('should be no-op when sessionStorage is unavailable', () => {
      Object.defineProperty(globalThis, 'sessionStorage', {
        value: undefined,
        writable: true,
      });
      expect(() => saveEditorUxMode('advanced')).not.toThrow();
    });
  });

  describe('defaultScriptForLanguages', () => {
    it('should return hani for Chinese learning', () => {
      expect(defaultScriptForLanguages('ru', 'zh')).toBe('hani');
      expect(defaultScriptForLanguages('en', 'zh')).toBe('hani');
    });

    it('should return latn for non-Chinese learning', () => {
      expect(defaultScriptForLanguages('ru', 'en')).toBe('latn');
      expect(defaultScriptForLanguages('en', 'ru')).toBe('latn');
      expect(defaultScriptForLanguages('ru', 'perl')).toBe('latn');
      expect(defaultScriptForLanguages('en', 'java')).toBe('latn');
    });
  });

  describe('syncLexemePrimaryFromText', () => {
    it('should return fields unchanged when text is empty', () => {
      const fields = emptyLexemeDraftFields();
      const result = syncLexemePrimaryFromText(fields, '', 'ru', 'zh');
      expect(result).toBe(fields);
    });

    it('should return fields unchanged when text is whitespace only', () => {
      const fields = emptyLexemeDraftFields();
      const result = syncLexemePrimaryFromText(fields, '   \t\n', 'ru', 'zh');
      expect(result).toBe(fields);
    });

    it('should trim and set primary for non-empty text', () => {
      const fields = emptyLexemeDraftFields();
      const result = syncLexemePrimaryFromText(fields, '  hello  ', 'ru', 'en');
      expect(result.primary).toBe('hello');
      expect(result.script).toBe('latn');
    });

    it('should set hani script for Chinese learning language', () => {
      const fields = emptyLexemeDraftFields();
      const result = syncLexemePrimaryFromText(fields, '你好', 'ru', 'zh');
      expect(result.primary).toBe('你好');
      expect(result.script).toBe('hani');
    });

    it('should spread existing fields', () => {
      const fields = { ...emptyLexemeDraftFields(), ipa: 'nǐ hǎo' };
      const result = syncLexemePrimaryFromText(fields, '你好', 'ru', 'zh');
      expect(result.ipa).toBe('nǐ hǎo');
      expect(result.primary).toBe('你好');
    });
  });

  describe('isRuZhPair', () => {
    it('should return true for ru→zh', () => {
      expect(isRuZhPair('ru', 'zh')).toBe(true);
    });

    it('should return false for other pairs', () => {
      expect(isRuZhPair('ru', 'en')).toBe(false);
      expect(isRuZhPair('en', 'zh')).toBe(false);
      expect(isRuZhPair('en', 'en')).toBe(false);
    });
  });

  describe('isEnLearningPair', () => {
    it('should return true when learning is English', () => {
      expect(isEnLearningPair('ru', 'en')).toBe(true);
      expect(isEnLearningPair('zh', 'en')).toBe(true);
    });

    it('should return false when learning is not English', () => {
      expect(isEnLearningPair('ru', 'zh')).toBe(false);
      expect(isEnLearningPair('en', 'ru')).toBe(false);
      expect(isEnLearningPair('en', 'en')).toBe(true);
    });
  });
});
