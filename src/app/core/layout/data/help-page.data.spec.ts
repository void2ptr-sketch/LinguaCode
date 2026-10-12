import { describe, expect, it } from 'vitest';

import {
  HELP_PAGE_HERO,
  HELP_PAGE_FEATURES,
  HELP_PAGE_HIERARCHY,
  HELP_PAGE_HIGHLIGHTS,
} from '../../../pages/help/help-page.data';

describe('help-page.data', () => {
  it('should export HELP_PAGE_HERO', () => {
    expect(HELP_PAGE_HERO).toBeDefined();
    expect(HELP_PAGE_HERO.title).toBeDefined();
    expect(HELP_PAGE_HERO.primaryCtaLabel).toBeDefined();
    expect(HELP_PAGE_HERO.primaryCtaPath).toBeDefined();
  });

  it('should export HELP_PAGE_FEATURES', () => {
    expect(HELP_PAGE_FEATURES).toBeDefined();
    expect(Array.isArray(HELP_PAGE_FEATURES)).toBe(true);
    expect(HELP_PAGE_FEATURES.length).toBeGreaterThan(0);
  });

  it('should have feature entries with required fields', () => {
    HELP_PAGE_FEATURES.forEach((feature) => {
      expect(feature.id).toBeDefined();
      expect(feature.title).toBeDefined();
      expect(feature.description).toBeDefined();
      expect(feature.icon).toBeDefined();
      expect(feature.path).toBeDefined();
    });
  });

  it('should export HELP_PAGE_HIERARCHY', () => {
    expect(HELP_PAGE_HIERARCHY).toBeDefined();
    expect(Array.isArray(HELP_PAGE_HIERARCHY)).toBe(true);
    expect(HELP_PAGE_HIERARCHY.length).toBeGreaterThan(0);
  });

  it('should have hierarchy entries with required fields', () => {
    HELP_PAGE_HIERARCHY.forEach((level) => {
      expect(level.id).toBeDefined();
      expect(level.label).toBeDefined();
      expect(level.title).toBeDefined();
      expect(level.description).toBeDefined();
      expect(level.icon).toBeDefined();
    });
  });

  it('should export HELP_PAGE_HIGHLIGHTS', () => {
    expect(HELP_PAGE_HIGHLIGHTS).toBeDefined();
    expect(Array.isArray(HELP_PAGE_HIGHLIGHTS)).toBe(true);
    expect(HELP_PAGE_HIGHLIGHTS.length).toBeGreaterThan(0);
  });

  it('should have hero CTA paths', () => {
    expect(HELP_PAGE_HERO.primaryCtaPath).toBe('/home');
    expect(HELP_PAGE_HERO.secondaryCtaPath).toBe('/help/scenarios');
  });

  it('should have hierarchy levels in order', () => {
    const ids = HELP_PAGE_HIERARCHY.map((level) => level.id);
    expect(ids).toContain('card');
    expect(ids).toContain('scenario');
    expect(ids).toContain('lesson');
    expect(ids).toContain('course');
  });
});
