import { describe, expect, it } from 'vitest';

import {
  HELP_USAGE_SCENARIOS,
  type HelpUsageScenario,
} from '../../../pages/help-usage-scenarios/help-usage-scenarios.data';

describe('help-usage-scenarios.data', () => {
  it('should export HELP_USAGE_SCENARIOS', () => {
    expect(HELP_USAGE_SCENARIOS).toBeDefined();
    expect(Array.isArray(HELP_USAGE_SCENARIOS)).toBe(true);
  });

  it('should have at least one scenario', () => {
    expect(HELP_USAGE_SCENARIOS.length).toBeGreaterThan(0);
  });

  it('should have scenario entries with required fields', () => {
    HELP_USAGE_SCENARIOS.forEach((scenario: HelpUsageScenario) => {
      expect(scenario.id).toBeDefined();
      expect(scenario.title).toBeDefined();
      expect(scenario.tagline).toBeDefined();
      expect(scenario.audience).toBeDefined();
      expect(Array.isArray(scenario.highlights)).toBe(true);
      expect(scenario.icon).toBeDefined();
      expect(scenario.ctaLabel).toBeDefined();
      expect(scenario.ctaPath).toBeDefined();
    });
  });
});
