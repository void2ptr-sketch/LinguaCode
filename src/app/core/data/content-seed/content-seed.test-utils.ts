import type { CourseWithLessons, Scenario } from '../../models';

import { setCardSeedCache, setCourseSeedCache, setScenarioSeedCache } from './content-seed.cache';
import type { CourseCatalogState } from '../courses/course-catalog-state';
import { normalizeStoredCourseCatalog } from '../courses/course-catalog-state';
import type {
  CardsSeedFixture,
  CoursesSeedFixture,
  ScenariosSeedFixture,
} from './content-seed.types';
import { normalizeLegacyCards } from '../cards/card-legacy.mapper';
import { getDefaultCourseCatalog } from '../courses/courses-storage';
import { getDefaultScenarios } from '../scenarios/scenario-catalog.defaults';
import { normalizeScenario } from '../scenarios/scenario-card-source.utils';
import { USER_CONTENT_MIGRATED_KEY } from '../user/user-content-overlay.types';

import demoCoursesFixture from '../../../../../public/data/courses/demo-courses.json';
import perlInterviewCourseFixture from '../../../../../public/data/courses/perl-interview-course.json';
import radicalsCourseFixture from '../../../../../public/data/courses/radicals-214-course.json';
import demoScenariosFixture from '../../../../../public/data/scenarios/demo-scenarios.json';
import perlInterviewScenariosFixture from '../../../../../public/data/scenarios/perl-interview-scenarios.json';
import radicalsScenariosFixture from '../../../../../public/data/scenarios/radicals-scenarios.json';
import selectCardsFixture from '../../../../../public/data/cards/demo-cards.json';
import perlInterviewCardsFixture from '../../../../../public/data/cards/perl-interview-cards.json';
import radicalsCardsFixture from '../../../../../public/data/cards/radicals-course-cards.json';

export function seedTestContentCache(): void {
  const demoScenarios = (demoScenariosFixture as ScenariosSeedFixture).scenarios.map((scenario) =>
    normalizeScenario(scenario),
  );
  const radicalsScenarios = (radicalsScenariosFixture as ScenariosSeedFixture).scenarios.map(
    (scenario) => normalizeScenario(scenario),
  );
  const perlScenarios = (perlInterviewScenariosFixture as ScenariosSeedFixture).scenarios.map(
    (scenario) => normalizeScenario(scenario),
  );

  setScenarioSeedCache([...demoScenarios, ...radicalsScenarios, ...perlScenarios]);

  const demoCourses = normalizeStoredCourseCatalog(demoCoursesFixture as CoursesSeedFixture);
  const radicalsCourses = normalizeStoredCourseCatalog(radicalsCourseFixture as CoursesSeedFixture);
  const perlCourses = normalizeStoredCourseCatalog(
    perlInterviewCourseFixture as CoursesSeedFixture,
  );

  const catalog: CourseCatalogState = {
    courses: [...demoCourses.courses, ...radicalsCourses.courses, ...perlCourses.courses],
    lessons: [...demoCourses.lessons, ...radicalsCourses.lessons, ...perlCourses.lessons],
  };

  setCourseSeedCache(catalog);
  setCardSeedCache(
    normalizeLegacyCards([
      ...(selectCardsFixture as CardsSeedFixture).cards,
      ...(radicalsCardsFixture as CardsSeedFixture).cards,
      ...(perlInterviewCardsFixture as CardsSeedFixture).cards,
    ]),
  );
  localStorage.setItem(USER_CONTENT_MIGRATED_KEY, '1');
}

export function getTestDefaultCourseCatalog(): CourseCatalogState {
  seedTestContentCache();
  return getDefaultCourseCatalog();
}

export function getTestDefaultScenarios(): readonly Scenario[] {
  seedTestContentCache();
  return getDefaultScenarios();
}

export function getTestZhCourseCatalog(): CourseCatalogState {
  const catalog = getTestDefaultCourseCatalog();
  const zhCourses = catalog.courses.filter((course) => course.languagePair.learning === 'zh');
  const zhCourseIds = new Set(zhCourses.map((course) => course.id));

  return {
    courses: zhCourses,
    lessons: catalog.lessons.filter((lesson) => zhCourseIds.has(lesson.courseId)),
  };
}

export function getTestZhScenarios(): readonly Scenario[] {
  return getTestDefaultScenarios().filter((scenario) => scenario.languagePair?.learning === 'zh');
}

export function getTestPerlCourseCatalog(): CourseCatalogState {
  const catalog = getTestDefaultCourseCatalog();
  const perlCourses = catalog.courses.filter((course) => course.languagePair.learning === 'perl');
  const perlCourseIds = new Set(perlCourses.map((course) => course.id));

  return {
    courses: perlCourses,
    lessons: catalog.lessons.filter((lesson) => perlCourseIds.has(lesson.courseId)),
  };
}

export function getTestDemoCourseWithLessons(): CourseWithLessons {
  const catalog = getTestDefaultCourseCatalog();
  const course = catalog.courses.find((item) => item.id === 'demo-course');

  if (!course) {
    throw new Error('Demo course seed is missing');
  }

  return {
    ...course,
    lessons: catalog.lessons.filter((lesson) => lesson.courseId === 'demo-course'),
  };
}
