import type { CourseWithPrograms } from '../course/model';
import type { Scenario } from '../scenario/model';

import { setCardSeedCache, setCourseSeedCache, setScenarioSeedCache } from './content-seed.cache';
import type { CourseCatalogState } from '../course/utils/course-catalog-state';
import { normalizeNestedCourseCatalog, isNestedFormat } from '../course/utils/course-catalog-state';
import type { CardsSeedFixture, CoursesNestedFixture } from './content-seed.types';
import { normalizeLegacyCards } from '../card/mapping/card-legacy.mapper';
import { getDefaultCourseCatalog } from '../course/storage/courses-storage';
import { getDefaultScenarios } from '../scenario/utils/scenario-catalog.defaults';
import { USER_CONTENT_MIGRATED_KEY } from '../user/overlay/user-content-overlay.types';

import demoCardsFixture from '../../../../public/data/demo/cards/demo-cards.json';
import perlCardsFixture from '../../../../public/data/perl/cards/perl-interview-cards.json';
import courseDemoCardKinds from '../../../../public/data/demo/courses/course-demo-card-kinds.json';
import courseZhA1 from '../../../../public/data/demo/courses/course-zh-a1.json';
import courseZhConversation from '../../../../public/data/demo/courses/course-zh-conversation.json';
import courseCppComplete from '../../../../public/data/cpp/courses/course-cpp-complete.json';
import courseRuPerlInterview from '../../../../public/data/perl/courses/course-ru-perl-interview.json';
import courseZhRadicals214 from '../../../../public/data/chinese/courses/course-zh-radicals-214.json';

/** Default scenarios used by tests when no scenario fixtures are available. */
const TEST_DEFAULT_SCENARIOS = [
  {
    id: 'scenario-zh-greetings',
    title: 'Приветствие',
    description: 'Basic Chinese greetings',
    authorId: 'system',
    cardSource: { mode: 'fixed' as const, cardIds: ['select-zh-1'] },
    published: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    languagePair: { known: 'ru' as const, learning: 'zh' as const },
  },
  {
    id: 'scenario-zh-numbers',
    title: 'Числа',
    description: 'Chinese numbers',
    authorId: 'system',
    cardSource: { mode: 'fixed' as const, cardIds: ['select-zh-1'] },
    published: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    languagePair: { known: 'ru' as const, learning: 'zh' as const },
  },
  {
    id: 'scenario-zh-colors',
    title: 'Цвета',
    description: 'Chinese colors',
    authorId: 'system',
    cardSource: { mode: 'fixed' as const, cardIds: ['select-zh-1'] },
    published: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    languagePair: { known: 'ru' as const, learning: 'zh' as const },
  },
  {
    id: 'scenario-zh-family',
    title: 'Семья',
    description: 'Chinese family members',
    authorId: 'system',
    cardSource: { mode: 'fixed' as const, cardIds: ['select-zh-1'] },
    published: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    languagePair: { known: 'ru' as const, learning: 'zh' as const },
  },
  // Radicals scenarios (01–11) — extracted from course-zh-radicals-214.json
  ...Array.from({ length: 11 }, (_, i) => {
    const num = i + 1;
    const start = num * 10 - 9;
    const end = num * 10;
    const cardIds = Array.from(
      { length: 10 },
      (_, j) => `draw-radical-${String(start + j).padStart(3, '0')}`,
    );
    return {
      id: `scenario-radicals-${String(num).padStart(2, '0')}`,
      title: `Радикалы ${start}–${end}`,
      description: `Радикалы Канси №${start}–${end}.`,
      authorId: 'system',
      cardSource: { mode: 'fixed' as const, cardIds },
      published: true,
      updatedAt: '2026-01-01T00:00:00.000Z',
      languagePair: { known: 'ru' as const, learning: 'zh' as const },
    };
  }),
];

export function seedTestContentCache(): void {
  // Default scenarios for tests (no scenario fixtures in the new format)
  setScenarioSeedCache(TEST_DEFAULT_SCENARIOS);

  // Nested course fixtures (statically imported JSON)
  const courseFiles: CoursesNestedFixture[] = [
    courseDemoCardKinds,
    courseZhA1,
    courseZhConversation,
    courseCppComplete,
    courseRuPerlInterview,
    courseZhRadicals214,
  ] as unknown as CoursesNestedFixture[];

  const allCatalogs: CourseCatalogState[] = [];
  const allCards: import('../card/model').Card[] = [];

  for (const fixture of courseFiles) {
    if (isNestedFormat(fixture)) {
      const result = normalizeNestedCourseCatalog(fixture);
      allCatalogs.push(result.catalog);
      allCards.push(...result.cards);
    }
  }

  const catalog: CourseCatalogState = {
    courses: allCatalogs.flatMap((c) => c.courses),
    programs: allCatalogs.flatMap((c) => c.programs),
    lessons: allCatalogs.flatMap((c) => c.lessons),
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
  const course = catalog.courses.find((item) => item.id === 'course-demo-card-kinds');

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
