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

  it('should lookup radical hints', () => {
    expect(lookupHanRadicalHint('好')).toBe('女 + 子');
    expect(lookupHanRadicalHint('X')).toBeNull();
  });

  it('should pick first han character from string', () => {
    expect(primaryHanCharacter('你好')).toBe('你');
    expect(primaryHanCharacter('Hello')).toBe('Hello');
  });
});
