import type { Program, ProgramWithLessons } from '../model';
import type { ProgramSearchCriteria, ProgramSearchPage } from '../model/program-search.types';

/**
 * Payload for creating or updating a program via the programs API.
 *
 * @remarks
 * Used in `ProgramsApiService` to send program data to the backend.
 */
export type ProgramWritePayload = {
  /** Program ID (optional for creation). */
  id?: string;
  /** ID of the parent Course this program belongs to. */
  courseId: string;
  /** Display title of the program. */
  title: string;
  /** Program description shown in the catalog. */
  description: string;
  /** IDs of lessons contained in this program, in order. */
  lessonIds: readonly string[];
  /** Display order within the parent Course. */
  order: number;
};

/**
 * Data-access contract for the program catalog.
 *
 * @remarks
 * Implemented by `ProgramsApiService` (HTTP). Mock handlers implement the same
 * contract server-side. Consumers should depend on this port, not on a concrete
 * implementation, so the data source can be swapped without changing callers.
 */
export type ProgramCatalogPort = {
  /**
   * Searches programs by criteria.
   *
   * @param criteria - The search criteria.
   * @returns A page of program index entries.
   */
  search(criteria: ProgramSearchCriteria): Promise<ProgramSearchPage>;

  /**
   * Retrieves a program with its lessons fully resolved.
   *
   * @param programId - The program ID.
   * @returns The program with lessons.
   */
  getById(programId: string): Promise<ProgramWithLessons>;

  /**
   * Retrieves all programs for a given course.
   *
   * @param courseId - The course ID.
   * @returns Array of programs in the course.
   */
  getByCourse(courseId: string): Promise<readonly Program[]>;

  /**
   * Creates a new program within a course.
   *
   * @param payload - The program write payload.
   * @returns The created program.
   */
  create(payload: ProgramWritePayload): Promise<Program>;

  /**
   * Updates an existing program.
   *
   * @param programId - The program ID.
   * @param payload - The program write payload.
   * @returns The updated program.
   */
  update(programId: string, payload: ProgramWritePayload): Promise<Program>;

  /**
   * Deletes a program by ID.
   *
   * @param programId - The program ID.
   */
  delete(programId: string): Promise<void>;
};
