import type { ProgramWithLessons } from '../../../entities/program/model/program.types';
import type {
  CourseWritePayload,
  ProgramWritePayload,
} from '../../../entities/course/api/courses-api.service';
import type { Course } from '../../../entities/course/model';
import type { CourseRequiredTier } from '../../../entities/course/repository/course-catalog.port';
import {
  emptyCourseAuthoring,
  normalizeCourseAuthoring,
} from '../../../entities/course/utils/course-authoring.utils';
import { DEFAULT_COURSE_PRACTICE_SETTINGS } from '../../../entities/course/model';
import type { CourseFormDraft, ProgramFormDraft, LessonFormDraft } from '../types';

/**
 * Flattens a `CourseAuthoring` object into top-level fields matching the
 * backend `CourseCreateRequest` / `CourseUpdateRequest` contract.
 *
 * @param authoring — The nested authoring object (may be undefined).
 * @returns A partial record with flat authoring fields.
 */
function flattenAuthoring(
  authoring: ReturnType<typeof normalizeCourseAuthoring>,
): Partial<CourseWritePayload> {
  if (!authoring) {
    return {};
  }
  return {
    authoringStatus: authoring.status,
    authoringIdea: authoring.idea,
    ideaUpdatedAt: authoring.ideaUpdatedAt,
    materializedAt: authoring.materializedAt,
    lastError: authoring.lastError ?? null,
  };
}

export function lessonDraftKey(lesson: Pick<LessonFormDraft, 'id' | 'clientId'>): string {
  return lesson.id ?? lesson.clientId;
}

export function programDraftKey(program: { id?: string; clientId: string }): string {
  return program.id ?? program.clientId;
}

export const emptyLessonFormDraft = (order = 0): LessonFormDraft => ({
  clientId: crypto.randomUUID(),
  title: '',
  description: '',
  scenarioIds: [],
  prerequisiteLessonIds: [],
  order,
});

export const emptyProgramFormDraft = (order = 0): ProgramFormDraft => ({
  clientId: crypto.randomUUID(),
  title: '',
  description: '',
  lessons: [emptyLessonFormDraft(0)],
  order,
});

export const emptyCourseFormDraft = (): CourseFormDraft => ({
  title: '',
  description: '',
  published: true,
  authoring: emptyCourseAuthoring(),
  practiceSettings: DEFAULT_COURSE_PRACTICE_SETTINGS,
  programs: [emptyProgramFormDraft(0)],
  requiredTier: 'FREE',
  slug: '',
  languagePairId: undefined,
});

export function courseToFormDraft(
  course: Course & { programs: readonly ProgramWithLessons[] },
): CourseFormDraft {
  return {
    title: course.title,
    description: course.description,
    published: course.published,
    authoring: course.authoring ?? emptyCourseAuthoring(),
    practiceSettings: course.practiceSettings ?? DEFAULT_COURSE_PRACTICE_SETTINGS,
    programs: course.programs
      .map((program) => ({
        clientId: program.id,
        id: program.id,
        title: program.title,
        description: program.description,
        lessons: (program.lessons ?? [])
          .map((lesson) => ({
            clientId: lesson.id,
            id: lesson.id,
            title: lesson.title,
            description: lesson.description,
            scenarioIds: [...lesson.scenarioIds],
            prerequisiteLessonIds: [...(lesson.prerequisiteLessonIds ?? [])],
            order: lesson.order,
          }))
          .sort((left, right) => left.order - right.order),
        order: program.order,
      }))
      .sort((left, right) => left.order - right.order),
    requiredTier:
      (course as unknown as { requiredTier?: CourseRequiredTier }).requiredTier ?? 'FREE',
    slug: course.slug,
    languagePairId: course.languagePairId,
  };
}

export function formDraftToCourseWritePayload(draft: CourseFormDraft): CourseWritePayload {
  const programKeyToPersistedId = new Map<string, string>();
  const lessonKeyToPersistedId = new Map<string, string>();

  for (const program of draft.programs) {
    programKeyToPersistedId.set(programDraftKey(program), program.id ?? program.clientId);
  }

  for (const program of draft.programs) {
    for (const lesson of program.lessons) {
      lessonKeyToPersistedId.set(lessonDraftKey(lesson), lesson.id ?? lesson.clientId);
    }
  }

  const programs: ProgramWritePayload[] = draft.programs.map((program, pIndex) => {
    const programId = program.id ?? program.clientId;

    const lessons: import('../../../entities/course/repository/course-catalog.port').LessonWritePayload[] =
      program.lessons.map((lesson, lIndex) => {
        const ownLessonKey = lessonDraftKey(lesson);
        const prerequisiteLessonIds = lesson.prerequisiteLessonIds
          .map((key) => lessonKeyToPersistedId.get(key) ?? key)
          .filter((id) => id !== lessonKeyToPersistedId.get(ownLessonKey));

        return {
          id: lesson.id ?? lesson.clientId,
          programId,
          title: lesson.title,
          description: lesson.description,
          scenarioIds: lesson.scenarioIds,
          prerequisiteLessonIds,
          order: lesson.order ?? lIndex,
        };
      });

    return {
      id: program.id ?? program.clientId,
      courseId: '', // Will be set by the API service
      title: program.title,
      description: program.description,
      lessonIds: lessons.map((l) => l.id ?? ''),
      lessons,
      order: program.order ?? pIndex,
    };
  });

  const normalized = normalizeCourseAuthoring(draft.authoring);
  const flatAuthoring = flattenAuthoring(normalized);
  return {
    title: draft.title,
    description: draft.description,
    published: draft.published,
    ...flatAuthoring,
    // Always forward status/idea (even when empty) so the form can clear
    // previously saved values. Timestamps/error are only forwarded when set.
    authoringStatus: draft.authoring.status,
    authoringIdea: draft.authoring.idea,
    practiceSettings: draft.practiceSettings,
    requiredTier: draft.requiredTier,
    slug: draft.slug,
    programs,
    lastError: 'lastError' in flatAuthoring ? flatAuthoring['lastError'] ?? null : null,
    // languagePairId is resolved to LanguagePair by the API service
    // (CoursesApiService.resolveLanguagePairId). The form draft stores the
    // numeric ID; the payload expects { known, learning } codes.
    languagePairId: draft.languagePairId,
  };
}

export function serializeCourseFormDraft(draft: CourseFormDraft): string {
  return JSON.stringify(draft);
}
