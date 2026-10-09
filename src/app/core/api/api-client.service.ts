import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiListResponse, ApiResponse } from './api.types';
import { buildApiUrl } from './api-url';

/**
 * Generic HTTP API client with Promise-based methods.
 *
 * @remarks
 * Wraps Angular's HttpClient with URL building and response unwrapping.
 * All methods return Promises for synchronous-style consumption.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  /**
   * Performs a GET request and returns the parsed response.
   *
   * @typeParam T - The expected response type.
   * @param path - The API path.
   * @returns A Promise resolving to the response body.
   */
  get<T>(path: string): Promise<T> {
    return firstValueFrom(this.http.get<T>(buildApiUrl(path)));
  }

  /**
   * Performs a GET request and extracts the `data` field from the response envelope.
   *
   * @typeParam T - The expected data type inside the response envelope.
   * @param path - The API path.
   * @returns A Promise resolving to the unwrapped data.
   */
  getData<T>(path: string): Promise<T> {
    return firstValueFrom(this.http.get<ApiResponse<T>>(buildApiUrl(path))).then(
      (response) => response.data,
    );
  }

  /**
   * Performs a GET request for a list and extracts the `data` field.
   *
   * @typeParam T - The type of items in the list.
   * @param path - The API path.
   * @returns A Promise resolving to the unwrapped array.
   */
  getList<T>(path: string): Promise<readonly T[]> {
    return firstValueFrom(this.http.get<ApiListResponse<T>>(buildApiUrl(path))).then(
      (response) => response.data,
    );
  }

  /**
   * Performs a POST request and returns the parsed response.
   *
   * @typeParam T - The expected response type.
   * @typeParam B - The request body type (defaults to `unknown`).
   * @param path - The API path.
   * @param body - The request body.
   * @returns A Promise resolving to the response body.
   */
  post<T, B = unknown>(path: string, body: B): Promise<T> {
    return firstValueFrom(this.http.post<T>(buildApiUrl(path), body));
  }

  /**
   * Performs a POST request and extracts the `data` field from the response envelope.
   *
   * @typeParam T - The expected data type inside the response envelope.
   * @typeParam B - The request body type (defaults to `unknown`).
   * @param path - The API path.
   * @param body - The request body.
   * @returns A Promise resolving to the unwrapped data.
   */
  postData<T, B = unknown>(path: string, body: B): Promise<T> {
    return firstValueFrom(this.http.post<ApiResponse<T>>(buildApiUrl(path), body)).then(
      (response) => response.data,
    );
  }
}
