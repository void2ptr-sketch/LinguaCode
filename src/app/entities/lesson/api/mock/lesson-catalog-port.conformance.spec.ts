import type { Lesson } from '../../../course/model/lesson.types';
import { LessonsApiService } from '../lessons-api.service';
import type { LessonCreatePayload, LessonUpdatePayload } from '../lessons-api.service';
import { LessonsCatalogMockHandler } from './lessons-catalog.mock.handler';

/**
 * Data-access contract for the lessons catalog.
 *
 * @remarks
 * Both `LessonsApiService` (HTTP) and `LessonsCatalogMockHandler` (in-memory)
 * must satisfy this contract. A mismatch produces a compile-time error, so a
 * mock/real backend can be swapped without touching consumers.
 */
export type LessonsCatalogPort = {
  /**
   * Retrieves a lesson by ID.
   *
   * @param lessonId - The lesson ID.
   * @returns The lesson entity.
   */
  getById(lessonId: string): Promise<Lesson>;

  /**
   * Retrieves all lessons of a program, ordered by `order`.
   *
   * @param programId - The program ID.
   * @returns Array of lessons for the program.
   */
  getByProgramId(programId: string): Promise<readonly Lesson[]>;

  /**
   * Retrieves all lessons of a course, ordered by program and lesson order.
   *
   * @param courseId - The course ID.
   * @returns Array of lessons in the course.
   */
  getByCourseId(courseId: string): Promise<readonly Lesson[]>;

  /**
   * Creates a new lesson within a program.
   *
   * @param payload - The lesson create payload.
   * @returns The created lesson.
   */
  create(payload: LessonCreatePayload): Promise<Lesson>;

  /**
   * Updates an existing lesson.
   *
   * @param lessonId - The lesson ID.
   * @param payload - The lesson update payload.
   * @returns The updated lesson.
   */
  update(lessonId: string, payload: LessonUpdatePayload): Promise<Lesson>;

  /**
   * Deletes a lesson by ID.
   *
   * @param lessonId - The lesson ID.
   */
  delete(lessonId: string): Promise<void>;
};

/**
 * Compile-time contract conformance.
 *
 * Both the API service (real backend path) and the mock handler (dev backend
 * path) must satisfy the `LessonsCatalogPort` contract. A mismatch produces a
 * compile-time error, so a mock/real backend can be swapped without touching
 * consumers.
 */
type ApiServiceConforms = LessonsApiService extends LessonsCatalogPort ? true : false;
type MockHandlerConforms = LessonsCatalogMockHandler extends LessonsCatalogPort ? true : false;

const apiServiceConforms: ApiServiceConforms = true;
const mockHandlerConforms: MockHandlerConforms = true;

describe('LessonsCatalogPort conformance', () => {
  it('LessonsApiService implements the port contract', () => {
    expect(apiServiceConforms).toBe(true);
  });

  it('LessonsCatalogMockHandler implements the port contract', () => {
    expect(mockHandlerConforms).toBe(true);
  });
});
