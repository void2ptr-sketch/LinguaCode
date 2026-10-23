import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { User } from '../model';
import type { ApiResponse } from '../../../shared/api/api.types';
import type { UpdateUserPayload, UserPort } from '../repository/user.port';
import { buildApiUrl } from '../../../shared/api/api-url';

/**
 * Backend DTO for user data (matches `UserDto`).
 */
type BackendUserDto = {
  id: string;
  displayName: string;
  email: string;
  preferences: string | Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

/**
 * HTTP API service for user profile operations.
 *
 * @remarks
 * Wraps the backend user API with Promise-based methods. Implements the
 * `UserPort` data-access contract.
 */
@Injectable({ providedIn: 'root' })
export class UserApiService implements UserPort {
  private readonly http = inject(HttpClient);

  /**
   * Retrieves the current user profile.
   *
   * @param userId - The user ID.
   * @returns Promise resolving to the user profile.
   *
   * @example
   * ```ts
   * const user = await userApi.getMe('user-123');
   * ```
   */
  getMe(userId: string): Promise<User> {
    return firstValueFrom(
      this.http.get<ApiResponse<BackendUserDto>>(buildApiUrl(`/users/me`), {
        params: { userId },
      }),
    ).then((response) => mapBackendUser(response.data));
  }

  /**
   * Updates the current user profile.
   *
   * @param userId - The user ID.
   * @param payload - The update payload (displayName and/or preferences).
   * @returns Promise resolving to the updated user profile.
   *
   * @example
   * ```ts
   * await userApi.updateMe('user-123', {
   *   displayName: 'New Name',
   * });
   * ```
   */
  updateMe(userId: string, payload: UpdateUserPayload): Promise<User> {
    return firstValueFrom(
      this.http.put<ApiResponse<BackendUserDto>>(buildApiUrl(`/users/me`), {
        userId,
        ...payload,
      }),
    ).then((response) => mapBackendUser(response.data));
  }
}

/**
 * Maps a backend user DTO to the frontend User type.
 */
function mapBackendUser(dto: BackendUserDto): User {
  return {
    id: dto.id,
    displayName: dto.displayName,
    preferences: parsePreferences(dto.preferences),
  };
}

/**
 * Parses user preferences from backend format.
 *
 * @remarks
 * Backend stores preferences as a JSON string; frontend expects an object.
 */
function parsePreferences(raw: string | Record<string, unknown>): Record<string, unknown> {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
}
