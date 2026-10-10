import { describe, it, expect, beforeEach } from 'vitest';

import { scenarioDisplayLabel } from './scenario-display-label.utils';
import {
  setScenarioSeedCache,
  resetContentSeedCache,
} from '../../content-seed/content-seed.cache';
import type { Scenario } from '../../../models';

describe('scenario-display-label.utils', () => {
  const testScenarios: Scenario[] = [
    { id: 'sc-1', title: 'Scenario One' } as Scenario,
    { id: 'sc-2', title: 'Scenario Two' } as Scenario,
    { id: 'sc-3', title: '' } as Scenario,
  ];

  beforeEach(() => {
    resetContentSeedCache();
  });

  it('should return the provided title when it is a non-empty trimmed string', () => {
    expect(scenarioDisplayLabel('sc-1', '  My Scenario  ')).toBe('My Scenario');
  });

  it('should return the title as-is when already trimmed', () => {
    expect(scenarioDisplayLabel('sc-1', 'Hello World')).toBe('Hello World');
  });

  it('should fall back to seed cache title when title is empty string', () => {
    setScenarioSeedCache(testScenarios);

    expect(scenarioDisplayLabel('sc-2', '')).toBe('Scenario Two');
  });

  it('should fall back to seed cache title when title is null', () => {
    setScenarioSeedCache(testScenarios);

    expect(scenarioDisplayLabel('sc-1', null)).toBe('Scenario One');
  });

  it('should fall back to seed cache title when title is whitespace only', () => {
    setScenarioSeedCache(testScenarios);

    expect(scenarioDisplayLabel('sc-2', '   ')).toBe('Scenario Two');
  });

  it('should return scenarioId when title is empty and scenario not found in seed cache', () => {
    setScenarioSeedCache(testScenarios);

    expect(scenarioDisplayLabel('missing-id', '')).toBe('missing-id');
  });

  it('should return scenarioId when title is undefined', () => {
    setScenarioSeedCache([]);

    expect(scenarioDisplayLabel('fallback-id', undefined)).toBe('fallback-id');
  });

  it('should prefer provided title over seed cache title', () => {
    setScenarioSeedCache(testScenarios);

    expect(scenarioDisplayLabel('sc-2', 'Custom Title')).toBe('Custom Title');
  });

  it('should handle seed cache entry with empty title', () => {
    setScenarioSeedCache(testScenarios);

    // When title is empty and seed cache has empty title, returns empty string (not scenarioId)
    // because seedTitle is '' which is falsy but the fallback uses ?? which only checks null/undefined
    expect(scenarioDisplayLabel('sc-3', '')).toBe('');
  });

  it('should work with empty seed cache', () => {
    setScenarioSeedCache([]);

    expect(scenarioDisplayLabel('any-id', '')).toBe('any-id');
  });

  it('should return scenarioId when title is empty string and cache is empty', () => {
    expect(scenarioDisplayLabel('fallback', '')).toBe('fallback');
  });
});
