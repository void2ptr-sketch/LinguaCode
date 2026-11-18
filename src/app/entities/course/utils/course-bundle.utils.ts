import type { Card } from '../../card/model';
import type { Lesson } from '../model';
import type { Program } from '../../program/model';
import type { Scenario } from '../../scenario/model';
import type { CardIndexMetaOverride } from '../../card/model';
import type { ToneMark } from '../../phonetic/model/phonetic-content.types';
import type {
  CourseBundle,
  CourseBundleValidation,
  CourseBundleV1,
  CourseBundleTyped,
} from './course-bundle.types';

// ──────────────────────────────────────────────
// Экспорт (collectCourseBundle) — формат v2
// ──────────────────────────────────────────────

/**
 * Собирает самодостаточный CourseBundle v2 для переданного courseId.
 *
 * Обходит граф: Course → Program → Lesson → Scenario → Card,
 * проверяет замкнутость всех ссылок и отсутствие criteria-сценариев.
 *
 * @param courseId    ID курса из resolved catalog
 * @param courses     Разрешённые курсы (seed + overlay)
 * @param programs    Разрешённые программы (seed + overlay)
 * @param lessons     Разрешённые уроки (seed + overlay)
 * @param scenarios   Все сценарии (seed + overlay, resolved)
 * @param cards       Все карточки (seed + overlay, resolved)
 * @param cardIndexMeta Мета-информация из user-content-overlay
 * @returns Пакет или null с описанием ошибки
 */
