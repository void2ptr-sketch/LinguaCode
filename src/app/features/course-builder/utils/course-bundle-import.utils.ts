/**
 * Utility for extracting flat entity maps from a CourseBundle.
 *
 * @remarks
 * Inverse of `collectCourseBundle`. Walks the v2 nested structure
 * (`programs[].lessons[].scenarios[].cards[]`) or v1 flat arrays
 * and returns `Record<string, T>` maps keyed by entity ID.
 */
import type { Card, CardIndexMetaOverride } from '../../../entities/card/model';
import type { Course, Lesson } from '../../../entities/course/model';
import type { Program } from '../../../entities/program/model';
import type { Scenario } from '../../../entities/scenario/model';
import type {
  CourseBundle,
  CourseBundleTyped,
  CourseBundleV1,
} from '../../../entities/course/utils/course-bundle.types';

/** Flat entity maps extracted from a CourseBundle. */
export type ExtractedEntities = {
  courses: Record<string, Course>;
  programs: Record<string, Program>;
  lessons: Record<string, Lesson>;
  scenarios: Record<string, Scenario>;
  cards: Record<string, Card>;
  cardIndexMeta: Record<string, CardIndexMetaOverride>;
};

/** Type guard: v2 bundle (formatVersion === 2). */
function isV2(bundle: CourseBundleTyped): bundle is CourseBundle {
  return bundle.formatVersion === 2;
}

/** Type guard: v1 bundle (formatVersion === 1). */
function isV1(bundle: CourseBundleTyped): bundle is CourseBundleV1 {
  return bundle.formatVersion === 1;
}

// ──────────────────────────────────────────────
// v2 — вложенная структура
// ──────────────────────────────────────────────

function extractFromV2(bundle: CourseBundle): ExtractedEntities {
  const courses: Record<string, Course> = { [bundle.course.id]: bundle.course };
  const programs: Record<string, Program> = {};
  const lessons: Record<string, Lesson> = {};
  const scenarios: Record<string, Scenario> = {};
  const cards: Record<string, Card> = {};
  const cardIndexMeta: Record<string, CardIndexMetaOverride> = {};

  for (const pb of bundle.programs) {
    programs[pb.program.id] = pb.program;

    for (const lb of pb.lessons) {
      lessons[lb.lesson.id] = lb.lesson;

      for (const sb of lb.scenarios) {
        scenarios[sb.scenario.id] = sb.scenario;

        for (const cb of sb.cards) {
          cards[cb.card.id] = cb.card;
          cardIndexMeta[cb.card.id] = cb.meta;
        }
      }
    }
  }

  return { courses, programs, lessons, scenarios, cards, cardIndexMeta };
}

// ──────────────────────────────────────────────
// v1 — плоские массивы
// ──────────────────────────────────────────────

function extractFromV1(bundle: CourseBundleV1): ExtractedEntities {
  const courses: Record<string, Course> = {};
  for (const c of bundle.course.courses) {
    courses[c.id] = c;
  }

  const programs: Record<string, Program> = {};
  for (const p of bundle.course.programs) {
    programs[p.id] = p;
  }

  const lessons: Record<string, Lesson> = {};
  for (const l of bundle.course.lessons) {
    lessons[l.id] = l;
  }

  const scenarios: Record<string, Scenario> = {};
  for (const s of bundle.scenarios) {
    scenarios[s.id] = s;
  }

  const cards: Record<string, Card> = {};
  for (const c of bundle.cards) {
    cards[c.id] = c;
  }

  return {
    courses,
    programs,
    lessons,
    scenarios,
    cards,
    cardIndexMeta: bundle.cardIndexMeta,
  };
}

/**
 * Извлекает плоские записи из v1 (плоские массивы) или v2 (вложенная структура).
 *
 * @param bundle — CourseBundle в формате v1 или v2.
 * @returns Map сущностей по ID, или `null` если формат неизвестен.
 */
export function extractEntitiesFromBundle(
  bundle: CourseBundleTyped,
): ExtractedEntities | null {
  if (isV2(bundle)) {
    return extractFromV2(bundle);
  }

  if (isV1(bundle)) {
    return extractFromV1(bundle);
  }

  return null;
}
