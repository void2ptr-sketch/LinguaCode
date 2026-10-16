import {
  DEFAULT_TONE_OPTIONS,
  isToneMark,
  normalizeToneOptions,
  toneMarkLabel,
} from './tone-mark.utils';

describe('tone-mark.utils', () => {
  it('should provide default tone options 1–4', () => {
    expect(DEFAULT_TONE_OPTIONS).toEqual([1, 2, 3, 4]);
  });

  it('should validate tone marks', () => {
    expect(isToneMark(1)).toBe(true);
    expect(isToneMark(5)).toBe(true);
    expect(isToneMark(0)).toBe(false);
    expect(isToneMark(6)).toBe(false);
  });

  it('should normalize tone option lists', () => {
    expect(normalizeToneOptions([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
    expect(normalizeToneOptions([4, 2, 4, 1])).toEqual([1, 2, 4]);
    expect(normalizeToneOptions([1])).toBeNull();
  });

  it('should provide russian tone labels', () => {
    expect(toneMarkLabel(1)).toBe('1-й тон');
    expect(toneMarkLabel(5)).toBe('лёгкий');
  });
});
