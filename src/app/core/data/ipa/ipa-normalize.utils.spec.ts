import { answersMatchIpa, normalizeIpa } from './ipa-normalize.utils';

describe('ipa-normalize.utils', () => {
  it('should normalize ipa brackets and spaces', () => {
    expect(normalizeIpa('[ həˈləʊ ]')).toBe('həˈləʊ');
  });

  it('should compare ipa answers', () => {
    expect(answersMatchIpa('[həˈloʊ]', 'həˈloʊ')).toBe(true);
    expect(answersMatchIpa('həˈloʊ', 'həˈləʊ')).toBe(false);
  });
});
