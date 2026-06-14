import { lookupEnglishIpa } from './ipa-en-lookup.utils';

describe('ipa-en-lookup.utils', () => {
  it('should lookup simple english ipa', () => {
    expect(lookupEnglishIpa('hello')).toBe('həˈləʊ');
    expect(lookupEnglishIpa('  HELLO ')).toBe('həˈləʊ');
  });

  it('should format multi-variant ipa for editor', () => {
    expect(lookupEnglishIpa('thought')).toBe('BrE:θɔːt | AmE:θɔt');
  });

  it('should return null for unknown words', () => {
    expect(lookupEnglishIpa('')).toBeNull();
    expect(lookupEnglishIpa('xyzzy')).toBeNull();
  });
});
