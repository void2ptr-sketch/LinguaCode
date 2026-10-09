import type { Card, Course, Lesson, Scenario } from '../../models';

/**
 * Manifest of content seed files used to initialize the application.
 *
 * @remarks
 * Lists the JSON files containing cards, scenarios, and courses for the content seed process.
 */
export type ContentManifest = {
  version: number;
  cardFiles: readonly string[];
  scenarioFiles: readonly string[];
  courseFiles: readonly string[];
};

/**
 * Fixture for scenarios seed data.
 *
 * @remarks
 * Used to load scenario JSON files during the content seed initialization process.
 */
export type ScenariosSeedFixture = {
  scenarios: readonly Scenario[];
};

/**
 * Fixture for courses and lessons seed data.
 *
 * @remarks
 * Used to load course and lesson JSON files during the content seed initialization process.
 */
export type CoursesSeedFixture = {
  courses: readonly Course[];
  lessons: readonly Lesson[];
};

/**
 * Fixture for cards seed data.
 *
 * @remarks
 * Used to load card JSON files during the content seed initialization process.
 */
export type CardsSeedFixture = {
  cards: readonly Card[];
};
