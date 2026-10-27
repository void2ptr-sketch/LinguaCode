import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { ScormExportBundle } from './mock/scorm-export.types';
import type { ApiResponse } from '../../../shared/api/api.types';
import { buildApiUrl } from '../../../shared/api/api-url';

/**
 * HTTP API service for SCORM export operations.
 *
 * @remarks
 * Wraps the backend SCORM export endpoint with a Promise-based method.
 * Returns a self-contained `ScormExportBundle` with full course hierarchy
 * and xAPI statements.
 */
@Injectable({ providedIn: 'root' })
export class ScormExportService {
  private readonly http = inject(HttpClient);

  /**
   * Exports a course in SCORM/xAPI format.
   *
   * @param courseId - The course ID.
   * @returns The `ScormExportBundle`.
   *
   * @example
   * ```ts
   * const bundle = await scormExportService.export('course-123');
   * ```
   */
  export(courseId: string): Promise<ScormExportBundle> {
    return firstValueFrom(
      this.http.get<ApiResponse<ScormExportBundle>>(
        buildApiUrl(`/scorm/export/courses/${courseId}`),
      ),
    ).then((response) => response.data);
  }
}
