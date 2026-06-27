import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiListResponse, ApiResponse } from './api.types';
import { buildApiUrl } from './api-url';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  get<T>(path: string): Promise<T> {
    return firstValueFrom(this.http.get<T>(buildApiUrl(path)));
  }

  getData<T>(path: string): Promise<T> {
    return firstValueFrom(this.http.get<ApiResponse<T>>(buildApiUrl(path))).then(
      (response) => response.data,
    );
  }

  getList<T>(path: string): Promise<readonly T[]> {
    return firstValueFrom(this.http.get<ApiListResponse<T>>(buildApiUrl(path))).then(
      (response) => response.data,
    );
  }

  post<T, B = unknown>(path: string, body: B): Promise<T> {
    return firstValueFrom(this.http.post<T>(buildApiUrl(path), body));
  }

  postData<T, B = unknown>(path: string, body: B): Promise<T> {
    return firstValueFrom(this.http.post<ApiResponse<T>>(buildApiUrl(path), body)).then(
      (response) => response.data,
    );
  }
}
