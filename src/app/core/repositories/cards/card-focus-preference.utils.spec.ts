import { normalizeCardFocusFullscreen } from './card-focus-preference.utils';

describe('card-focus-preference.utils', () => {
  it('should normalize card focus fullscreen flag', () => {
    expect(normalizeCardFocusFullscreen(true)).toBe(true);
    expect(normalizeCardFocusFullscreen(false)).toBe(false);
    expect(normalizeCardFocusFullscreen(undefined)).toBe(false);
    expect(normalizeCardFocusFullscreen('true')).toBe(false);
  });
});
