import { TestBed } from '@angular/core/testing';

import { ScenarioBuilderService } from './scenario-builder.service';

describe('ScenarioBuilderService', () => {
  let service: ScenarioBuilderService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [ScenarioBuilderService],
    });

    service = TestBed.inject(ScenarioBuilderService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  describe('loadScenarios', () => {
    it('should return an array of scenarios', () => {
      const scenarios = service.loadScenarios();
      expect(Array.isArray(scenarios)).toBe(true);
    });
  });

  describe('saveScenarios', () => {
    it('should not throw when saving scenarios', () => {
      expect(() => service.saveScenarios([])).not.toThrow();
    });
  });
});
