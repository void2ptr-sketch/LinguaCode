import { describe, expect, it } from 'vitest';

import { DIFFICULTY_LABELS, CARD_KIND_LABELS, CONTENT_LANGUAGE_LABELS } from './catalog-labels';

describe('catalog-labels', () => {
  it('should export DIFFICULTY_LABELS', () => {
    expect(DIFFICULTY_LABELS).toBeDefined();
    expect(typeof DIFFICULTY_LABELS).toBe('object');
  });

  it('should export CARD_KIND_LABELS', () => {
    expect(CARD_KIND_LABELS).toBeDefined();
    expect(typeof CARD_KIND_LABELS).toBe('object');
  });

  it('should export CONTENT_LANGUAGE_LABELS', () => {
    expect(CONTENT_LANGUAGE_LABELS).toBeDefined();
    expect(typeof CONTENT_LANGUAGE_LABELS).toBe('object');
  });

  it('should have difficulty labels for beginner, intermediate, advanced', () => {
    expect(DIFFICULTY_LABELS.beginner).toBeDefined();
    expect(DIFFICULTY_LABELS.intermediate).toBeDefined();
    expect(DIFFICULTY_LABELS.advanced).toBeDefined();
  });

  it('should have card kind labels', () => {
    const keys = Object.keys(CARD_KIND_LABELS);
    expect(keys.length).toBeGreaterThan(0);
  });

  it('should have content language labels', () => {
    const keys = Object.keys(CONTENT_LANGUAGE_LABELS);
    expect(keys.length).toBeGreaterThan(0);
  });
});
