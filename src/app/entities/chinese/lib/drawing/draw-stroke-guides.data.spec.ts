import {
  lookupHanComponentPinyin,
  lookupHanRadicalHint,
  primaryHanCharacter,
} from './draw-stroke-guides.data';

describe('draw-stroke-guides.data', () => {
  it('should lookup component pinyin for radical coloring', () => {
    expect(lookupHanComponentPinyin('女')).toBe('nǚ');
    expect(lookupHanComponentPinyin('彳')).toBe('chì');
    expect(lookupHanComponentPinyin('X')).toBeNull();
  });

  it('should return null for empty component pinyin key', () => {
    expect(lookupHanComponentPinyin('')).toBeNull();
    expect(lookupHanComponentPinyin('   ')).toBeNull();
  });

  it('should lookup radical hints', () => {
    expect(lookupHanRadicalHint('好')).toBe('女 + 子');
    expect(lookupHanRadicalHint('X')).toBeNull();
  });

  it('should return null for empty radical hint key', () => {
    expect(lookupHanRadicalHint('')).toBeNull();
    expect(lookupHanRadicalHint('   ')).toBeNull();
  });

  it('should pick first han character from string', () => {
    expect(primaryHanCharacter('你好')).toBe('你');
    expect(primaryHanCharacter('Hello')).toBe('Hello');
  });

  it('should return trimmed value when no han character found', () => {
    expect(primaryHanCharacter('  abc  ')).toBe('abc');
  });

  it('should return trimmed value when string is empty', () => {
    expect(primaryHanCharacter('')).toBe('');
  });
});
