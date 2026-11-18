import type { Card } from '../card/model';
import type { Course, Lesson } from '../course/model';
import type { Program } from '../program/model';
import type { Scenario } from '../scenario/model';
import type { LanguagePair } from '../language-pair/model/language-pair.types';

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
 * The top-level `scenarioId` identifies which scenario these cards belong to.
 */
export type CardsSeedFixture = {
  /** Scenario identifier for all cards in this file. */
  scenarioId?: string;
  /** Array of card objects to seed. */
  cards: readonly Card[];
};

// ─── Nested course format (programs → lessons → scenarios → cards) ───

/**
 * A nested program: contains ordered lessons within a Course.
 *
 * @remarks
 * Used in the new nested course fixture format.
 */
export type NestedProgram = {
  id: string;
  title: string;
  description: string;
  order: number;
  prerequisiteProgramIds?: string[];
  lessons: NestedLesson[];
};

/**
 * A nested lesson: contains ordered scenarios within a Program.
 *
 * @remarks
 * Used in the new nested course fixture format.
 */
export type NestedLesson = {
  id: string;
  title: string;
  description: string;
  order: number;
  prerequisiteLessonIds?: string[];
  scenarios: NestedScenario[];
};

/**
 * A nested scenario: contains inline cards within a Lesson.
 *
 * @remarks
 * Used in the new nested course fixture format.
 * `cards` holds full card objects; `_cardIds` is a fallback for C++ course.
 */
export type NestedScenario = {
  id: string;
  title: string;
  description: string;
  order: number;
  languagePair?: LanguagePair;
  published: boolean;
  cards?: readonly Card[];
  /** Fallback card references when `cards[]` is empty (C++ course). */
  _cardIds?: readonly string[];
};

/**
 * New nested course fixture: programs → lessons → scenarios → cards.
 *
 * @remarks
 * Used in new mock files (course-demo-card-kinds.json, course-zh-a1.json, etc.).
 * Cards are embedded in scenarios; the frontend extracts them into a flat cache.
 */
export type CoursesNestedFixture = {
  id: string;
  title: string;
  description: string;
  languagePair: LanguagePair;
  practiceSettings?: unknown;
  published: boolean;
  authoring: unknown;
  updatedAt: string;
  programs: NestedProgram[];
};

// ─── Export course format (v2) ───

/**
 * Language pair as stored in export format (source/target).
 */
export type ExportLanguagePair = {
  source: string;
  target: string;
};

/**
 * A card wrapper inside an export bundle.
 */
export type ExportCardWrapper = {
  card: Card;
  order: number;
  meta?: {
    difficulty?: string;
    tags?: string[];
    pinyin?: string[] | null;
    tones?: number[] | null;
  };
};

/**
 * A scenario wrapper inside an export bundle.
 */
export type ExportScenarioWrapper = {
  scenario: {
    id: string;
    title: string;
    description: string;
    order: number;
    published: boolean;
    cardSource?: { mode: string; cardIds?: string[] };
    updatedAt?: string;
    languagePair?: ExportLanguagePair;
  };
  order: number;
  cards?: ExportCardWrapper[];
};

/**
 * A lesson wrapper inside an export bundle.
 */
export type ExportLessonWrapper = {
  lesson: {
    id: string;
    title: string;
    description: string;
    order: number;
    updatedAt?: string;
  };
  order: number;
  scenarios?: ExportScenarioWrapper[];
};

/**
 * A program wrapper inside an export bundle.
 */
export type ExportProgramWrapper = {
  program: {
    id: string;
    title: string;
    description: string;
    order: number;
    updatedAt?: string;
  };
  order: number;
  lessons?: ExportLessonWrapper[];
};

/**
 * Course object inside an export bundle.
 */
export type ExportCourse = {
  id: string;
  title: string;
  description: string;
  languagePair: ExportLanguagePair;
  practiceSettings?: unknown;
  published: boolean;
  updatedAt: string;
  authoring?: {
    idea?: string;
    status?: string;
    ideaUpdatedAt?: string;
    materializedAt?: string;
    lastError?: string | null;
  };
};

/**
 * Export course bundle (v2) — generated by export-course-bundle.mjs.
 *
 * @remarks
 * FormatVersion 2: all nested objects are wrapped in { program, lesson, scenario, card } keys.
 * Language pair uses source/target instead of known/learning.
 */
export type ExportCourseBundle = {
  formatVersion: 2;
  exportedAt: string;
  sourceAuthorId?: string;
  course: ExportCourse;
  programs: ExportProgramWrapper[];
};
