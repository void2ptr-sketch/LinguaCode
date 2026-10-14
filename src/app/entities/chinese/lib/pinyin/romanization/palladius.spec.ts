import { pinyinSyllableToPalladius, pinyinToPalladius } from './palladius';

describe('pinyinToPalladius', () => {
  describe('pinyinSyllableToPalladius', () => {
    it('should convert basic syllables to Palladius', () => {
      expect(pinyinSyllableToPalladius('ba')).toBe('ба');
      expect(pinyinSyllableToPalladius('ma')).toBe('ма');
      expect(pinyinSyllableToPalladius('ni')).toBe('ни');
      expect(pinyinSyllableToPalladius('zhong')).toBe('чжун');
    });

    it('should handle ü via v — lookups use v form', () => {
      // Таблица Палладия содержит слоги с ü (не lv), поэтому lv → null
      // Реальные слоги с ü после j/q/x записаны как ju/qu/xu
      expect(pinyinSyllableToPalladius('lü')).toBeNull();
      expect(pinyinSyllableToPalladius('nv')).toBeNull();
      // ju (ü после j) маппится
      expect(pinyinSyllableToPalladius('ju')).toBe('цзюй');
      expect(pinyinSyllableToPalladius('qu')).toBe('цюй');
      expect(pinyinSyllableToPalladius('xu')).toBe('сюй');
    });

    it('should strip tone marks before lookup', () => {
      expect(pinyinSyllableToPalladius('mā')).toBe('ма');
      expect(pinyinSyllableToPalladius('nǐ')).toBe('ни');
      expect(pinyinSyllableToPalladius('hǎo')).toBe('хао');
    });

    it('should return null for unknown syllables', () => {
      expect(pinyinSyllableToPalladius('xyz')).toBeNull();
      expect(pinyinSyllableToPalladius('')).toBeNull();
    });

    it('should handle empty and whitespace input', () => {
      expect(pinyinSyllableToPalladius('')).toBeNull();
      expect(pinyinSyllableToPalladius('  ')).toBeNull();
    });

    it('should handle case insensitivity', () => {
      expect(pinyinSyllableToPalladius('MA')).toBe('ма');
      expect(pinyinSyllableToPalladius('Ni')).toBe('ни');
    });

    it('should cover common syllables from each consonant group', () => {
      const testCases: [string, string | null][] = [
        ['ba', 'ба'],
        ['cha', 'ча'],
        ['da', 'да'],
        ['fa', 'фа'],
        ['ga', 'га'],
        ['ha', 'ха'],
        ['ji', 'цзи'],
        ['ka', 'ка'],
        ['la', 'ла'],
        ['ma', 'ма'],
        ['na', 'на'],
        ['pa', 'па'],
        ['qi', 'ци'],
        ['ran', 'жань'],
        ['sa', 'са'],
        ['ta', 'та'],
        ['wa', 'ва'],
        ['xi', 'си'],
        ['ya', 'я'],
        ['yi', 'и'],
        ['za', 'цза'],
        ['zha', 'чжа'],
        ['zi', 'цзы'],
      ];

      for (const [pinyin, expected] of testCases) {
        expect(pinyinSyllableToPalladius(pinyin)).toBe(expected);
      }
    });
  });

  describe('pinyinToPalladius (multi-syllable)', () => {
    it('should convert multi-syllable pinyin', () => {
      expect(pinyinToPalladius('ni hao')).toBe('ни хао');
      expect(pinyinToPalladius('zhong guo')).toBe('чжун го');
    });

    it('should handle tones in multi-syllable input', () => {
      expect(pinyinToPalladius('nǐ hǎo')).toBe('ни хао');
      // māma — один слог, маппинг только по known syllables
      expect(pinyinToPalladius('mā ma')).toBe('ма ма');
    });

    it('should preserve unknown syllables as-is', () => {
      expect(pinyinToPalladius('ni xyz')).toBe('ни xyz');
    });

    it('should handle multiple spaces', () => {
      expect(pinyinToPalladius('ni   hao')).toBe('ни хао');
    });

    it('should handle empty input', () => {
      expect(pinyinToPalladius('')).toBe('');
      expect(pinyinToPalladius('  ')).toBe('');
    });
  });
});
