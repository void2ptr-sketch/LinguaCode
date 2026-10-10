// ===== Services =====
export { CoursesApiService } from './courses-api.service';
export { CourseSearchService } from './course-search.service';

// ===== Stores / Storage =====
export {
  COURSE_CATALOG_STORAGE_KEY,
  DEFAULT_COURSE_CATALOG,
  getDefaultCourseCatalog,
  loadCourseCatalogFromStorage,
  saveCourseCatalogToStorage,
} from './courses-storage';

// ===== Utils =====
export { collectCourseBundle, validateCourseBundle } from './course-bundle.utils';
export {
  collectCourseScenarioIds,
  filterScenarioIdsByDifficulty,
  isOpenPracticeCourse,
  resolveCoursePracticeSettings,
  resolveScenarioDifficulty,
  scenarioCardIds,
  buildScenarioDifficultyMap,
} from './course-practice.utils';
export { filterCourseIndex, matchesCourseIndexEntry } from './course-search.utils';
export { courseToIndexEntry } from './course-index.mapper';
export {
  COURSE_IDEA_MAX_LENGTH,
  emptyCourseAuthoring,
  isCourseAuthoringStatus,
  normalizeCourseAuthoring,
  courseAuthoringWithIdea,
  sameCourseAuthoring,
} from './course-authoring.utils';
export type { CourseCatalogState } from './course-catalog-state';
