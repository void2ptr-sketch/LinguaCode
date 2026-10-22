import type { CourseWithPrograms } from '../course/model';
import type { Scenario } from '../scenario/model';

import { setCardSeedCache, setCourseSeedCache, setScenarioSeedCache } from './content-seed.cache';
import type { CourseCatalogState } from '../course/utils/course-catalog-state';
import { normalizeStoredCourseCatalog } from '../course/utils/course-catalog-state';
import type {
  CardsSeedFixture,
  CoursesSeedFixture,
  ScenariosSeedFixture,
} from './content-seed.types';
import { normalizeLegacyCards } from '../card/mapping/card-legacy.mapper';
import { getDefaultCourseCatalog } from '../course/storage/courses-storage';
import { getDefaultScenarios } from '../scenario/utils/scenario-catalog.defaults';
import { normalizeScenario } from '../scenario/utils/scenario-card-source.utils';
import { USER_CONTENT_MIGRATED_KEY } from '../user/overlay/user-content-overlay.types';

import demoCoursesFixture from '../../../../public/data/demo/courses/demo-courses.json';
import perlInterviewCourseFixture from '../../../../public/data/perl/courses/perl-interview-course.json';
import radicalsCourseFixture from '../../../../public/data/chinese/courses/radicals-214-course.json';
import demoScenariosFixture from '../../../../public/data/demo/scenarios/demo-scenarios.json';
import perlInterviewScenariosFixture from '../../../../public/data/perl/scenarios/perl-interview-scenarios.json';
import radicalsScenariosFixture from '../../../../public/data/chinese/scenarios/radicals-scenarios.json';
import selectCardsFixture from '../../../../public/data/demo/cards/demo-cards.json';
import perlInterviewCardsFixture from '../../../../public/data/perl/cards/perl-interview-cards.json';
import radicalsCardsFixture from '../../../../public/data/chinese/cards/radicals-course-cards.json';

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

  const demoCourses = normalizeStoredCourseCatalog(demoCoursesFixture as unknown as CoursesSeedFixture);
  const radicalsCourses = normalizeStoredCourseCatalog(radicalsCourseFixture as unknown as CoursesSeedFixture);
  const perlCourses = normalizeStoredCourseCatalog(
    perlInterviewCourseFixture as unknown as CoursesSeedFixture,
  );

  const catalog: CourseCatalogState = {
    courses: [...demoCourses.courses, ...radicalsCourses.courses, ...perlCourses.courses],
    programs: [...demoCourses.programs, ...radicalsCourses.programs, ...perlCourses.programs],
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

  // Build a map of programId -> courseId for efficient lookup
  const programToCourse = new Map<string, string>();
  for (const program of catalog.programs) {
    programToCourse.set(program.id, program.courseId);
  }

  return {
    courses: zhCourses,
    programs: catalog.programs.filter((p) => zhCourseIds.has(p.courseId)),
    lessons: catalog.lessons.filter((lesson) => zhCourseIds.has(programToCourse.get(lesson.programId) ?? '')),
  };
}

export function getTestZhScenarios(): readonly Scenario[] {
  return getTestDefaultScenarios().filter((scenario) => scenario.languagePair?.learning === 'zh');
}

export function getTestPerlCourseCatalog(): CourseCatalogState {
  const catalog = getTestDefaultCourseCatalog();
  const perlCourses = catalog.courses.filter((course) => course.languagePair.learning === 'perl');
  const perlCourseIds = new Set(perlCourses.map((course) => course.id));

  // Build a map of programId -> courseId for efficient lookup
  const programToCourse = new Map<string, string>();
  for (const program of catalog.programs) {
    programToCourse.set(program.id, program.courseId);
  }

  return {
    courses: perlCourses,
    programs: catalog.programs.filter((p) => perlCourseIds.has(p.courseId)),
    lessons: catalog.lessons.filter((lesson) => perlCourseIds.has(programToCourse.get(lesson.programId) ?? '')),
  };
}

export function getTestDemoCourseWithLessons(): CourseWithPrograms {
  const catalog = getTestDefaultCourseCatalog();
  const course = catalog.courses.find((item) => item.id === 'demo-course');

  if (!course) {
    throw new Error('Demo course seed is missing');
  }

  // Resolve programs for this course from the catalog
  const courseProgramIds = new Set(course.programIds);
  const resolvedPrograms: import('../program/model/program.types').ProgramWithLessons[] = [];

  for (const program of catalog.programs) {
    if (program.courseId === course.id) {
      const programLessons = catalog.lessons.filter((l) => l.programId === program.id);
      resolvedPrograms.push({
        ...program,
        lessons: programLessons,
      });
    }
  }

  return {
    ...course,
    programs: resolvedPrograms,
  };
}
