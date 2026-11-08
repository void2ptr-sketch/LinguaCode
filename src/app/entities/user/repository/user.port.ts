import type { User } from '../model';

/**
 * Payload for updating a user profile.
 */
export type UpdateUserPayload = {
  displayName?: string;
  preferences?: Record<string, unknown>;
};

/**
 * Data-access contract for user profile operations.
 *
 * @remarks
 * Implemented by `UserApiService` (HTTP). Consumers should depend on
 * this port, not on a concrete implementation, so the data source can be
 * swapped without changing callers.
 */
export type UserPort = {
  /**
   * Retrieves the current user profile (userId from JWT).
   *
   * @returns Promise resolving to the user profile.
   */
  getMe(): Promise<User>;

  /**
   * Updates the current user profile (userId from JWT).
   *
   * @param payload - The update payload.
   * @returns Promise resolving to the updated user profile.
   */
  updateMe(payload: UpdateUserPayload): Promise<User>;
};
