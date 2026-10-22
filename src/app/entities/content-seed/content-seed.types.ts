import type { Card } from '../card/model';
import type { Course, Lesson } from '../course/model';
import type { Program } from '../program/model';
import type { Scenario } from '../scenario/model';

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
 * Fixture for courses, programs, and lessons seed data.
 *
 * @remarks
 * Used to load course, program, and lesson JSON files during the content seed initialization process.
 */
export type CoursesSeedFixture = {
  /** Array of course objects to seed. */
  courses: readonly Course[];
  /** Array of program objects to seed. */
  programs: readonly Program[];
  /** Array of lesson objects to seed. */
  lessons: readonly Lesson[];
};

/**
 * Fixture for cards seed data.
 *
 * @remarks
 * Used to load card JSON files during the content seed initialization process.
 */
export type CardsSeedFixture = {
  /** Array of card objects to seed. */
  cards: readonly Card[];
};
