import type { CourseWithLessons, Lesson, Scenario } from '../../models';
import type { JourneyLocationNode, JourneyContentType } from '../../models/journey.types';

/** Маппинг scenarioId → Scenario для быстрого доступа. */
type ScenarioMap = Map<string, Scenario>;

/**
 * Создаёт карту scenarioId → Scenario из массива сценариев.
 */
export function buildScenarioMap(scenarios: readonly Scenario[]): ScenarioMap {
  return new Map(scenarios.map((s) => [s.id, s]));
}

/**
 * Преобразует одиночный Scenario в JourneyLocationNode.
 * Используется для прямого маппинга из JSON-файлов сценариев.
 */
export function mapScenarioToNode(
  scenario: Scenario,
  options: {
    lessonId: string;
    lessonTitle: string;
    courseId: string;
    courseTitle: string;
    order: number;
    status: JourneyLocationNode['status'];
    contentType: JourneyContentType;
    completionPercent: number;
    visited: boolean;
    favorite: boolean;
    blockReason: string | null;
  },
): JourneyLocationNode {
  const cardCount = scenario.cardSource.mode === 'fixed'
    ? scenario.cardSource.cardIds.length
    : 0;

  return {
    id: `node-${scenario.id}`,
    title: scenario.title,
    description: scenario.description ?? '',
    cardCount,
    order: options.order,
    status: options.status,
    contentType: options.contentType,
    lessonId: options.lessonId,
    lessonTitle: options.lessonTitle,
    courseId: options.courseId,
    courseTitle: options.courseTitle,
    completionPercent: options.completionPercent,
    visited: options.visited,
    favorite: options.favorite,
    blockReason: options.blockReason,
    scenarioId: scenario.id,
  };
}

/**
 * Преобразует CourseWithLessons в массив JourneyLocationNode.
 * Каждый сценарий становится отдельным узлом на карте.
 *
 * @param course — курс с загруженными уроками
 * @param scenarioMap — карта сценариев для получения title/description/cardCount
 * @param hasScenarioResult — возвращает true, если сценарий завершён
 * @param hasScenarioVisit — возвращает true, если сценарий посещён
 * @param getScenarioContentType — возвращает тип контента (по умолчанию 'theory')
 */
export function buildJourneyNodes(
  course: CourseWithLessons,
  scenarioMap: ScenarioMap,
  hasScenarioResult: (scenarioId: string) => boolean,
  hasScenarioVisit: (scenarioId: string) => boolean,
  getScenarioContentType: (scenarioId: string) => JourneyContentType = () => 'theory',
): JourneyLocationNode[] {
  const sortedLessons = [...course.lessons].sort((left, right) => left.order - right.order);
  const lessonsById = buildLessonsById(sortedLessons);
  const allNodes: JourneyLocationNode[] = [];

  for (const lesson of sortedLessons) {
    const isLessonUnlocked = isLessonUnlockedInternal(
      lesson,
      lessonsById,
      hasScenarioResult,
    );
    const isLessonCompleted = isLessonCompletedInternal(lesson, hasScenarioResult);

    for (let order = 0; order < lesson.scenarioIds.length; order++) {
      const scenarioId = lesson.scenarioIds[order];
      const hasResult = hasScenarioResult(scenarioId);
      const hasVisit = hasScenarioVisit(scenarioId);
      const contentType = getScenarioContentType(scenarioId);

      const status = computeScenarioStatus(
        isLessonUnlocked,
        isLessonCompleted,
        hasResult,
        hasVisit,
      );

      const completedScenarios = lesson.scenarioIds.filter((id) => hasScenarioResult(id)).length;
      const completionPercent = lesson.scenarioIds.length > 0
        ? Math.round((completedScenarios / lesson.scenarioIds.length) * 100)
        : 0;

      // Получаем реальные данные сценария из карты
      const scenario = scenarioMap.get(scenarioId);
      const title = scenario?.title ?? `Сценарий ${order + 1}`;
      const description = scenario?.description ?? '';
      const cardCount = scenario?.cardSource.mode === 'fixed'
        ? scenario.cardSource.cardIds.length
        : 0;

      allNodes.push({
        id: `node-${scenarioId}`,
        title,
        description,
        cardCount,
        order: lesson.order * 100 + order,
        status,
        contentType,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        courseId: course.id,
        courseTitle: course.title,
        completionPercent,
        visited: hasVisit,
        favorite: false,
        blockReason: isLessonUnlocked ? null : getBlockReason(lesson, sortedLessons, hasScenarioResult),
        scenarioId,
      });
    }
  }

  return allNodes;
}

function buildLessonsById(lessons: readonly Lesson[]): Map<string, Lesson> {
  return new Map(lessons.map((lesson) => [lesson.id, lesson]));
}

function isLessonUnlockedInternal(
  lesson: Lesson,
  lessonsById: Map<string, Lesson>,
  hasScenarioResult: (scenarioId: string) => boolean,
): boolean {
  const prerequisites = lesson.prerequisiteLessonIds ?? [];

  for (const prerequisiteId of prerequisites) {
    const prerequisite = lessonsById.get(prerequisiteId);
    if (!prerequisite) {
      return false;
    }
    if (!isLessonCompletedInternal(prerequisite, hasScenarioResult)) {
      return false;
    }
  }

  return true;
}

function isLessonCompletedInternal(
  lesson: Lesson,
  hasScenarioResult: (scenarioId: string) => boolean,
): boolean {
  if (lesson.scenarioIds.length === 0) {
    return false;
  }
  return lesson.scenarioIds.every((scenarioId) => hasScenarioResult(scenarioId));
}

function computeScenarioStatus(
  isLessonUnlocked: boolean,
  isLessonCompleted: boolean,
  hasResult: boolean,
  hasVisit: boolean,
): JourneyLocationNode['status'] {
  if (!isLessonUnlocked) {
    return 'locked';
  }
  if (isLessonCompleted) {
    return 'completed';
  }
  if (hasResult) {
    return 'in-progress';
  }
  if (hasVisit) {
    return 'visited';
  }
  return 'available';
}

function getBlockReason(
  lesson: Lesson,
  lessons: readonly Lesson[],
  hasScenarioResult: (scenarioId: string) => boolean,
): string | null {
  const lessonsById = buildLessonsById(lessons);
  const prerequisites = lesson.prerequisiteLessonIds ?? [];

  for (const prerequisiteId of prerequisites) {
    const prerequisite = lessonsById.get(prerequisiteId);
    if (!prerequisite || !isLessonCompletedInternal(prerequisite, hasScenarioResult)) {
      const title = lessons.find((item) => item.id === prerequisiteId)?.title ?? prerequisiteId;
      return `Сначала завершите урок «${title}»`;
    }
  }

  return null;
}
