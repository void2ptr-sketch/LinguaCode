import type { CourseAuthoring, CourseAuthoringStatus } from '../models/course-authoring.types';
import { COURSE_AUTHORING_STATUSES } from '../models/course-authoring.types';

export const COURSE_IDEA_MAX_LENGTH = 16_000;

export function emptyCourseAuthoring(): CourseAuthoring {
  return {
    idea: '',
    status: 'draft',
  };
}

export function isCourseAuthoringStatus(value: string): value is CourseAuthoringStatus {
  return (COURSE_AUTHORING_STATUSES as readonly string[]).includes(value);
}

export function normalizeCourseAuthoring(
  authoring: CourseAuthoring | undefined,
): CourseAuthoring | undefined {
  if (!authoring) {
    return undefined;
  }

  const idea = authoring.idea ?? '';
  const status = isCourseAuthoringStatus(authoring.status) ? authoring.status : 'draft';

  if (!idea.trim() && status === 'draft' && !authoring.materializedAt && !authoring.lastError) {
    return undefined;
  }

  return {
    idea,
    status,
    ideaUpdatedAt: authoring.ideaUpdatedAt,
    materializedAt: authoring.materializedAt,
    lastError: authoring.lastError,
  };
}

export function courseAuthoringWithIdea(
  authoring: CourseAuthoring,
  idea: string,
): CourseAuthoring {
  const trimmed = idea.trim();
  const previousIdea = authoring.idea.trim();

  if (trimmed === previousIdea) {
    return { ...authoring, idea };
  }

  return {
    ...authoring,
    idea,
    ideaUpdatedAt: new Date().toISOString(),
    status: authoring.status === 'materialized' ? 'draft' : authoring.status,
  };
}

export function sameCourseAuthoring(
  left: CourseAuthoring | undefined,
  right: CourseAuthoring | undefined,
): boolean {
  return JSON.stringify(normalizeCourseAuthoring(left) ?? null) ===
    JSON.stringify(normalizeCourseAuthoring(right) ?? null);
}
