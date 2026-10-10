export {
  buildScenarioDifficultyMap,
  collectCourseScenarioIds,
  filterScenarioIdsByDifficulty,
  isOpenPracticeCourse,
  resolveCoursePracticeSettings,
  resolveScenarioDifficulty,
  scenarioCardIds,
} from './course-practice.utils';
export { collectCourseBundle, validateCourseBundle } from './course-bundle.utils';
export type {
  CourseBundle,
  CourseBundleValidation,
  CourseBundleError,
} from './course-bundle.types';
export {
  COURSE_IDEA_MAX_LENGTH,
  emptyCourseAuthoring,
  isCourseAuthoringStatus,
  normalizeCourseAuthoring,
  courseAuthoringWithIdea,
  sameCourseAuthoring,
} from './course-authoring.utils';
export {
  normalizeStoredCourse,
  normalizeStoredLesson,
  mergeStoredCourse,
  mergeStoredLesson,
  normalizeStoredCourseCatalog,
  cloneCourseCatalog,
} from './course-catalog-state';
export type { CourseCatalogState } from './course-catalog-state';
