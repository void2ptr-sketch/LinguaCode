import {
  lookupHanRadicalHint,
  lookupHanStrokeGuides,
  primaryHanCharacter,
} from './draw-stroke-guides.data';

describe('draw-stroke-guides.data', () => {
  it('should lookup stroke guides for curated han characters', () => {
    expect(lookupHanStrokeGuides('人').length).toBe(2);
    expect(lookupHanStrokeGuides('人')[0]?.order).toBe(1);
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
