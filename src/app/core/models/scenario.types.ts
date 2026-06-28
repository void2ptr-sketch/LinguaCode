import type { LanguagePair } from './language-pair.types';
import type { ScenarioCardSource } from './scenario-card-source.types';

export type Scenario = {
  id: string;
  title: string;
  description: string;
  authorId: string;
  cardSource: ScenarioCardSource;
  published: boolean;
  updatedAt: string;
  languagePair?: LanguagePair;
  courseId?: string;
};

export type LegacyScenario = {
  id: string;
  title: string;
  description: string;
  authorId: string;
  cardSource?: ScenarioCardSource;
  cardIds?: readonly string[];
  published?: boolean;
  updatedAt?: string;
  languagePair?: LanguagePair;
  courseId?: string;
};
