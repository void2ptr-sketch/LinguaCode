/**
 * Levels of the content hierarchy used by authoring dialogs.
 *
 * @remarks
 * The order is fixed: language pair → course → program → lesson → scenario.
 * Every level depends on the previous one (cascade).
 */
export type HierarchyLevel = 'languagePair' | 'course' | 'program' | 'lesson' | 'scenario';

/**
 * A single option rendered in a hierarchy combo box.
 *
 * @remarks
 * `languagePair` options use the numeric `language_pairs.id`; all other levels
 * use the backend string ID (mapped from the numeric PK by the API services).
 */
export type HierarchyOption = {
  id: string | number;
  title: string;
};

/**
 * Selected values of the content hierarchy.
 *
 * @remarks
 * Missing values mean "not selected". The service never invents IDs; it only
 * resolves them from the backend tables.
 */
export type HierarchyValue = {
  /** Numeric ID from `language_pairs.id`. */
  languagePairId?: number;
  /** ID from `education_courses.id`. */
  courseId?: string;
  /** ID from `education_programs.id`. */
  programId?: string;
  /** ID from `education_lessons.id`. */
  lessonId?: string;
  /** ID from `education_scenarios.id`. */
  scenarioId?: string;
};

/**
 * Scope used when loading courses.
 *
 * @remarks
 * Authoring dialogs should use `all` so authors can bind content to drafts.
 * Learner-facing pickers should use `published`.
 */
export type HierarchyScope = 'all' | 'published';