export function collectCourseBundle(
  courseId: string,
  courses: readonly import('../model').Course[],
  programs: readonly import('../../program/model').Program[],
  lessons: readonly import('../model').Lesson[],
  scenarios: readonly Scenario[],
  cards: readonly Card[],
  cardIndexMeta: Record<string, CardIndexMetaOverride>,
): { bundle: CourseBundle; errors: readonly string[] } | null {
  const errors: string[] = [];

  // 1. Найти курс
  const course = courses.find((c) => c.id === courseId);
  if (!course) {
    errors.push(`Курс ${courseId} не найден в каталоге`);
    return null;
  }

  // 2. Собрать программы
  const programsList: Program[] = [];
  for (const programId of course.programIds) {
    const program = programs.find((p) => p.id === programId);
    if (!program) {
      errors.push(`Программа ${programId} не найдена в каталоге`);
      continue;
    }
    programsList.push(program);
  }

  if (programsList.length === 0) {
    errors.push(`Курс ${courseId} не содержит программ`);
    return null;
  }

  // 3. Собрать уроки из программ
  const lessonsList: Lesson[] = [];
  for (const program of programsList) {
    for (const lessonId of program.lessonIds ?? []) {
      const lesson = lessons.find((l) => l.id === lessonId);
      if (!lesson) {
        errors.push(`Урок ${lessonId} не найден в каталоге`);
        continue;
      }
      lessonsList.push(lesson);
    }
  }

  if (lessonsList.length === 0) {
    errors.push(`Курс ${courseId} не содержит уроков`);
    return null;
  }

  // 4. Собрать сценарии
  const scenarioIds = new Set<string>();
  for (const lesson of lessonsList) {
    for (const sid of lesson.scenarioIds) {
      scenarioIds.add(sid);
    }
  }

  const bundleScenarios: Scenario[] = [];
  for (const sid of scenarioIds) {
    const scenario = scenarios.find((s) => s.id === sid);
    if (!scenario) {
      errors.push(`Сценарий ${sid} не найден`);
      continue;
    }

    // 4a. Запрет criteria-сценариев
    if (scenario.cardSource.mode === 'criteria') {
      errors.push(
        `Сценарий «${scenario.title}» (${sid}) использует criteria-режим. ` +
          `Переведите его в fixed или snapshot перед экспортом.`,
      );
      continue;
    }

    bundleScenarios.push(scenario);
  }

  // 5. Собрать карточки
  const cardIds = new Set<string>();
  for (const scenario of bundleScenarios) {
    if (scenario.cardSource.mode === 'fixed' || scenario.cardSource.mode === 'snapshot') {
      for (const cid of scenario.cardSource.cardIds) {
        cardIds.add(cid);
      }
    }
  }

  const bundleCards: Card[] = [];
  for (const cid of cardIds) {
    const card = cards.find((c) => c.id === cid);
    if (!card) {
      errors.push(`Карточка ${cid} не найдена`);
      continue;
    }
    bundleCards.push(card);
  }

  // 6. Собрать cardIndexMeta + извлечь pinyin/tones из card.promptLexeme
  function extractPinyin(card: Card): string | null {
    const lexeme = (card as Record<string, unknown>)['promptLexeme'] as
      | { pinyin?: string }
      | undefined;
    return lexeme?.pinyin ?? null;
  }

  function extractTones(card: Card): readonly ToneMark[] | null {
    const lexeme = (card as Record<string, unknown>)['promptLexeme'] as
      | { tones?: readonly ToneMark[] }
      | undefined;
    // Если promptLexeme отсутствует — возвращаем null (не undefined)
    if (!lexeme) return null;
    // Если tones есть — возвращаем; если undefined — null
    return lexeme.tones ?? null;
  }

  const bundleMeta: Record<string, CardIndexMetaOverride> = {};
  for (const cid of cardIds) {
    const card = cards.find((c) => c.id === cid);
    if (!card) {
      continue;
    }
    const baseMeta = card.meta ?? cardIndexMeta[cid];
    if (!baseMeta) {
      errors.push(
        `Мета-информация для карточки ${cid} не найдена (нет в card.meta и user-content-overlay)`,
      );
      continue;
    }
    // pinyin / tones — обязательные поля формата v2
    // Приоритет: card.meta > cardIndexMeta > extract из card > null
    const meta: CardIndexMetaOverride = {
      ...baseMeta,
      pinyin: baseMeta.pinyin ?? extractPinyin(card) ?? null,
      tones: baseMeta.tones ?? extractTones(card) ?? null,
    };
    bundleMeta[cid] = meta;
  }

  if (errors.length > 0) {
    return { bundle: null as unknown as CourseBundle, errors };
  }

  // 7. Построить вложенную структуру v2
  const scenarioMap = new Map(bundleScenarios.map((s) => [s.id, s]));
  const cardMap = new Map(bundleCards.map((c) => [c.id, c]));

  const bundledLessons: import('./course-bundle.types').LessonBundle[] = [];
  for (const lesson of lessonsList) {
    const bundledScenarios: import('./course-bundle.types').ScenarioBundle[] = [];
    for (const sid of lesson.scenarioIds) {
      const scenario = scenarioMap.get(sid);
      if (!scenario) continue;

      const bundledCards: import('./course-bundle.types').CardBundle[] = [];
      if (scenario.cardSource.mode === 'fixed' || scenario.cardSource.mode === 'snapshot') {
        for (const cid of scenario.cardSource.cardIds) {
          const card = cardMap.get(cid);
          const meta = card ? bundleMeta[cid] : undefined;
          if (card && meta) {
            // Remove cross-entity references from card
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { courseId: _cc, lessonId: _cl, scenarioId: _cs, programId: _cp, ...cardClean } = card;
            bundledCards.push({
              card: {
                ...cardClean,
                authorId: card.authorId,
                slug: card.slug,
                published: card.published ?? true,
                requiredTier: card.requiredTier,
                order: card.order ?? bundledCards.length,
              },
              order: card.order ?? bundledCards.length,
              meta,
            });
          }
        }
      }

      // Remove cross-entity references from scenario
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { lessonId: _sl, courseId: _sc, programId: _sp, ...scenarioClean } = scenario;
      bundledScenarios.push({
        scenario: {
          ...scenarioClean,
          authorId: scenario.authorId,
          published: scenario.published ?? true,
          requiredTier: scenario.requiredTier,
        },
        order: scenario.order ?? bundledScenarios.length,
        cards: bundledCards,
      });
    }

    // Remove cross-entity references from lesson
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { programId: _lp, courseId: _lc, ...lessonClean } = lesson;
    bundledLessons.push({
      lesson: {
        ...lessonClean,
        authorId: lesson.authorId,
        published: lesson.published ?? true,
        requiredTier: lesson.requiredTier,
      },
      order: lesson.order ?? bundledLessons.length,
      scenarios: bundledScenarios,
    });
  }

  const bundledPrograms: import('./course-bundle.types').ProgramBundle[] = [];
  for (const program of programsList) {
    const programLessons: import('./course-bundle.types').LessonBundle[] = [];
    for (const lessonId of program.lessonIds ?? []) {
      const lesson = bundledLessons.find((l) => l.lesson.id === lessonId);
      if (lesson) {
        programLessons.push(lesson);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { courseId: _programCourseId, ...programWithoutRef } = program;
    bundledPrograms.push({
      program: {
        ...programWithoutRef,
        prerequisiteProgramIds: program.prerequisiteProgramIds ?? [],
        published: program.published ?? true,
        requiredTier: program.requiredTier,
      },
      order: program.order ?? bundledPrograms.length,
      lessons: programLessons,
    });
  }

  return {
    bundle: {
      formatVersion: 2,
      exportedAt: new Date().toISOString(),
      sourceAuthorId: course.authorId,
      course: {
        ...course,
        // Гарантируем presence обязательных полей v2
        authorId: course.authorId ?? course.authorId,
        slug: course.slug,
        order: course.order,
        practiceSettings: course.practiceSettings ?? { mode: 'guided' },
        authoring: {
          ...course.authoring,
          // Гарантируем presence authoring полей
          idea: course.authoring?.idea ?? '',
          status: course.authoring?.status ?? 'draft',
          materializedAt: course.authoring?.materializedAt,
          lastError: course.authoring?.lastError ?? null,
        },
      },
      programs: bundledPrograms,
    },
    errors: [],
  };
}

// ──────────────────────────────────────────────
// Валидация (validateCourseBundle) — v1 и v2
// ──────────────────────────────────────────────

/**
 * Валидирует CourseBundle перед экспортом/импортом.
 * Поддерживает формат v1 (плоские массивы) и v2 (вложенная структура).
 */
export function validateCourseBundle(bundle: CourseBundleTyped): CourseBundleValidation {
  const errors: string[] = [];

  // Narrow the type using a type guard
  const isV1 = (b: CourseBundleTyped): b is CourseBundleV1 => b.formatVersion === 1;
  const isV2 = (b: CourseBundleTyped): b is CourseBundle => b.formatVersion === 2;

  if (isV1(bundle)) {
    return validateCourseBundleV1(bundle);
  }

  if (isV2(bundle)) {
    return validateCourseBundleV2(bundle);
  }

  // At this point, bundle is CourseBundleTyped with unknown formatVersion
  const unknownVersion = (bundle as unknown as { formatVersion: number }).formatVersion;
  errors.push(`Неподдерживаемая версия формата: ${unknownVersion}`);
  return { valid: false, errors };
}

function validateCourseBundleV1(bundle: CourseBundleV1): CourseBundleValidation {
  const errors: string[] = [];

  if (!bundle.exportedAt) {
    errors.push('Отсутствует дата экспорта');
  }

  if (bundle.course.courses.length !== 1) {
    errors.push(`Пакет должен содержать ровно 1 курс, найдено: ${bundle.course.courses.length}`);
  }

  const course = bundle.course.courses[0];
  if (!course) {
    errors.push('Курс не найден в пакете');
    return { valid: false, errors };
  }

  // Проверить программы
  const bundleProgramIds = new Set(bundle.course.programs.map((p) => p.id));
  for (const programId of course.programIds) {
    if (!bundleProgramIds.has(programId)) {
      errors.push(`Программа ${programId} указана в курсе, но отсутствует в пакете`);
    }
  }

  // Собрать все уроки из программ
  const bundleLessonIds = new Set(bundle.course.lessons.map((l) => l.id));
  const allPrograms = bundle.course.programs;
  for (const program of allPrograms) {
    for (const lessonId of program.lessonIds ?? []) {
      if (!bundleLessonIds.has(lessonId)) {
        errors.push(`Урок ${lessonId} указан в программе, но отсутствует в пакете`);
      }
    }
  }

  // Проверить сценарии
  const allScenarioIds = new Set<string>();
  for (const lesson of bundle.course.lessons) {
    for (const sid of lesson.scenarioIds) {
      allScenarioIds.add(sid);
    }
  }

  const bundleScenarioIds = new Set(bundle.scenarios.map((s) => s.id));
  for (const sid of allScenarioIds) {
    if (!bundleScenarioIds.has(sid)) {
      errors.push(`Сценарий ${sid} указан в уроках, но отсутствует в пакете`);
    }
  }

  // Проверить карточки
  const allCardIds = new Set<string>();
  for (const scenario of bundle.scenarios) {
    if (scenario.cardSource.mode === 'criteria') {
      errors.push(
        `Сценарий «${scenario.title}» (${scenario.id}) использует criteria-режим. ` +
          `Экспорт criteria-сценариев не поддерживается.`,
      );
      continue;
    }

    if (scenario.cardSource.mode === 'fixed' || scenario.cardSource.mode === 'snapshot') {
      for (const cid of scenario.cardSource.cardIds) {
        allCardIds.add(cid);
      }
    }
  }

  const bundleCardIds = new Set(bundle.cards.map((c) => c.id));
  for (const cid of allCardIds) {
    if (!bundleCardIds.has(cid)) {
      errors.push(`Карточка ${cid} указана в сценариях, но отсутствует в пакете`);
    }
  }

  // Проверить meta
  const bundleCardById = new Map(bundle.cards.map((c) => [c.id, c]));
  for (const cid of allCardIds) {
    const card = bundleCardById.get(cid);
    const effectiveMeta = card?.meta ?? bundle.cardIndexMeta[cid];
    if (!effectiveMeta) {
      errors.push(
        `Мета-информация для карточки ${cid} отсутствует (нет в card.meta и bundle.cardIndexMeta)`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateCourseBundleV2(bundle: CourseBundle): CourseBundleValidation {
  const errors: string[] = [];

  if (!bundle.exportedAt) {
    errors.push('Отсутствует дата экспорта');
  }

  // Проверить программы
  const programIds = new Set<string>();
  for (const pb of bundle.programs) {
    programIds.add(pb.program.id);
    if (pb.order < 0) {
      errors.push(`Программа ${pb.program.id} имеет отрицательный order: ${pb.order}`);
    }

    // Проверить уроки
    const lessonIds = new Set<string>();
    for (const lb of pb.lessons) {
      lessonIds.add(lb.lesson.id);
      if (lb.order < 0) {
        errors.push(`Урок ${lb.lesson.id} имеет отрицательный order: ${lb.order}`);
      }

      // Проверить сценарии
      const scenarioIds = new Set<string>();
      for (const sb of lb.scenarios) {
        scenarioIds.add(sb.scenario.id);
        if (sb.order < 0) {
          errors.push(`Сценарий ${sb.scenario.id} имеет отрицательный order: ${sb.order}`);
        }

        // Проверить сценарий на criteria
        if (sb.scenario.cardSource.mode === 'criteria') {
          errors.push(
            `Сценарий «${sb.scenario.title}» (${sb.scenario.id}) использует criteria-режим. ` +
              `Экспорт criteria-сценариев не поддерживается.`,
          );
        }

        // Проверить карточки
        const cardIds = new Set<string>();
        for (const cb of sb.cards) {
          cardIds.add(cb.card.id);
          if (cb.order < 0) {
            errors.push(`Карточка ${cb.card.id} имеет отрицательный order: ${cb.order}`);
          }
          if (!cb.meta) {
            errors.push(`Мета-информация для карточки ${cb.card.id} отсутствует`);
          }
        }

        // Проверить замкнутость ссылок в сценарии
        if (
          sb.scenario.cardSource.mode === 'fixed' ||
          sb.scenario.cardSource.mode === 'snapshot'
        ) {
          for (const cid of sb.scenario.cardSource.cardIds) {
            if (!cardIds.has(cid)) {
              errors.push(`Карточка ${cid} указана в сценарии, но отсутствует в пакете`);
            }
          }
        }
      }

      // Проверить замкнутость ссылок в уроке
      for (const sid of lb.lesson.scenarioIds) {
        if (!scenarioIds.has(sid)) {
          errors.push(`Сценарий ${sid} указан в уроке, но отсутствует в пакете`);
        }
      }
    }

    // Проверить замкнутость ссылок в программе
    for (const lessonId of pb.program.lessonIds ?? []) {
      if (!lessonIds.has(lessonId)) {
        errors.push(`Урок ${lessonId} указан в программе, но отсутствует в пакете`);
      }
    }
  }

  // Проверить что programIds курса совпадают с пакетами
  for (const programId of bundle.course.programIds) {
    if (!programIds.has(programId)) {
      errors.push(`Программа ${programId} указана в курсе, но отсутствует в пакете`);
    }
  }

  return { valid: errors.length === 0, errors };
}
