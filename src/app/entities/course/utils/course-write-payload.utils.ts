import type {
  CourseWritePayload,
  LessonWritePayload,
  ProgramWritePayload,
} from '../repository/course-catalog.port';
import type { CourseWithPrograms } from '../model';

/**
 * Maps a fully resolved course (with programs and lessons) to a write payload
 * for the courses API (`PUT /courses/{id}`).
 *
 * @remarks
 * Pure field mapping WITHOUT business validations — unlike the course-builder
 * draft pipeline (`CourseBuilderStore.normalizeDraft`), which enforces
 * constraints such as «каждый урок должен содержать ≥ 1 сценарий». This mapper
 * is intended for point edits of a persisted course (e.g. binding a scenario
 * to a lesson from the Content Explorer), where the stored catalog is already
 * valid and must be sent back essentially unchanged.
 *
 * All nested collections are copied; original entities are not mutated.
 *
 * @param course - The resolved course with programs and lessons.
 * @returns A `CourseWritePayload` ready for `CourseSearchService.update`.
 */
export function courseWithProgramsToWritePayload(course: CourseWithPrograms): CourseWritePayload {
  const programs: ProgramWritePayload[] = [...course.programs]
    .sort((left, right) => left.order - right.order)
    .map((program) => {
      const lessons: LessonWritePayload[] = [...(program.lessons ?? [])]
        .sort((left, right) => left.order - right.order)
        .map((lesson) => ({
          id: lesson.id,
          programId: lesson.programId || program.id,
          title: lesson.title,
          description: lesson.description,
          scenarioIds: [...lesson.scenarioIds],
          prerequisiteLessonIds: [...lesson.prerequisiteLessonIds].filter((id) => id !== lesson.id),
          order: lesson.order,
        }));

      return {
        id: program.id,
        courseId: program.courseId || course.id,
        title: program.title,
        description: program.description,
        lessonIds: lessons.map((lesson) => lesson.id ?? ''),
        lessons,
        order: program.order,
      };
    });

  const result: import('../repository/course-catalog.port').CourseWritePayload = {
    title: course.title,
    description: course.description,
    published: course.published,
    languagePair: course.languagePair,
    programs,
    ...(course.practiceSettings ? { practiceSettings: course.practiceSettings } : {}),
  };

  // Flatten nested authoring → flat fields matching the backend contract
  if (course.authoring) {
    result.authoringStatus = course.authoring.status;
    result.authoringIdea = course.authoring.idea;
    result.ideaUpdatedAt = course.authoring.ideaUpdatedAt;
    result.materializedAt = course.authoring.materializedAt;
    result.lastError = course.authoring.lastError;
  }

  return result;
}

/**
 * Removes a scenario ID from the `scenarioIds` of a lesson inside a write payload.
 *
 * @remarks
 * Pure helper for point scenario-unbinding (Content Explorer): used after
 * scenario deletion as a defensive cascade — if the backend did not remove
 * the ID from `lesson.scenarioIds`, the explicit course update does. The
 * operation is idempotent. Neither the source payload nor its nested arrays
 * are mutated.
 *
 * @param payload - The course write payload built by
 * {@link courseWithProgramsToWritePayload}.
 * @param lessonId - The ID of the target lesson.
 * @param scenarioId - The scenario ID to remove.
 * @returns A new payload (with copied nested structures) when the lesson was
 * found and the ID was removed; the original payload unchanged if the lesson
 * is missing or the scenario is not bound.
 */
export function removeScenarioFromLessonPayload(
  payload: CourseWritePayload,
  lessonId: string,
  scenarioId: string,
): CourseWritePayload {
  let removed = false;

  const programs: ProgramWritePayload[] = payload.programs.map((program) => {
    if (!program.lessons) {
      return program;
    }

    let programChanged = false;
    const lessons = program.lessons.map((lesson) => {
      if (lesson.id !== lessonId || !lesson.scenarioIds.includes(scenarioId)) {
        return lesson;
      }
      removed = true;
      programChanged = true;
      return {
        ...lesson,
        scenarioIds: lesson.scenarioIds.filter((id) => id !== scenarioId),
      };
    });

    return programChanged ? { ...program, lessons } : program;
  });

  return removed ? { ...payload, programs } : payload;
}

/**
 * Appends a scenario ID to the `scenarioIds` of a lesson inside a write payload.
 *
 * @remarks
 * Pure helper for point scenario-binding (Content Explorer): dedupes the ID and
 * preserves the existing order. Neither the source payload nor its nested arrays
 * are mutated.
 *
 * @param payload - The course write payload built by
 * {@link courseWithProgramsToWritePayload}.
 * @param lessonId - The ID of the target lesson.
 * @param scenarioId - The scenario ID to append.
 * @returns A new payload (with copied nested structures) when the lesson was
 * found and the ID was appended; the original payload unchanged if the lesson
 * is missing or the scenario is already bound.
 */
export function appendScenarioToLessonPayload(
  payload: CourseWritePayload,
  lessonId: string,
  scenarioId: string,
): CourseWritePayload {
  let appended = false;

  const programs: ProgramWritePayload[] = payload.programs.map((program) => {
    if (!program.lessons) {
      return program;
    }

    let programChanged = false;
    const lessons = program.lessons.map((lesson) => {
      if (lesson.id !== lessonId || lesson.scenarioIds.includes(scenarioId)) {
        return lesson;
      }
      appended = true;
      programChanged = true;
      return { ...lesson, scenarioIds: [...lesson.scenarioIds, scenarioId] };
    });

    return programChanged ? { ...program, lessons } : program;
  });

  return appended ? { ...payload, programs } : payload;
}
