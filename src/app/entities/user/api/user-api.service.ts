import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { User } from '../model';
import type { UserPreferences } from '../model/user.types';
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
 * Payload for updating user preferences via PATCH.
 */
type UserPreferencesPatch = {
  /** @deprecated use learningPairs instead */
  learningPairKnown?: string;
  /** @deprecated use learningPairs instead */
  learningPairLearning?: string;
  /** Active language pair ID (from UserLanguagePairEntry.id) */
  activeLanguagePairId?: string;
  /** All configured language pairs */
  learningPairs?: Array<{ known: string; learning: string }>;
  interfaceLanguage?: string;
  cardFontSize?: string;
  darkMode?: boolean;
  showPinyin?: boolean;
  showTranscription?: boolean;
  cardsPerDay?: number;
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
   * Retrieves the current user profile (userId from JWT).
   *
   * @returns Promise resolving to the user profile.
   *
   * @example
   * ```ts
   * const user = await userApi.getMe();
   * ```
   */
  getMe(): Promise<User> {
    return firstValueFrom(
      this.http.get<ApiResponse<BackendUserDto>>(buildApiUrl(`/users/me`)),
    ).then((response) => mapBackendUser(response.data));
  }

  /**
   * Updates the current user profile (userId from JWT).
   *
   * @param payload - The update payload (displayName and/or preferences).
   * @returns Promise resolving to the updated user profile.
   *
   * @example
   * ```ts
   * await userApi.updateMe({
   *   displayName: 'New Name',
   * });
   * ```
   */
  updateMe(payload: UpdateUserPayload): Promise<User> {
    return firstValueFrom(
      this.http.put<ApiResponse<BackendUserDto>>(buildApiUrl(`/users/me`), payload),
    ).then((response) => mapBackendUser(response.data));
  }

  /**
   * Partially updates user preferences (PATCH /api/v1/users/me/preferences).
   *
   * @param patch - Fields to update (e.g. learningPairKnown/learningPairLearning).
   * @returns Promise resolving to void (errors are silently ignored).
   */
  patchUserPreferences(patch: UserPreferencesPatch): Promise<void> {
    return firstValueFrom(
      this.http.patch<ApiResponse<unknown>>(buildApiUrl(`/users/me/preferences`), patch),
    )
      .then(() => undefined)
      .catch(() => undefined);
  }
}

/**
 * Maps a backend user DTO to the frontend User type.
 */
function mapBackendUser(dto: BackendUserDto): User {
  return {
    id: dto.id,
    displayName: dto.displayName,
    preferences: parsePreferences(dto.preferences) as UserPreferences,
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
