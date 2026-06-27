import type { Card, Course, Lesson, Scenario } from '../models';

export type ContentManifest = {
  version: number;
  cardFiles: readonly string[];
  scenarioFiles: readonly string[];
  courseFiles: readonly string[];
};

export type ScenariosSeedFixture = {
  scenarios: readonly Scenario[];
};

export type CoursesSeedFixture = {
  courses: readonly Course[];
  lessons: readonly Lesson[];
};

export type CardsSeedFixture = {
  cards: readonly Card[];
};
