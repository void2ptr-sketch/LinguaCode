import type { ScenarioCardSource } from './card-search.types';

export type Scenario = {
  id: string;
  title: string;
  description: string;
  authorId: string;
  cardSource: ScenarioCardSource;
};

export type LegacyScenario = {
  id: string;
  title: string;
  description: string;
  authorId: string;
  cardSource?: ScenarioCardSource;
  cardIds?: readonly string[];
};
