import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { LessonsService } from '../../../shared/api/generated/lessons';
import type { Lesson } from '../../../shared/api/generated/models';
import type { Lesson as LessonEntity } from '../../course/model/lesson.types';

/**
 * Payload for creating a lesson within a program.
 *
 * @remarks
 * `programId` is a frontend (string) ID — {@link LessonsApiService} converts it
 * to the numeric form required by the backend. `prerequisiteLessonIds` is an
 * array of frontend lesson IDs; the API service serializes it as a raw JSON
 * string per the backend contract.
 */
export type LessonCreatePayload = {
  programId: string;
  title: string;
  description: string;
  order: number;
  prerequisiteLessonIds: readonly string[];
  published?: boolean;
  requiredTier: 'FREE' | 'STARTER' | 'GROWTH' | 'PREMIUM';
  /** Numeric language pair ID from `language_pairs.id`, inherited from parent course. */
  languagePairId?: number;
  /** Course ID this lesson belongs to (inherited from parent program → course). */
  courseId?: string;
};

/**
 * Payload for updating an existing lesson.
 *
 * @remarks
 * Mirrors `LessonUpdateRequest`: `programId` is immutable and therefore absent.
 */
export type LessonUpdatePayload = {
  title: string;
  description: string;
  order: number;
  prerequisiteLessonIds: readonly string[];
  published?: boolean;
  requiredTier?: 'FREE' | 'STARTER' | 'GROWTH' | 'PREMIUM';
  /** Numeric language pair ID from `language_pairs.id`. */
  languagePairId?: number;
  /** Course ID this lesson belongs to. */
  courseId?: string;
};

/**
 * HTTP API service for lesson operations.
 *
 * @remarks
 * Wraps the orval-generated {@link LessonsService} with Promise-based methods
 * and maps backend DTOs to frontend `Lesson` entities:
 * - numeric IDs (`id`, `programId`, `scenarioIds`) ↔ string IDs;
 * - `lessonDescription` ↔ `description`, `lessonOrder` ↔ `order`;
 * - `prerequisiteLessonIds` is a raw JSON string in DTOs (parsed on read,
 *   stringified on write).
 *
 * Slug (non-numeric) IDs pass through unchanged — the mock backend accepts
 * them directly (mirrors {@link ProgramsApiService.create}).
 */
@Injectable({ providedIn: 'root' })
export class LessonsApiService {
  private readonly lessonsService = inject(LessonsService);

  /**
   * Retrieves a lesson by ID.
   *
   * @param lessonId - The lesson ID (numeric string or slug).
   * @returns The mapped lesson entity.
   */
  async getById(lessonId: string): Promise<LessonEntity> {
    const response = await firstValueFrom(
      this.lessonsService.lessonsGetById(toNumericId(lessonId) as number),
    );
    return mapLessonDto(response.data);
  }

  /**
   * Retrieves all lessons of a program, ordered by `order`.
   *
   * @param programId - The program ID (numeric string or slug).
   * @returns Array of mapped lesson entities.
   */
  async getByProgramId(programId: string): Promise<readonly LessonEntity[]> {
    const response = await firstValueFrom(
      this.lessonsService.lessonsGetByProgram(toNumericId(programId) as number),
    );
    return (response.data ?? []).map(mapLessonDto);
  }

  /**
   * Retrieves all lessons of a course, ordered by program and lesson order.
   *
   * @param courseId - The course ID (numeric string or slug).
   * @returns Array of mapped lesson entities.
   */
  async getByCourseId(courseId: string): Promise<readonly LessonEntity[]> {
    const response = await firstValueFrom(
      this.lessonsService.lessonsGetByCourse(toNumericId(courseId) as number),
    );
    return (response.data ?? []).map(mapLessonDto);
  }

