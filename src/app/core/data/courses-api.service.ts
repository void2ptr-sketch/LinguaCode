import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type {
  CourseIndexEntry,
  CourseSearchCriteria,
  CourseSearchPage,
  CourseWithLessons,
  LanguagePair,
} from '../models';
import type { CourseAuthoring } from '../models/course-authoring.types';
import type { ApiResponse } from '../api/api.types';
import { buildApiUrl } from '../api/api-url';
import { buildCourseSearchParams } from '../api/courses/courses-api.params.utils';

export type LessonWritePayload = {
  id?: string;
  title: string;
  description: string;
  scenarioIds: readonly string[];
  prerequisiteLessonIds?: readonly string[];
  order: number;
};

export type CourseWritePayload = {
  title: string;
  description: string;
  published: boolean;
  languagePair?: LanguagePair;
  lessons: readonly LessonWritePayload[];
  authoring?: CourseAuthoring;
};

@Injectable({ providedIn: 'root' })
export class CoursesApiService {
  private readonly http = inject(HttpClient);

  search(criteria: CourseSearchCriteria): Promise<CourseSearchPage> {
    return firstValueFrom(
      this.http.get<ApiResponse<CourseSearchPage>>(buildApiUrl('/courses/search'), {
        params: buildCourseSearchParams(criteria),
      }),
    ).then((response) => response.data);
  }

  getById(courseId: string): Promise<CourseWithLessons> {
    return firstValueFrom(
      this.http.get<ApiResponse<CourseWithLessons>>(buildApiUrl(`/courses/${courseId}`)),
    ).then((response) => response.data);
  }

  create(payload: CourseWritePayload): Promise<CourseWithLessons> {
    return firstValueFrom(
      this.http.post<ApiResponse<CourseWithLessons>>(buildApiUrl('/courses'), payload),
    ).then((response) => response.data);
  }

  update(courseId: string, payload: CourseWritePayload): Promise<CourseWithLessons> {
    return firstValueFrom(
      this.http.put<ApiResponse<CourseWithLessons>>(buildApiUrl(`/courses/${courseId}`), payload),
    ).then((response) => response.data);
  }

  delete(courseId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<ApiResponse<null>>(buildApiUrl(`/courses/${courseId}`)),
    ).then(() => undefined);
  }

  findUsingScenario(scenarioId: string): Promise<readonly CourseIndexEntry[]> {
    return firstValueFrom(
      this.http.get<ApiResponse<readonly CourseIndexEntry[]>>(
        buildApiUrl(`/courses/by-scenario/${scenarioId}`),
      ),
    ).then((response) => response.data);
  }
}
