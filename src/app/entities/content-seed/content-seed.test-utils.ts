import type { CourseWithPrograms } from '../course/model';
import type { Scenario } from '../scenario/model';

import { setCardSeedCache, setCourseSeedCache, setScenarioSeedCache } from './content-seed.cache';
import type { CourseCatalogState } from '../course/utils/course-catalog-state';
import { normalizeNestedCourseCatalog, isNestedFormat } from '../course/utils/course-catalog-state';
import type {
  CardsSeedFixture,
  CoursesNestedFixture,
} from './content-seed.types';
import { normalizeLegacyCards } from '../card/mapping/card-legacy.mapper';
import { getDefaultCourseCatalog } from '../course/storage/courses-storage';
import { getDefaultScenarios } from '../scenario/utils/scenario-catalog.defaults';
import { normalizeScenario } from '../scenario/utils/scenario-card-source.utils';
import { USER_CONTENT_MIGRATED_KEY } from '../user/overlay/user-content-overlay.types';

import demoCardsFixture from '../../../../public/data/demo/cards/demo-cards.json';
import perlCardsFixture from '../../../../public/data/perl/cards/perl-interview-cards.json';

export function seedTestContentCache(): void {
  // No scenarios in the new format — empty array
  setScenarioSeedCache([]);

  // Load nested course fixtures
  const nestedFixtures: CoursesNestedFixture[] = [];

  // Load course fixtures dynamically (nested format)
  const courseFiles = [
    '../../../../public/data/demo/courses/course-demo-card-kinds.json',
    '../../../../public/data/demo/courses/course-zh-a1.json',
    '../../../../public/data/demo/courses/course-zh-conversation.json',
    '../../../../public/data/cpp/courses/course-cpp-complete.json',
    '../../../../public/data/perl/courses/course-ru-perl-db.json',
    '../../../../public/data/perl/courses/course-ru-perl-interview.json',
    '../../../../public/data/chinese/courses/course-zh-radicals-214.json',
  ];

  const allCatalogs: CourseCatalogState[] = [];
  const allCards: import('../card/model').Card[] = [];

  for (const file of courseFiles) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fixture = require(file) as CoursesNestedFixture;
      if (isNestedFormat(fixture)) {
        const result = normalizeNestedCourseCatalog(fixture);
        allCatalogs.push(result.catalog);
        allCards.push(...result.cards);
      }
    } catch {
      // File not found or invalid — skip
    }
  }

  const catalog: CourseCatalogState = {
    courses: allCatalogs.flatMap(c => c.courses),
    programs: allCatalogs.flatMap(c => c.programs),
    lessons: allCatalogs.flatMap(c => c.lessons),
  };

  setCourseSeedCache(catalog);
  setCardSeedCache(
    normalizeLegacyCards([
      ...(demoCardsFixture as CardsSeedFixture).cards,
      ...(perlCardsFixture as CardsSeedFixture).cards,
      ...allCards,
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
    lessons: catalog.lessons.filter((lesson) =>
      zhCourseIds.has(programToCourse.get(lesson.programId) ?? ''),
    ),
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
    lessons: catalog.lessons.filter((lesson) =>
      perlCourseIds.has(programToCourse.get(lesson.programId) ?? ''),
    ),
  };
}

export function getTestDemoCourseWithLessons(): CourseWithPrograms {
  const catalog = getTestDefaultCourseCatalog();
  const course = catalog.courses.find((item) => item.id === 'demo-course');

  if (!course) {
    throw new Error('Demo course seed is missing');
  }

  // Resolve programs for this course from the catalog
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
