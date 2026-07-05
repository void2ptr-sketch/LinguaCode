import { normalizeCardFocusFullscreen } from './card-focus-preference.utils';

describe('card-focus-preference.utils', () => {
  it('should normalize card focus fullscreen flag', () => {
    expect(normalizeCardFocusFullscreen(true)).toBeTrue();
    expect(normalizeCardFocusFullscreen(false)).toBeFalse();
    expect(normalizeCardFocusFullscreen(undefined)).toBeFalse();
    expect(normalizeCardFocusFullscreen('true')).toBeFalse();
  });
});
