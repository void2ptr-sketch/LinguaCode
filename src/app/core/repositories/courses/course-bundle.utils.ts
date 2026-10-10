import type { Card } from '../../models';
import type { Lesson } from '../../models';
import type { Scenario } from '../../models';
import type { CardIndexMetaOverride } from '../cards/card-index.mapper';
import type { CourseCatalogState } from './course-catalog-state';
import type { CourseBundle, CourseBundleValidation } from './course-bundle.types';

/**
 * Собирает самодостаточный CourseBundle для переданного courseId.
 *
 * Обходит граф: Course → Lesson → Scenario → Card,
 * проверяет замкнутость всех ссылок и отсутствие criteria-сценариев.
 *
 * @param courseId  ID курса из resolvedCatalog
 * @param catalog   Разрешённый каталог (seed + overlay)
 * @param scenarios Все сценарии (seed + overlay, resolved)
 * @param cards     Все карточки (seed + overlay, resolved)
 * @param cardIndexMeta Мета-информация из user-content-overlay
 * @returns Пакет или null с описанием ошибки
 */
export function collectCourseBundle(
  courseId: string,
  catalog: CourseCatalogState,
  scenarios: readonly Scenario[],
  cards: readonly Card[],
  cardIndexMeta: Record<string, CardIndexMetaOverride>,
): { bundle: CourseBundle; errors: readonly string[] } | null {
  const errors: string[] = [];

  // 1. Найти курс
  const course = catalog.courses.find((c) => c.id === courseId);
  if (!course) {
    errors.push(`Курс ${courseId} не найден в каталоге`);
    return null;
  }

  // 2. Собрать уроки
  const lessons: Lesson[] = [];
  for (const lessonId of course.lessonIds) {
    const lesson = catalog.lessons.find((l) => l.id === lessonId);
    if (!lesson) {
      errors.push(`Урок ${lessonId} не найден в каталоге`);
      continue;
    }
    lessons.push(lesson);
  }

  if (lessons.length === 0) {
    errors.push(`Курс ${courseId} не содержит уроков`);
    return null;
  }

  // 3. Собрать сценарии
  const scenarioIds = new Set<string>();
  for (const lesson of lessons) {
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

    // 3a. Запрет criteria-сценариев
    if (scenario.cardSource.mode === 'criteria') {
      errors.push(
        `Сценарий «${scenario.title}» (${sid}) использует criteria-режим. ` +
          `Переведите его в fixed или snapshot перед экспортом.`,
      );
      continue;
    }

    bundleScenarios.push(scenario);
  }

  // 4. Собрать карточки
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

  // 5. Собрать cardIndexMeta
  // Приоритет: card.meta (встроенные) > cardIndexMeta (из внешнего источника)
  const bundleMeta: Record<string, CardIndexMetaOverride> = {};
  for (const cid of cardIds) {
    const card = cards.find((c) => c.id === cid);
    if (!card) {
      continue;
    }
    // Использовать встроенные метаданные карточки, если есть
    // cardIndexMeta используется только как fallback
    const effectiveMeta = card.meta ?? cardIndexMeta[cid];
    if (effectiveMeta) {
      bundleMeta[cid] = effectiveMeta;
    } else {
      // Если нет ни встроенных, ни во внешнем источнике — ошибка
      errors.push(
        "`Мета-информация для карточки ${cid} не найдена (нет в card.meta и user-content-overlay)`",
      );
    }
  }

  if (errors.length > 0) {
    return { bundle: null as unknown as CourseBundle, errors };
  }

  return {
    bundle: {
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      sourceAuthorId: course.authorId,
      course: {
        courses: [course],
        lessons,
      },
      scenarios: bundleScenarios,
      cards: bundleCards,
      cardIndexMeta: bundleMeta,
    },
    errors: [],
  };
}

/**
 * Валидирует CourseBundle перед экспортом/импортом.
 * Проверяет замкнутость графа зависимостей.
 */
export function validateCourseBundle(bundle: CourseBundle): CourseBundleValidation {
  const errors: string[] = [];

  if (bundle.formatVersion !== 1) {
    errors.push(`Неподдерживаемая версия формата: ${bundle.formatVersion}`);
  }

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

  // Проверить уроки
  const bundleLessonIds = new Set(bundle.course.lessons.map((l) => l.id));
  for (const lessonId of course.lessonIds) {
    if (!bundleLessonIds.has(lessonId)) {
      errors.push(`Урок ${lessonId} указан в курсе, но отсутствует в пакете`);
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

  // Проверить meta (приоритет: card.meta > bundle.cardIndexMeta)
  // Собираем карту всех карточек для быстрого доступа
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