  /**
   * Creates a new lesson within a program.
   *
   * @param payload - The lesson create payload.
   * @returns The created lesson entity.
   */
  async create(payload: LessonCreatePayload): Promise<LessonEntity> {
    const response = await firstValueFrom(
      this.lessonsService.lessonsCreate({
        title: payload.title,
        lessonDescription: payload.description,
        // Backend expects a numeric program ID (BIGINT PK); the mock backend
        // understands slug IDs, so non-numeric IDs pass through unchanged.
        programId: toNumericId(payload.programId) as number,
        lessonOrder: payload.order,
        prerequisiteLessonIds: stringifyPrerequisiteLessonIds(payload.prerequisiteLessonIds),
        published: payload.published,
        requiredTier: payload.requiredTier,
        // languagePairId и courseId отсутствуют в сгенерированном типе
        // (LessonCreateRequest), но поддерживаются бэкендом.
        ...(payload.languagePairId != null ? { languagePairId: payload.languagePairId } : {}),
        ...(payload.courseId != null ? { courseId: payload.courseId } : {}),
      } as import('../../../shared/api/generated/models/lessonCreateRequest').LessonCreateRequest & {
        languagePairId?: number;
        courseId?: string;
      }),
    );
    return mapLessonDto(response.data);
  }

  /**
   * Updates an existing lesson.
   *
   * @remarks
   * `programId` is immutable and is not sent (mirrors `LessonUpdateRequest`).
   *
   * @param lessonId - The lesson ID.
   * @param payload - The lesson update payload.
   * @returns The updated lesson entity.
   */
  async update(lessonId: string, payload: LessonUpdatePayload): Promise<LessonEntity> {
    const response = await firstValueFrom(
      this.lessonsService.lessonsUpdate(toNumericId(lessonId) as number, {
        title: payload.title,
        lessonDescription: payload.description,
        lessonOrder: payload.order,
        prerequisiteLessonIds: stringifyPrerequisiteLessonIds(payload.prerequisiteLessonIds),
        published: payload.published,
        requiredTier: payload.requiredTier,
        // languagePairId и courseId отсутствуют в сгенерированном типе
        // (LessonUpdateRequest), но поддерживаются бэкендом.
        ...(payload.languagePairId != null ? { languagePairId: payload.languagePairId } : {}),
        ...(payload.courseId != null ? { courseId: payload.courseId } : {}),
      } as import('../../../shared/api/generated/models/lessonUpdateRequest').LessonUpdateRequest & {
        languagePairId?: number;
        courseId?: string;
      }),
    );
    return mapLessonDto(response.data);
  }

  /**
   * Deletes a lesson by ID (cascades to cards and scenarios).
   *
   * @param lessonId - The lesson ID.
   */
  async delete(lessonId: string): Promise<void> {
    await firstValueFrom(this.lessonsService.lessonsDelete(toNumericId(lessonId) as number));
  }
}

/**
 * Converts a frontend ID to its numeric form when possible.
 *
 * @param id - The frontend ID (numeric string or slug).
 * @returns The numeric ID, or the original string for slugs.
 */
function toNumericId(id: string): number | string {
  return /^\d+$/.test(id) ? Number(id) : id;
}

/**
 * Parses the raw JSON string of prerequisite lesson IDs from a DTO.
 *
 * @param raw - Raw JSON string (e.g. `'["1","2"]'`), or `undefined`.
 * @returns Array of frontend lesson IDs; empty when missing or malformed.
 */
function parsePrerequisiteLessonIds(raw: string | undefined): readonly string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((id) => String(id));
  } catch {
    return [];
  }
}

/**
 * Serializes prerequisite lesson IDs to the raw JSON string expected by the DTO.
 *
 * @param ids - Array of frontend lesson IDs.
 * @returns JSON string, or `undefined` for an empty array (optional field).
 */
function stringifyPrerequisiteLessonIds(ids: readonly string[]): string | undefined {
  return ids.length > 0 ? JSON.stringify(ids) : undefined;
}

/**
 * Maps a backend lesson DTO to the frontend `Lesson` entity.
 *
 * @param dto - The backend DTO (all fields optional per the OpenAPI contract).
 * @returns The mapped lesson entity.
 */
function mapLessonDto(dto: Lesson | undefined): LessonEntity {
  return {
    id: String(dto?.id ?? ''),
    programId: String(dto?.programId ?? ''),
    title: dto?.title ?? '',
    description: dto?.lessonDescription ?? '',
    scenarioIds: (dto?.scenarioIds ?? []).map((scenarioId) => String(scenarioId)),
    prerequisiteLessonIds: parsePrerequisiteLessonIds(dto?.prerequisiteLessonIds),
    order: dto?.lessonOrder ?? 0,
    updatedAt: dto?.updatedAt ?? '',
    published: dto?.published,
    requiredTier: dto?.requiredTier,
    languagePairId: dto?.languagePairId as number | undefined,
    courseId: dto?.courseId ? String(dto.courseId) : undefined,
  };
}
