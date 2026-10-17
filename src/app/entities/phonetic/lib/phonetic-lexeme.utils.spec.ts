import {
  emptyPhoneticLexeme,
  lexemeFromHan,
  lexemeFromPrimary,
  hasLexemePhoneticLayers,
  hasLexemeContent,
  resolveIpaString,
  resolveRomanizationReading,
  resolveLexemeRubyAnnotation,
  resolveVisibleRomanizationReadings,
  mergeLexeme,
  parseIpaVariants,
  formatIpaForEditor,
} from './phonetic-lexeme.utils';

describe('phonetic-lexeme.utils', () => {
  describe('emptyPhoneticLexeme', () => {
    it('should create empty lexeme with latn script by default', () => {
      const lexeme = emptyPhoneticLexeme();
      expect(lexeme.primary).toBe('');
      expect(lexeme.script).toBe('latn');
    });

    it('should create empty lexeme with hani script', () => {
      const lexeme = emptyPhoneticLexeme('hani');
      expect(lexeme.primary).toBe('');
      expect(lexeme.script).toBe('hani');
    });
  });

  describe('lexemeFromPrimary', () => {
    it('should trim whitespace from primary', () => {
      const lexeme = lexemeFromPrimary('  hello  ');
      expect(lexeme.primary).toBe('hello');
    });

    it('should return empty lexeme for blank input', () => {
      const lexeme = lexemeFromPrimary('   ');
      expect(lexeme.primary).toBe('');
    });

    it('should accept custom script', () => {
      const lexeme = lexemeFromPrimary('hello', 'hani');
      expect(lexeme.script).toBe('hani');
    });
  });

  describe('lexemeFromHan', () => {
    it('should create lexeme with hani script', () => {
      const lexeme = lexemeFromHan('国');
      expect(lexeme.primary).toBe('国');
      expect(lexeme.script).toBe('hani');
    });
  });

  describe('hasLexemePhoneticLayers', () => {
    it('should return false for null', () => {
      expect(hasLexemePhoneticLayers(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(hasLexemePhoneticLayers(undefined)).toBe(false);
    });

    it('should return true when pinyin is present', () => {
      expect(hasLexemePhoneticLayers({ primary: '国', script: 'hani', pinyin: 'guó' })).toBe(true);
    });

    it('should return true when zhuyin is present', () => {
      expect(hasLexemePhoneticLayers({ primary: '国', script: 'hani', zhuyin: 'ㄍㄨㄛˊ' })).toBe(
        true,
      );
    });

    it('should return true when palladius is present', () => {
      expect(
        hasLexemePhoneticLayers({ primary: 'hello', script: 'latn', palladius: 'хеллоу' }),
      ).toBe(true);
    });

    it('should return true when ipa is present', () => {
      expect(hasLexemePhoneticLayers({ primary: 'hello', script: 'latn', ipa: 'həˈləʊ' })).toBe(
        true,
      );
    });

    it('should return false when all phonetic fields are empty', () => {
      expect(hasLexemePhoneticLayers({ primary: 'hello', script: 'latn' })).toBe(false);
    });

    it('should return false when phonetic fields are blank', () => {
      expect(
        hasLexemePhoneticLayers({
          primary: 'hello',
          script: 'latn',
          pinyin: '',
          zhuyin: '   ',
        }),
      ).toBe(false);
    });
  });

  describe('hasLexemeContent', () => {
    it('should return false for null', () => {
      expect(hasLexemeContent(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(hasLexemeContent(undefined)).toBe(false);
    });

    it('should return true when primary is present', () => {
      expect(hasLexemeContent({ primary: 'hello', script: 'latn' })).toBe(true);
    });

    it('should return true when phonetic layers present but primary empty', () => {
      expect(hasLexemeContent({ primary: '', script: 'latn', pinyin: 'hello' })).toBe(true);
    });

    it('should return false when primary empty and no phonetic layers', () => {
      expect(hasLexemeContent({ primary: '', script: 'latn' })).toBe(false);
    });
  });

  describe('resolveIpaString', () => {
    it('should return null for undefined', () => {
      expect(resolveIpaString(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(resolveIpaString('')).toBeNull();
    });

    it('should return trimmed string for plain string', () => {
      expect(resolveIpaString('  həˈləʊ  ')).toBe('həˈləʊ');
    });

    it('should return null for empty array', () => {
      expect(resolveIpaString([])).toBeNull();
    });

    it('should return first variant when no preferred label', () => {
      const ipa = [
        { label: 'BrE', transcription: '[həˈləʊ]' },
        { label: 'AmE', transcription: '[həˈloʊ]' },
      ];
      expect(resolveIpaString(ipa)).toBe('[həˈləʊ]');
    });

    it('should return matched variant by label', () => {
      const ipa = [
        { label: 'BrE', transcription: '[həˈləʊ]' },
        { label: 'AmE', transcription: '[həˈloʊ]' },
      ];
      expect(resolveIpaString(ipa, 'AmE')).toBe('[həˈloʊ]');
    });

    it('should return first variant when preferred label not found', () => {
      const ipa = [{ label: 'BrE', transcription: '[həˈləʊ]' }];
      expect(resolveIpaString(ipa, 'AmE')).toBe('[həˈləʊ]');
    });

    it('should return null when matched variant has empty transcription', () => {
      const ipa = [{ label: 'AmE', transcription: '' }];
      expect(resolveIpaString(ipa, 'AmE')).toBeNull();
    });

    it('should return first variant when preferred label not found', () => {
      const ipa = [
        { label: 'BrE', transcription: '[həˈləʊ]' },
        { label: 'AmE', transcription: '[həˈloʊ]' },
      ];
      expect(resolveIpaString(ipa, 'FrE')).toBe('[həˈləʊ]');
    });
  });

  describe('resolveRomanizationReading', () => {
    it('should resolve pinyin', () => {
      const lexeme = { primary: '国', script: 'hani' as const, pinyin: 'guó' };
      expect(resolveRomanizationReading(lexeme, 'pinyin')).toBe('guó');
    });

    it('should resolve zhuyin', () => {
      const lexeme = { primary: '国', script: 'hani' as const, zhuyin: 'ㄍㄨㄛˊ' };
      expect(resolveRomanizationReading(lexeme, 'zhuyin')).toBe('ㄍㄨㄛˊ');
    });

    it('should resolve palladius', () => {
      const lexeme = { primary: 'hello', script: 'latn' as const, palladius: 'хеллоу' };
      expect(resolveRomanizationReading(lexeme, 'palladius')).toBe('хеллоу');
    });

    it('should return null for missing reading', () => {
      const lexeme = { primary: 'hello', script: 'latn' as const };
      expect(resolveRomanizationReading(lexeme, 'pinyin')).toBeNull();
    });

    it('should trim reading', () => {
      const lexeme = { primary: 'hello', script: 'latn' as const, pinyin: '  hello  ' };
      expect(resolveRomanizationReading(lexeme, 'pinyin')).toBe('hello');
    });
  });

  describe('resolveLexemeRubyAnnotation', () => {
    it('should resolve ruby for hani script', () => {
      const lexeme = { primary: '国', script: 'hani' as const, pinyin: 'guó' };
      expect(resolveLexemeRubyAnnotation(lexeme, 'pinyin')).toBe('guó');
    });

    it('should return null for non-hani script', () => {
      const lexeme = { primary: 'hello', script: 'latn' as const, pinyin: 'hello' };
      expect(resolveLexemeRubyAnnotation(lexeme, 'pinyin')).toBeNull();
    });
  });

  describe('resolveVisibleRomanizationReadings', () => {
    it('should return empty for non-hani script with no romanization', () => {
      const lexeme = { primary: 'hello', script: 'latn' as const };
      expect(resolveVisibleRomanizationReadings(lexeme, ['pinyin'])).toEqual([]);
    });

    it('should filter by enabled systems', () => {
      const lexeme = {
        primary: '国',
        script: 'hani' as const,
        pinyin: 'guó',
        zhuyin: 'ㄍㄨㄛˊ',
      };
      const result = resolveVisibleRomanizationReadings(lexeme, ['pinyin']);
      expect(result).toEqual([{ system: 'pinyin', reading: 'guó' }]);
    });

    it('should return readings in display order', () => {
      const lexeme = {
        primary: '国',
        script: 'hani' as const,
        pinyin: 'guó',
        zhuyin: 'ㄍㄨㄛˊ',
        palladius: 'го',
      };
      const result = resolveVisibleRomanizationReadings(lexeme, ['palladius', 'pinyin']);
      expect(result).toEqual([
        { system: 'pinyin', reading: 'guó' },
        { system: 'palladius', reading: 'го' },
      ]);
    });

    it('should skip systems with no reading', () => {
      const lexeme = {
        primary: '国',
        script: 'hani' as const,
        pinyin: 'guó',
      };
      const result = resolveVisibleRomanizationReadings(lexeme, ['pinyin', 'zhuyin']);
      expect(result).toEqual([{ system: 'pinyin', reading: 'guó' }]);
    });
  });

  describe('mergeLexeme', () => {
    it('should merge patch into base', () => {
      const base = { primary: 'hello', script: 'latn' as const, pinyin: 'hello' };
      const patch = { pinyin: 'world' };
      const result = mergeLexeme(base, patch);

      expect(result.primary).toBe('hello');
      expect(result.pinyin).toBe('world');
    });

    it('should fall back to empty lexeme when base is undefined', () => {
      const patch = { primary: 'test', script: 'hani' as const };
      const result = mergeLexeme(undefined, patch);

      expect(result.primary).toBe('test');
      expect(result.script).toBe('hani');
    });

    it('should copy ipa array to new array', () => {
      const base = { primary: 'hello', script: 'latn' as const };
      const ipa = [{ label: 'BrE', transcription: '[həˈləʊ]' }];
      const patch = { ipa };

      const result = mergeLexeme(base, patch);
      expect(result.ipa).not.toBe(ipa);
      expect(result.ipa).toEqual(ipa);
    });

    it('should copy ipa string as-is', () => {
      const base = { primary: 'hello', script: 'latn' as const };
      const patch = { ipa: 'həˈləʊ' };

      const result = mergeLexeme(base, patch);
      expect(result.ipa).toBe('həˈləʊ');
    });

    it('should copy acceptedReadings to new array', () => {
      const base = { primary: 'hello', script: 'latn' as const };
      const patch = { acceptedReadings: ['hello', 'world'] };

      const result = mergeLexeme(base, patch);
      expect(result.acceptedReadings).not.toBe(patch.acceptedReadings);
    });

    it('should copy tones to new array', () => {
      const base = { primary: 'hello', script: 'latn' as const };
      const patch = { tones: [1 as const] };

      const result = mergeLexeme(base, patch);
      expect(result.tones).not.toBe(patch.tones);
    });
  });

  describe('parseIpaVariants', () => {
    it('should return undefined for empty input', () => {
      expect(parseIpaVariants('')).toBeUndefined();
    });

    it('should return trimmed string for single value', () => {
      expect(parseIpaVariants('  həˈləʊ  ')).toBe('həˈləʊ');
    });

    it('should split on pipe and parse with colon', () => {
      const result = parseIpaVariants('BrE:həˈləʊ | AmE:həˈloʊ');
      expect(result).toEqual([
        { label: 'BrE', transcription: 'həˈləʊ' },
        { label: 'AmE', transcription: 'həˈloʊ' },
      ]);
    });

    it('should parse without label when no colon', () => {
      const result = parseIpaVariants('həˈləʊ | həˈloʊ');
      expect(result).toEqual([{ transcription: 'həˈləʊ' }, { transcription: 'həˈloʊ' }]);
    });

    it('should trim segments', () => {
      const result = parseIpaVariants(' BrE : həˈləʊ ');
      expect(result).toBe('BrE : həˈləʊ');
    });
  });

  describe('formatIpaForEditor', () => {
    it('should return empty string for null', () => {
      expect(formatIpaForEditor(null as never)).toBe('');
    });

    it('should return string as-is', () => {
      expect(formatIpaForEditor('həˈləʊ')).toBe('həˈləʊ');
    });

    it('should format array with labels', () => {
      const ipa = [
        { label: 'BrE', transcription: '[həˈləʊ]' },
        { label: 'AmE', transcription: '[həˈloʊ]' },
      ];
      expect(formatIpaForEditor(ipa)).toBe('BrE:[həˈləʊ] | AmE:[həˈloʊ]');
    });

    it('should format array without labels', () => {
      const ipa = [{ transcription: '[həˈləʊ]' }];
      expect(formatIpaForEditor(ipa)).toBe('[həˈləʊ]');
    });
  });
});
