import { describe, expect, it } from 'vitest';

import {
  getLanguageBadgeCode,
  getLanguageBadgeColor,
  getLanguageBadgeTextColor,
} from './language-badge.utils';

describe('getLanguageBadgeColor', () => {
  it('returns a deterministic hsl color per code', () => {
    const first = getLanguageBadgeColor('cpp');
    expect(first).toBe(getLanguageBadgeColor('cpp'));
    expect(first).toMatch(/^hsl\(\d+, 45%, 82%\)$/);
  });

  it('returns different colors for different codes', () => {
    const hues = new Set(['cpp', 'perl', 'js', 'hs', 'rs'].map(getLanguageBadgeColor));
    expect(hues.size).toBeGreaterThan(1);
  });

  it('falls back to a neutral CSS variable for an empty code', () => {
    expect(getLanguageBadgeColor('')).toBe('var(--mat-sys-outline-variant)');
  });
});

describe('getLanguageBadgeTextColor', () => {
  it('returns a deterministic hsl color per code', () => {
    const first = getLanguageBadgeTextColor('cpp');
    expect(first).toBe(getLanguageBadgeTextColor('cpp'));
    expect(first).toMatch(/^hsl\(\d+, 50%, 25%\)$/);
  });

  it('uses the same hue as the background color', () => {
    const bg = getLanguageBadgeColor('perl');
    const fg = getLanguageBadgeTextColor('perl');
    const bgHue = bg.match(/hsl\((\d+),/)?.[1];
    const fgHue = fg.match(/hsl\((\d+),/)?.[1];
    expect(bgHue).toBe(fgHue);
  });

  it('falls back to a neutral CSS variable for an empty code', () => {
    expect(getLanguageBadgeTextColor('')).toBe('var(--mat-sys-on-surface-variant)');
  });
});

describe('getLanguageBadgeCode', () => {
  it('takes the first two alpha characters uppercased', () => {
    expect(getLanguageBadgeCode('JavaScript')).toBe('JA');
    expect(getLanguageBadgeCode('perl')).toBe('PE');
  });

  it('strips non-alpha characters', () => {
    // 'c++' → alpha 'C' (only 1 char) → falls back to raw code uppercased
    expect(getLanguageBadgeCode('c++')).toBe('C+');
  });

  it('falls back to the raw code uppercased when fewer than two alpha chars', () => {
    expect(getLanguageBadgeCode('+')).toBe('+');
  });

  it('returns empty string for an empty code', () => {
    expect(getLanguageBadgeCode('')).toBe('');
  });
});
